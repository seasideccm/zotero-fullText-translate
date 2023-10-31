
/* class WriteNote{
    note:any
    constructor(options={}) {
        this.note={}
this.libraryID=
}
}
_init(){
    this.note = new Zotero.Item('note');
    

} */
export const writeNote = async () => {
    const note = new Zotero.Item('note');
    note.libraryID = 1;
    const zp = Zotero.getActiveZoteroPane();
    note.setNote("noteTxt");
    await note.saveTx();
}

/* if (pdfItem.parentKey) {
    note.parentKey = pdfItem.parentKey;
}
else if (pdfItem.getCollections().length) {

    note.addToCollection(zp.collectionsView.selectedTreeRow.ref.id);
} */

