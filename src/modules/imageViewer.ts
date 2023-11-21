import { config } from "../../package.json";
import { readImage } from "../utils/prefs";
import { makeElementProps } from "./toolbarButton";


export const viewImgMenuArr = [
    {
        label: "info-viewImg",
        func: viewImg,
        args: []
    },
];
function viewImg() {
    const dialogCellID = "dialogImgViewer-container";
    const childs = getImgsElementProps();
    const elementDiv = {
        tag: "div",
        namespace: "html",
        id: dialogCellID,
        attributes: {
            style: "width: 800; height: 600;",
            //数据绑定的数据来源于dialogData的哪个键值
            //"data-bind": "content",
            //元素某个property
            //"data-prop": "innerHTML",
        },
        children: childs,
        /* [
           {
               tag: "img",
               namespace: "html",
               id: "showImg-" + "attachmentKey",
               attributes: { src: src, },
           },
       ] */
    };
    makeDialogImgViewer(elementDiv);
    showDialog();
}


function makeDialogImgViewer(elementDiv: any) {
    if (!addon.data.globalObjs?.dialogImgViewer) {
        const dialogImgViewer = new ztoolkit.Dialog(1, 1)
            .addCell(0, 0,
                elementDiv
            );
        addon.data.globalObjs = {
            dialogImgViewer: dialogImgViewer,
        };
    }
}

function showDialog(dialogData?: any) {
    const title = `${config.addonRef}`;
    const windowFeatures = {
        centerscreen: true,
        resizable: true,
        fitContent: true,
        noDialogMode: true,
    };

    const dialogCellID = "dialogImgViewer-container";
    const dialogImgViewer = addon.data.globalObjs?.dialogImgViewer;
    if (dialogImgViewer.window) {
        if (dialogImgViewer.window.closed) {
            dialogData ? dialogImgViewer.setDialogData(dialogData).open(title, windowFeatures) : dialogImgViewer.open(title, windowFeatures);

        } else {
            dialogImgViewer.window.focus();
            const divImgViewer = dialogImgViewer.window.document.querySelector("#" + dialogCellID);
            ztoolkit.UI.appendElement(elementDiv, divImgViewer);
            //divImgViewer!.innerHTML = dialogData.content;
        };
    } else {
        dialogData ? dialogImgViewer.setDialogData(dialogData).open(title, windowFeatures) : dialogImgViewer.open(title, windowFeatures);
    }
}

function getImgsElementProps(itemID?: number) {
    let items: Zotero.Item | Zotero.Item[];
    if (itemID) {
        items = Zotero.Items.get(itemID);
    } else {
        items = Zotero.getActiveZoteroPane().getSelectedItems();
    }
    if (!Array.isArray(items)) {
        items = [items];
    }
    const elementProps: any[] = [];
    items.filter((item: Zotero.Item) => {
        const attachmentIDs = item.getAttachments();
        attachmentIDs.filter(async (attachmentID: number) => {
            const attachment = Zotero.Items.get(attachmentID);
            if (!attachment.isAttachment()) return;
            if (!attachment.attachmentContentType.includes("image")) return;
            const srcPath = attachment.getFilePath();
            if (!srcPath) return;

            const srcBase64 = await readImage(srcPath);
            const width = srcBase64!.width > 800 ? 800 : srcBase64!.width;
            const height = srcBase64!.height / srcBase64!.width * width;
            const elementProp = makeElementProps({
                tag: "img",
                namespace: "html",
                id: "showImg-" + attachment.key,
                attributes: {
                    src: srcBase64?.base64,
                    style: `width: ${width}; ${height};`

                },
            });

            elementProps.push(elementProp);
        });
    });
    return elementProps;
}


/* function makeDialogData(content: string) {
    const dialogData = {
        "content": content
    };
    return dialogData;
} */




















/* .addCell(0, 0,
    {
        tag: "div",
        namespace: "html",
        id: dialogCellID,
        attributes: {
            style: "width: 400; height: 430;",
            //数据绑定的数据来源于dialogData的哪个键值
            "data-bind": "content",
            //元素某个property
            "data-prop": "innerHTML",
        },
        children:[],

    }
) */
