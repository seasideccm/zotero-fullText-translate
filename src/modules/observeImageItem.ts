import { imageUtilties } from "./imageTool/utilities";

export async function observeImageItem() {
    let itemsTree;
    //let popupMarker = 0;
    while (!(itemsTree = document.getElementById("zotero-items-tree"))) {
        await Zotero.Promise.delay(1000);
    };
    const zp = Zotero.getActiveZoteroPane();
    //防抖
    //const debounceCallBack3 = Zotero.Utilities.debounce(callBack, 300);
    //节流 , { leading: true, trailing: false }
    const debounceCallBack = Zotero.Utilities.throttle(callBack, 3000);
    itemsTree.addEventListener("mouseover", function (e) {
        debounceCallBack(e);
    });

    function callBack(e: MouseEvent) {
        const id = e.target?.id;
        if (id && id.includes("-row-")) {
            const index = id.replace(/.+-row-/m, '');
            //const item = Zotero.getActiveZoteroPane().itemsView._getRowData(index);
            const row = zp.itemsView.getRow(index);
            const itemByRow = Zotero.Items.get(row.id);
            if (itemByRow && itemByRow.attachmentContentType?.includes("image")) {
                let path = itemByRow.getFilePath() as string;
                path = OS.Path.normalize(path!);
                if (!OS.File.exists(path)) return;
                const srcPath = "file:///" + path!;
                const position = {
                    x: e.screenX,
                    y: e.screenY
                };
                const imagePop = popupIamge(srcPath, position);
                //popupMarker = 1;
                (e.target as HTMLElement).addEventListener("mouseout", async () => {
                    await Zotero.Promise.delay(3000);
                    imagePop.window.close();
                    //popupMarker = 0;
                });
            }
        }
    }
}

function popupIamge(srcPath: string, position: any) {

    const style = `float: "right";justifyContent: "center";max-width: "50%";z-index: 3`;
    const props = {
        tag: "div",
        namespace: "html",
        id: "popupImage",
        attributes: {
            style: style,
        },
        children: [{
            tag: "img",
            namespace: "html",
            attributes: {
                src: srcPath,
                alt: "image",
                style: `width:100%;`,

            },
        }],
    };
    const imagePop = new ztoolkit.Dialog(1, 1)
        .addCell(0, 0, props)
        .open('', {
            resizable: true,
            fitContent: true,
            noDialogMode: true,
            left: position.x + 20,
            top: position.y + 20
        });
    return imagePop;
}