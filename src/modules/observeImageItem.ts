export async function observeImageItem() {
    let itemsTree;
    while (!(itemsTree = document.getElementById("zotero-items-tree"))) {
        await Zotero.Promise.delay(1000);
    };
    const zp = Zotero.getActiveZoteroPane();
    itemsTree.addEventListener("mouseover", callBack);
    function callBack(e: MouseEvent) {
        const id = e.target?.id;
        if (id && id.includes("-row-")) {
            const index = id.replace(/.+-row-/m, '');
            //const item = Zotero.getActiveZoteroPane().itemsView._getRowData(index);
            const row = zp.itemsView.getRow(index);
            const itemByRow = Zotero.Items.get(row.id);
            if (item.) {

            }


        }

    }
}