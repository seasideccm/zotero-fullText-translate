import { getString } from "../utils/locale";
import { base64ToBlob } from "../utils/prefs";
import { fullTextTranslate } from "./fullTextTranslate";



export class NoteMaker {
    title?: string;
    titleHtml?: string;
    parentItemKey?: string;
    content?: any;
    itemID?: number;
    libraryID?: number;
    collectionName?: string;
    collectionID?: number;
    note?: Zotero.Item;
    noteVersion?: number;
    allowSameTitle?: boolean;
    tableData?: {
        [keyString: string]: {
            dataArr?: any[][];
            header?: string[];
        };
    };

    constructor(
        option: {
            title?: string;
            titleHtml?: string;
            parentItemKey?: string;
            content?: any;
            itemID?: number;
            libraryID?: number;
            collectionName?: string;
            collectionID?: number;
            note?: Zotero.Item;
            noteVersion?: number;
            allowSameTitle?: boolean;
            tableData?: {
                [keyString: string]: {
                    dataArr?: any[][];
                    header?: string[];
                };
            };
        }
    ) {
        this.titleHtml = this.addTitle(option.title);
        this.title = option.title;
        this.content = option.content;
        this.noteVersion = option.noteVersion || 9;
        this.itemID = option.itemID;
        this.collectionName = option.collectionName;
        this.collectionID = option.collectionID;
        this.allowSameTitle = option.allowSameTitle || false;
        this.tableData = option.tableData;
        this.note = option.note;
    }

    //根据分类名选中分类或创建并选中
    async selectFontCollection(collectionName?: string) {
        if (!this.collectionName && collectionName) {
            this.collectionName = collectionName;
        }
        if (!this.collectionName) {
            this.collectionName = Zotero.getString('pane.collections.untitled');
        }
        let collectionID: number;
        const libraryID = Zotero.Libraries.userLibraryID;
        const allCollections = Zotero.Collections.getByLibrary(libraryID);
        let fontCollection = allCollections.filter((c: Zotero.Collection) => c.name == this.collectionName)[0];
        if (fontCollection) {
            collectionID = fontCollection.id;
        } else {
            fontCollection = new Zotero.Collection;
            fontCollection.libraryID = libraryID;
            fontCollection.name = this.collectionName!;
            collectionID = await fontCollection.saveTx() as number;
        }
        const zp = ztoolkit.getGlobal("ZoteroPane");
        zp.collectionsView.selectCollection(collectionID);
        this.collectionID = collectionID;
        return collectionID;
    }

    async makeNote() {
        const note = await this.getFontNote();
        if (!note) {
            this.note = new Zotero.Item('note');
            if (this.parentItemKey) {
                this.note.parentItemKey = this.parentItemKey;
            } else if (this.collectionID) {
                this.note.addToCollection(this.collectionID);
            } else if (this.itemID) {
                const item = Zotero.Items.get(this.itemID);

                if (item.getCollections().length == 1) {
                    this.note.addToCollection(item.getCollections()[0]);
                }
                else {
                    const zp = Zotero.getActiveZoteroPane();
                    this.note.addToCollection(zp.collectionsView.selectedTreeRow.ref.id);
                }
                this.note.libraryID = this.libraryID || Zotero.Libraries.userLibraryID;
            }
        }
        const noteTxt = this.titleHtml + this.content + "</div>";
        this.note!.setNote(noteTxt);
        const noteID = await this.note!.saveTx();
        if (typeof noteID == "number") {
            return noteID;
        }
    }

    /**
     * 按标题或id，找字体笔记
     * @returns 
     */
    async getFontNote() {
        if (this.note) {
            return this.note;
        }

        if (this.itemID) {
            const item = Zotero.Items.get(this.itemID);
            if (item.isNote()) {
                this.note = item;
                if (item.parentItemKey) {
                    this.parentItemKey = item.parentItemKey;
                    this.libraryID = item.libraryID;
                }
            }
        }
        if (this.title && this.note && this.note.getNoteTitle() == this.title) {
            return this.note;
        }
        const notesRelate = await this.getFontRelatedAllNotes();
        if (!this.allowSameTitle) {
            const oldNotes = notesRelate.filter((note: Zotero.Item) => note.getNoteTitle() == this.title);
            let oldNote;
            if (oldNotes.length == 1) {
                oldNote = oldNotes[0];
                this.note = oldNote;
                return this.note;
            }
            if (oldNotes.length > 1) {
                //同名笔记返回最新的
                oldNotes.sort((a, b) => {
                    return (b.dateModified > a.dateModified ? -1 : (b.dateModified < a.dateModified ? 1 : 0));
                });
                this.note = oldNotes[0];
                fullTextTranslate.showInfo(getString("info-selectLastNote"), 3000);
                return this.note;
            }

        }
    }

    async getFontRelatedAllNotes() {
        let item, notesIDs, notesOfItem;
        if (this.itemID) {
            item = Zotero.Items.get(this.itemID);
            if (item.isRegularItem()) {
                this.parentItemKey = item.key;
                this.libraryID = item.libraryID;
                //获取条目笔记ID
                notesIDs = item.getNotes();
            } else if (item.parentItemKey && !item.isNote()) {
                this.parentItemKey = item.parentItemKey;
                this.libraryID = item.libraryID;
                const parentItem = Zotero.Items.getByLibraryAndKey(item.libraryID, item.parentItemKey);
                if (parentItem && (parentItem as Zotero.Item).isRegularItem()) {
                    notesIDs = (parentItem as Zotero.Item).getNotes();
                }
            }
        }
        //限定在所有独立笔记，或当前分类所选条目子笔记
        const notesRelate = [];
        const zp = Zotero.getActiveZoteroPane();
        const libraryID = Zotero.Libraries.userLibraryID;
        //不含子条目       
        const allItems = await Zotero.Items.getAll(libraryID, true);
        const notesOfUserLibrary = allItems.filter((item: Zotero.Item) => item.itemType == "note");
        notesRelate.push(...notesOfUserLibrary);
        const collection = zp.getSelectedCollection();
        if (collection) {
            const itemsOfCollection = collection.getChildItems();
            const notesOfCurrentCollection = itemsOfCollection.filter((item: Zotero.Item) => item.itemType == "note");
            notesRelate.push(...notesOfCurrentCollection);
        }
        if (notesIDs) {
            //获取条目笔记
            notesOfItem = notesIDs.map((noteID: number) => Zotero.Items.get(noteID));
            notesRelate.push(...notesOfItem);
        }
        return notesRelate;
    }
    addTable(
        dataArr: any[][],
        header: string[],
        tableIndex: string,
    ) {
        const rowArr = [];
        let headerHtml, captionHtml;
        for (let tr = 0; tr < dataArr.length; tr++) {
            const rowDataArr = [];
            for (let td = 0; td < dataArr[tr].length; td++) {
                rowDataArr.push(this.dataToBody(dataArr[tr][td], "td"));
            }
            rowArr.push(this.dataToBody(rowDataArr.join(""), "tr"));
        }
        const bodyHtml = `<tbody>${rowArr.join("")}</tbody>`;
        //zotero note 不支持 caption 表头
        /*         if (caption) {
                    captionHtml = this.tablecaption(caption);
                } */
        if (header) {
            headerHtml = this.tableHeader(header);
        }
        const tableHtml = this.addHeadTail(bodyHtml, headerHtml, captionHtml);
        //对象属性content内容更新
        this.content += tableHtml;
        //返回表格html，供其他情况使用
        return tableHtml;
    }
    async getImgHtml(imageData: {
        width: number;
        height: number;
        base64: string;
    }) {
        let blob;
        const width = imageData.width > 800 ? 800 : imageData.width;
        const height = imageData.height > 600 ? 600 : imageData.height;
        if (imageData.base64 && imageData.base64.startsWith('data:')) {
            blob = base64ToBlob(imageData.base64);
        }
        if (!blob) return;
        const attachment = await Zotero.Attachments.importEmbeddedImage({
            blob,
            parentItemID: this.note!.id,
        });
        //<img alt="" data-attachment-key="EHT4NWK7" width="203" height="126">
        const imgHtml: string = `<img alt="" data-attachment-key="${attachment.key}" width="${width}" height="${height}">`;
        return imgHtml;
    }
    async tableInsertContent(option: {
        [primaryKey: string]: string;
    }, field?: string,
        rowIndex?: number
    ) {
        //定位字段在数组中的索引      
        if (!this.content) {
            if (this.note) {
                this.content = this.note.getNote();
            } else {
                return;
            }
        }
        //查找标题开始标志,必须定义 Regex 才可以不断向前
        // exec 每次匹配一项，reg 如有全局标识 g，则下次查找会从记录的索引处开始
        //为了reg始终记录index，在最顶层定义

        //定位表格
        const regTable = makeRegExp("table");
        //定位标题单元格
        const regHeaderWhole = makeRegExp("th");
        //定位行
        const regRow = makeRegExp("tr");


        const primaryKeys = Object.keys(option);
        const content = this.content;
        const contentArr = [];
        let getResult = checkTable(content).next();
        let result = getResult.done;
        while (result != undefined && result == false && getResult.value) {
            const tableContent = getResult.value;
            const fieldIndex = getFieldIndex(tableContent, field, rowIndex);
            if (fieldIndex && fieldIndex != -1) {
                //查找行,处理完行再找下一个表格
                let tableContentModify = tableContent!;
                //primaryKey在表格中可能并非顺序排列，故每次检查整张表
                for (const primaryKey of primaryKeys) {
                    const insertContent = option[primaryKey];
                    //在表格中找到目标行
                    const resultRow = findRow(primaryKey, tableContentModify);
                    if (!resultRow || resultRow.matchContent.includes(insertContent)) continue;
                    //在行中找到目标单元格并插入内容
                    const cellEndIndex = findCellInsertContent(fieldIndex, resultRow.matchContent);
                    if (!cellEndIndex) continue;
                    //修改表格内容，在目标单元格尾部插入内容
                    const insertIndex = resultRow.startIndex + cellEndIndex;
                    tableContentModify = tableContentModify.slice(0, insertIndex) + insertContent + tableContentModify.slice(insertIndex);
                }
                contentArr.push(tableContentModify);
            }

            getResult = checkTable(content).next();
            result = getResult.done;
        }
        this.content = contentArr.join("");
        await this.makeNote();

        function makeRegExp(tag: string, matchMode: "lazy" | "greedy" = "lazy") {
            return matchMode == "lazy" ? new RegExp(`(?<=<${tag}>).+?(?=</${tag}>)`, "g") : new RegExp(`(?<=<${tag}>).+(?=</${tag}>)`, "g");
        }
        /**
         * 传入 reg 可反复调用，连续匹配         * 
         * 默认为懒惰匹配
         * @param reg 
         * @param content 
         * @returns 
         */
        function startEndIndex(reg: RegExp, content: string) {
            const result = reg.exec(content);
            if (!result) return;
            const startIndex = result.index;
            const endIndex = startIndex + result[0].length;
            return {
                startIndex: startIndex,
                endIndex: endIndex,
                matchContent: result[0],
            };
        }

        function* checkTable(content: string) {
            let resultTable = startEndIndex(regTable, content);
            //找不到目标表格（可能并非首张表格），退出循环
            while (resultTable) {
                const primaryKeysIncluded = primaryKeys.filter(primaryKey => resultTable!.matchContent.includes(primaryKey));
                if (primaryKeysIncluded.length) {
                    //找到目标表格
                    //按顺序分割文本，提出操作表格，剩余部分作为查找下张表的内容
                    contentArr.push(content.slice(0, resultTable.startIndex));
                    const tableContent = resultTable.matchContent;
                    content = content.slice(resultTable.startIndex + tableContent.length);
                    yield tableContent;
                }
                //找不到关键字段，查找下一个表格
                resultTable = startEndIndex(regTable, content);
            }
            //将剩余文本纳入数组中
            contentArr.push(content);
        }

        function getFieldIndex(tableContent: string, field?: string, rowIndex?: number) {
            if (rowIndex) {
                return rowIndex;
            }
            if (!field) return;
            let resultHeader = startEndIndex(regHeaderWhole, tableContent);
            const headerArr = [];
            while (resultHeader) {
                headerArr.push(resultHeader.matchContent);
                resultHeader = startEndIndex(regHeaderWhole, tableContent);
            }
            //定位字段在数组中的索引

            return headerArr.indexOf(field);
        }

        function findRow(primaryKey: string, content: string) {
            let resultRow = startEndIndex(regRow, content);
            while (resultRow) {
                if (resultRow.matchContent.includes(primaryKey)) {
                    return resultRow;
                };
                resultRow = startEndIndex(regRow, content);
            }
        }

        function findCellInsertContent(fieldIndex: number, contentRow: string) {
            //定位单元格
            const regCell = makeRegExp("td");
            let resultCell = startEndIndex(regCell, contentRow);
            //确定查找次数
            let i = fieldIndex + 1;
            while (i && resultCell) {
                i -= 1;
                if (i == 0 && resultCell) {
                    return resultCell.endIndex;
                }
                resultCell = startEndIndex(regCell, contentRow);
            }






            /* while (i && strIndex && strIndex < rowEndIndex) {//应该是表格边界
                i -= 1;
                //确保向前搜索，如果符合条件的单元格索引小于等于行索引，就继续向前
                let strIndexTemp: number | undefined = strIndex;
                while (strIndexTemp && strIndexTemp <= strIndex) {
                    strIndexTemp = regCell.exec(content)?.index;
                }
                strIndex = strIndexTemp;
            }
            if (strIndex) {
                //插入内容
                content = content.slice(0, strIndex) + imgHtml + content.slice(strIndex);
                //查找下一行，重置i，此时strIndex为真，继续内层 while 循环
                i = fieldIndex + 1;
            } else {
                //单元格未找到，该表格结束
                return;
            } */

        }
    }



    addTitle(title?: string) {
        if (!title) {
            return `<div data-schema-version="${this.noteVersion}">`;
        } else {

            return `<div data-schema-version="${this.noteVersion}"><p>${title}</p>`;
        }
    }
    addContent(text: string) {
        this.content += Zotero.Utilities.text2html(text);
    }

    async creatNote() {
        const note = new Zotero.Item('note');
        note.libraryID = 1;
        const zp = Zotero.getActiveZoteroPane();
        note.setNote("noteTxt");
        await note.saveTx();
    }

    addHeadTail = (body: string, header?: string, caption?: string) => {
        return header ? (
            caption ? (`<table>${caption}${header}${body}</table>`)
                : (`<table>${header}${body}</table>`)
        )
            : (caption ? (`<table>${caption}${body}</table>`)
                : (`<table>${body}</table>`));
    };

    tableHeader = (header: string[]) => {
        const th: string[] = [];
        header.filter((e: string) => {
            th.push(`<th>${e}</th>`);
        });
        return "<thead>" + th.join("") + "</thead>";
    };

    tablecaption = (body: string) => {
        return `<caption>${body}</caption>`;
    };

    dataToBody = (body: string, tag: "td" | "tr" | "th") => {
        if (Array.isArray(body)) {
            body = body.join("<br>");
        }
        return `<${tag}>${body}</${tag}>`;
    };
}




