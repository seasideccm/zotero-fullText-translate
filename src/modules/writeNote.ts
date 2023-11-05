import { getString } from "../utils/locale";
import { fullTextTranslate } from "./fullTextTranslate";



export class WriteNote {
    title?: string;
    titleHtml: string;
    parentItemKey?: string;
    content: any;
    itemID?: number;
    libraryID?: number;
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
        this.titleHtml = this.addTitle(options.title);
        this.title = options.title || null;
        this.content = '';
        this.noteVersion = options.noteVersion || 9;
        this.itemID = itemID;
        this.allowSameTitle = options.allowSameTitle || false;
        this.tableData = options.tableData;
    }

    async makeNote() {
        //parentKey==parentItemKey
        let item, parentItemKey, isCreatNote, notesIDs, notesOfItem;
        if (this.itemID) {
            item = Zotero.Items.get(this.itemID);
            if (item.isNote()) {
                this.note = item;
                if (item.parentItemKey) {
                    this.parentItemKey = item.parentItemKey;
                    this.libraryID = item.libraryID;
                }
            } else if (item.isRegularItem()) {
                isCreatNote = true;
                this.parentItemKey = item.key;
                //��ȡ��Ŀ�ʼ�ID
                notesIDs = item.getNotes();
            } else if (item.parentItemKey && !item.isNote()) {
                isCreatNote = true;
                this.parentItemKey = item.parentItemKey;
                this.libraryID = item.libraryID;
            }
        } else {
            if (this.title) {
                if (this.note?.getNoteTitle() != this.title) {
                    isCreatNote = true;
                }
            } else {
                isCreatNote = true;
            }

        }

        //�޶������ж����ʼǣ���ǰ������ѡ��Ŀ�ӱʼ�
        const zp = Zotero.getActiveZoteroPane();
        const libraryID = Zotero.Libraries.userLibraryID;
        //��������Ŀ       
        const allItems = await Zotero.Items.getAll(libraryID, true);
        const notesOfUserLibrary = allItems.filter((item: Zotero.Item) => item.itemType == "note");
        const collection = zp.getSelectedCollection();
        const itemsOfCollection = collection?.getChildItems();
        const notesOfCurrentCollection = itemsOfCollection?.filter((item: Zotero.Item) => item.itemType == "note");
        const notesRelate = [];
        notesRelate.push(...notesOfUserLibrary);
        if (notesIDs) {
            //��ȡ��Ŀ�ʼ�
            notesOfItem = notesIDs.map((noteID: number) => Zotero.Items.get(noteID));
            notesRelate.push(...notesOfItem);
        }
        if (notesOfCurrentCollection) {
            notesRelate.push(...notesOfCurrentCollection);
        }
        if (!this.allowSameTitle) {
            //������ͬ���ʼǣ���Ϊ����Ŀ��ʼǣ�
            const oldNotes = notesRelate.filter((note: Zotero.Item) => note.getNoteTitle() == this.title);
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
            if (this.parentItemKey) {
                this.note.parentItemKey = this.parentItemKey;
            } else if (item?.getCollections().length) {
                this.note.addToCollection(zp.collectionsView.selectedTreeRow.ref.id);
            }
            this.note.libraryID = this.libraryID || libraryID;
        }
        const noteTxt = this.titleHtml + this.content + "</div>";
        this.note.setNote(noteTxt);
        await this.note.saveTx();
    }
    addTable(
        data: {
            dataArr: any[][];
            caption?: string;
            header?: string[];
        },
        //����idѡ����ѡ�����Ʊ�ʱ���<table id=tableId></table>
        tableId?: string
    ) {
        if (tableId) {
            //��α��������ݣ��Ѿ���Ӳ�̱���json
            /* if (this.tableData?.tableId)
                this.tableData?.tableId.dataArr.push(...data.dataArr); */
        }

        const { dataArr } = data;
        const { caption, header } = data;
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
        //zotero note ��֧�� caption ��ͷ
        if (caption) {
            captionHtml = this.tablecaption(caption);
        }
        if (header) {
            headerHtml = this.tableHeader(header);
        }
        const tableHtml = this.addHeadTail(bodyHtml, headerHtml, captionHtml);
        //��������content���ݸ���
        this.content += tableHtml;
        //���ر��html�����������ʹ��
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
