


export class WriteNote {


    title: string;
    content: any;
    itemID?: number;
    note!: Zotero.Item;
    noteVersion: number;
    constructor(options: any = {}, itemID?: number) {
        this.title = this.addTitle(options.title);
        this.content = '';
        this.noteVersion = options.noteVersion || 9;
        this.itemID = itemID;

    }

    async makeNote() {
        this.note = new Zotero.Item('note');
        let item;
        if (this.itemID) {
            item = Zotero.Items.get(this.itemID);
        }
        this.note.libraryID = item?.libraryID || 1;

        const noteTxt = this.title + this.content + "</div>";

        this.note.setNote(noteTxt);
        await this.note.saveTx();
    }
    addTable(
        data: {
            dataArr: any[][];
            caption?: string;
            header?: string;
        }
    ) {
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



/* if (pdfItem.parentKey) {
    note.parentKey = pdfItem.parentKey;
}
else if (pdfItem.getCollections().length) {

    note.addToCollection(zp.collectionsView.selectedTreeRow.ref.id);
} */
