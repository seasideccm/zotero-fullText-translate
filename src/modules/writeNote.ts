import { getString } from "../utils/locale";
import { fullTextTranslate } from "./fullTextTranslate";



export class WriteNote {


    title: string;
    content: any;
    itemID?: number;
    note!: Zotero.Item;
    noteVersion: number;
    allowSameTitle: boolean;
    tableData?: {
        [tableId: string]: {
            dataArr: any[][];
            caption?: string;
            header?: string;
        };
    };
    constructor(options: any = {}, itemID?: number) {
        this.title = this.addTitle(options.title);
        this.content = '';
        this.noteVersion = options.noteVersion || 9;
        this.itemID = itemID;
        this.allowSameTitle = options.allowSameTitle || false;
        this.tableData = options.tableData;

    }

    async makeNote() {
        //parentKey==parentItemKey
        let item, parentItemKey, isCreatNote, notesIDOfItem, notesOfItem;
        if (this.itemID) {
            item = Zotero.Items.get(this.itemID);
            if (item.isNote()) {
                this.note = item;
                if (item.parentItemKey) {
                    parentItemKey = item.parentItemKey;
                }
            } else
                if (item.isRegularItem()) {
                    isCreatNote = true;
                    parentItemKey = item.key;
                    //获取条目笔记ID
                    notesIDOfItem = item.getNotes();
                } else if (item.parentItemKey && !item.isNote()) {
                    isCreatNote = true;
                    parentItemKey = item.parentItemKey;
                }
        } else {
            isCreatNote = true;
        }

        //限定在所有独立笔记，或当前分类所选条目子笔记
        const zp = Zotero.getActiveZoteroPane();
        const libraryID = Zotero.Libraries.userLibraryID;
        //不含子条目       
        const allItems = await Zotero.Items.getAll(libraryID, true);
        const notesOfUserLibrary = allItems.filter((item: Zotero.Item) => item.itemType == "note");
        const collection = zp.getSelectedCollection();
        const itemsOfCollection = collection?.getChildItems();
        const notesOfCurrentCollection = itemsOfCollection?.filter((item: Zotero.Item) => item.itemType == "note");
        const notesrelate = [];
        notesrelate.push(...notesOfUserLibrary);
        if (notesIDOfItem) {
            //获取条目笔记
            notesOfItem = notesIDOfItem.map((noteID: number) => Zotero.Items.get(noteID));
            notesrelate.push(...notesOfItem);
        }
        if (notesOfCurrentCollection) {
            notesrelate.push(...notesOfCurrentCollection);
        }
        if (!this.allowSameTitle) {
            //如果多个同名笔记，认为不是目标笔记，
            const oldNotes = notesrelate.filter((note: Zotero.Item) => note.getNoteTitle() == this.title);
            let oldNote;
            if (oldNotes.length == 1) {
                oldNote = oldNotes[0];
            }
            if (oldNotes.length > 1) {
                fullTextTranslate.showInfo(getString("info-unableConfirmNote"), 3000);
                return;
            }
            if (oldNote) {
                this.note = oldNote;
                isCreatNote = false;
            }
        }
        if (isCreatNote) {
            this.note = new Zotero.Item('note');
            if (parentItemKey) {
                this.note.parentItemKey = parentItemKey;
            } else if (item?.getCollections().length) {
                this.note.addToCollection(zp.collectionsView.selectedTreeRow.ref.id);
            }
            this.note.libraryID = item?.libraryID || libraryID;
        }
        const noteTxt = this.title + this.content + "</div>";
        this.note.setNote(noteTxt);
        await this.note.saveTx();
    }
    addTable(
        data: {
            dataArr: any[][];
            caption?: string;
            header?: string;
        },
        tableId?: string
    ) {
        if (tableId) {
            if (this.tableData?.tableId)
                this.tableData?.tableId.dataArr.push(...data.dataArr);
        }

        const { dataArr } = data;
        let { caption, header } = data;
        const rowArr = [];
        for (let tr = 0; tr < dataArr.length; tr++) {
            const rowDataArr = [];
            for (let td = 0; td < dataArr[tr].length; td++) {
                rowDataArr.push(this.dataToBody(dataArr[tr][td], "td"));
            }
            rowArr.push(this.dataToBody(rowDataArr.join(""), "tr"));
        }
        if (caption) {
            caption = this.tablecaption(caption);
        }
        if (header) {
            header = this.tableHeader(header);
        }
        const tableHtml = this.addHeadTail(rowArr.join(""), header, caption);
        this.content += tableHtml;
        return this.addHeadTail(rowArr.join(""), header, caption);
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
            caption ? (`<table><tbody>${header}${caption}${body}</tbody></table>`)
                : (`<table><tbody>${header}${body}</tbody></table>`)
        )
            : (caption ? (`<table><tbody>${caption}${body}</tbody></table>`)
                : (`<table><tbody>${body}</tbody></table>`));
    };

    tableHeader = (body: string) => {
        return `<th>${body}</th>`;
    };

    tablecaption = (body: string) => {
        return `<caption>${body}</caption>`;
    };

    dataToBody = (body: string, tag: "td" | "tr") => {
        return `<${tag}>${body}</${tag}>`;
    };
}



/* if (pdfItem.parentItemKey) {
    note.parentItemKey = pdfItem.parentItemKey;
}
else if (pdfItem.getCollections().length) {

    note.addToCollection(zp.collectionsView.selectedTreeRow.ref.id);
} */
