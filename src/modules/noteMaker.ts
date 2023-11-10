import ZoteroToolkit from "zotero-plugin-toolkit";
import { getString } from "../utils/locale";
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
            const noteTxt = this.titleHtml + this.content + "</div>";
            this.note.setNote(noteTxt);
            await this.note.saveTx();
        }
    }

    async getFontNote() {
        let item;
        if (this.itemID) {
            item = Zotero.Items.get(this.itemID);
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
            //如果多个同名笔记，认为不是目标笔记，
            const oldNotes = notesRelate.filter((note: Zotero.Item) => note.getNoteTitle() == this.title);
            let oldNote;
            if (oldNotes.length == 1) {
                oldNote = oldNotes[0];
                this.note = oldNote;
                return oldNote;
            }
            if (oldNotes.length > 1) {
                fullTextTranslate.showInfo(getString("info-unableConfirmNote"), 3000);
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
        return `<${tag}>${body}</${tag}>`;
    };
}
