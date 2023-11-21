import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { resolution } from "../utils/imageDimension";
import { ReadPNG, base64ToBytes, readImage } from "../utils/prefs";
import { makeElementProps } from "./toolbarButton";



export const viewImgMenuArr = [
    {
        label: "info-viewImg",
        func: viewImg,
        args: []
    },
];


async function viewImg() {
    const maxWidth = 800;
    const childs = await getImgsElementProps(maxWidth);
    if (!childs) return;
    const container = makeContainerElementProps(childs, maxWidth) as TagElementProps;
    await makeDialogImgViewer(container);
    showDialog(undefined, childs);
}

function makeContainerElementProps(childs: TagElementProps[], maxWidth: number) {
    return makeElementProps(
        {
            tag: "div",
            namespace: "html",
            id: "dialogImgViewer-container",
            attributes: {
                style: `width: ${maxWidth}; height: ${maxWidth * 3 / 4};`,
            },
            children: childs,
        });
}

async function makeDialogImgViewer(container: TagElementProps) {
    if (!addon.data.globalObjs?.dialogImgViewer) {
        const dialogImgViewer = new ztoolkit.Dialog(1, 1)
            .addCell(0, 0,
                container
            );
        addon.data.globalObjs.dialogImgViewer = dialogImgViewer;
    }
}

function showDialog(container?: TagElementProps, childs?: TagElementProps[], dialogData?: any,) {
    const title = `${config.addonRef}`;
    const windowFeatures = {
        centerscreen: true,
        resizable: true,
        fitContent: true,
        noDialogMode: true,
    };

    const dialogCellID = "dialogImgViewer-container";
    const dialogImgViewer = addon.data.globalObjs?.dialogImgViewer;
    const divImgViewer = dialogImgViewer.window.document.querySelector("#" + dialogCellID);
    if (container) {
        ztoolkit.UI.replaceElement(container, divImgViewer);
    }
    if (childs) {
        for (const child of childs) {
            ztoolkit.UI.appendElement(child, divImgViewer);
        }
    }
    if (dialogData) {
        dialogImgViewer.setDialogData(dialogData);
    }

    if (!dialogImgViewer.window?.closed) {
        dialogImgViewer.window.focus();
    } else {
        dialogImgViewer.open(title, windowFeatures);
    };

}

async function getImgsElementProps(maxWidth?: number, itemIDs?: number) {
    const srcImgBase64ArrTotal: {
        key: string;
        src: string;
        srcWidthHeight: {
            width: number;
            height: number;
        };
    }[] = [];
    let items: Zotero.Item | Zotero.Item[];
    if (itemIDs) {
        items = await Zotero.Items.getAsync(itemIDs);
    } else {
        items = Zotero.getActiveZoteroPane().getSelectedItems();
        if (!items.length && Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.type === 'reader') {
            itemIDs = Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.data.itemID;
            if (!itemIDs) return;
            items = await Zotero.Items.getAsync(itemIDs);
        }
    }
    if (!Array.isArray(items)) {
        items = [items];
    }
    for (const item of items) {
        await findImage(item, srcImgBase64ArrTotal, maxWidth);
        /* const srcImgBase64Arr = await findImage(item);
        if (srcImgBase64Arr.length) {
            srcImgBase64ArrTotal.push(...srcImgBase64Arr);
        } */
    }
    if (srcImgBase64ArrTotal.length) {
        return makeImgTags(srcImgBase64ArrTotal);
    }
}




async function findImage(item: Zotero.Item, srcImgBase64Arr?: {
    key: string;
    src: string;
    srcWidthHeight: {
        width: number;
        height: number;
    };
}[], maxWidth?: number) {
    if (!srcImgBase64Arr) {
        srcImgBase64Arr = [];
    }
    if (!maxWidth) {
        maxWidth = 800;
    }
    if (!(item.isAttachment())) {
        for (const attachmentID of item.getAttachments()) {
            const attachment = await Zotero.Items.getAsync(attachmentID);
            //递归
            await findImage(attachment, srcImgBase64Arr);
        }
    }
    if (item.isPDFAttachment()) {
        const imageAnnotations = await getImageAnnotations(item);
        for (const imageAnnotation of imageAnnotations) {
            const srcObj = await srcBase64Annotation(imageAnnotation, maxWidth);
            if (srcObj) {
                srcImgBase64Arr.push(srcObj);
            }
        }
    }
    if (item.attachmentContentType?.includes("image")) {
        const srcObj = await srcBase64ImageFile(item, maxWidth);
        if (srcObj) {
            srcImgBase64Arr.push(srcObj);
        }
    }
    return srcImgBase64Arr;
}


async function getImageAnnotations(item: Zotero.Item) {
    const annotations = item.getAnnotations();
    const imageAnnotations = annotations.filter(e => e.annotationType == 'image');
    for (const imageAnnotation of imageAnnotations) {
        if (!await Zotero.Annotations.hasCacheImage(imageAnnotation)) {
            try {
                await Zotero.PDFRenderer.renderAttachmentAnnotations(imageAnnotation.parentID);
            }
            catch (e) {
                Zotero.debug(e);
                throw e;
            }
            break;
        }
    }
    return imageAnnotations;

}

async function srcBase64Annotation(imageAnnotation: Zotero.Item, maxWidth: number) {
    const jsonAnnotation = await Zotero.Annotations.toJSON(imageAnnotation);
    if (!jsonAnnotation || !jsonAnnotation.image) return;
    const imgWidthHeight = resolution(jsonAnnotation.image);
    const srcWidthHeight = modifyWidthHeight(imgWidthHeight)(maxWidth);
    return {
        key: jsonAnnotation.key,
        src: jsonAnnotation.image,
        srcWidthHeight: srcWidthHeight,
    };
}

async function srcBase64ImageFile(attachment: Zotero.Item, maxWidth: number) {
    const srcPath = attachment.getFilePath();
    if (!srcPath) return;
    const srcBase64 = await readImage(srcPath);
    if (!srcBase64) return;
    let imgWidthHeight;
    if (srcBase64?.width && srcBase64?.height) {
        imgWidthHeight = {
            width: srcBase64?.width,
            height: srcBase64?.height
        };
    }
    const srcWidthHeight = modifyWidthHeight(imgWidthHeight)(maxWidth);
    return {
        key: attachment.key,
        src: srcBase64.base64,
        srcWidthHeight: srcWidthHeight,
    };


}

function makeImgTags(srcImgBase64Arr: {
    key: string;
    src: string;
    srcWidthHeight: {
        width: number;
        height: number;
    };
}[]) {
    const elementProps: TagElementProps[] = [];
    srcImgBase64Arr.filter(obj => {
        const elementProp = makeElementProps({
            tag: "img",
            namespace: "html",
            id: "showImg-" + obj.key,
            attributes: {
                src: obj.src,
                style: `width:${obj.srcWidthHeight.width}; height:${obj.srcWidthHeight.height};`
            },
        });
        elementProps.push(elementProp as TagElementProps);
    });
    return elementProps;
}

function modifyWidthHeight(imgWidthHeight: {
    width: number;
    height: number;
} | undefined) {
    return (maxWidth: number) => {
        let width, height;
        if (imgWidthHeight) {
            width = imgWidthHeight.width > maxWidth ? maxWidth : imgWidthHeight.width;
            height = Math.round(imgWidthHeight.height / imgWidthHeight.width * width);
        } else {
            width = maxWidth;
            height = maxWidth * 3 / 4;
        }
        return {
            width: width,
            height: height,
        };
    };
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
