import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { resolution } from "../utils/imageDimension";
import { readImage } from "../utils/prefs";
import { makeTagElementProps } from "./toolbarButton";
import Viewer from 'viewerjs';




export const viewImgMenuArr = [
    {
        label: "info-viewImg",
        func: viewImg,
        args: []
    },
];


async function viewImg() {
    const maxWidth = 800;
    const srcImgBase64Arr = await getImgsBase64(maxWidth);
    if (!srcImgBase64Arr) return;
    const hasNewContent = makeDialogElementProps(srcImgBase64Arr, maxWidth);
    showDialog(hasNewContent);

}

/* async function makeContainerElementProps(childs: TagElementProps[], maxWidth: number) {
    const title = `${config.addonRef}`;
    const windowFeatures = {
        centerscreen: true,
        resizable: true,
        fitContent: true,
        noDialogMode: true,
        left: 50,
        top: 20,
    };

    const imgList = imgListProps(childs);

    //let container = dialogImgViewer.elementProps.children[0].children[0].children;

    const ulProps = makeTagElementProps({
        tag: "ul",
        namespace: "html",
        id: "images",
        children: imgList,
    });
    const container = makeTagElementProps(
        {
            tag: "div",
            namespace: "html",
            id: "dialogImgViewer-container",
            attributes: {
                style: `width: ${maxWidth}; height: ${maxWidth * 3 / 4};`,
            },
            children: [ulProps],
        });
    const dialogOnce = new ztoolkit.Dialog(1, 1).addCell(0, 0,
        container
    )
        .open(title, windowFeatures);
    //等待对话窗数据加载完成，对话框关键机制，
    await dialogOnce.dialogData.loadLock?.promise;
    const reduceFactor = 0.95;
    const outerHeight = dialogOnce.window.outerHeight;
    const outerWidth = dialogOnce.window.outerWidth;
    let finalHeight = 0;
    let finalWidth = 0;
      if (outerHeight > window.screen.height && !(outerWidth > window.screen.width)) {
          finalHeight = window.screen.height * reduceFactor;
          finalWidth = outerWidth * window.screen.height / outerHeight * reduceFactor;
      }
      if (outerWidth > window.screen.width && !(outerHeight > window.screen.height)) {
          finalWidth = window.screen.width * reduceFactor;
          finalHeight = outerHeight * window.screen.width / outerWidth * reduceFactor;
      }
    if (outerHeight > window.screen.height || outerWidth > window.screen.width) {

        if (outerWidth / window.screen.width > outerHeight / window.screen.height) {
            finalWidth = window.screen.width * reduceFactor;
            finalHeight = outerHeight * window.screen.width / outerWidth * reduceFactor;
        } else {
            finalHeight = window.screen.height * reduceFactor;
            finalWidth = outerWidth * window.screen.height / outerHeight * reduceFactor;
        }
    }
    if (finalHeight != 0 || finalWidth != 0) {
        dialogOnce.window.resizeTo(finalWidth, finalHeight);
    }


    await dialogOnce.dialogData?.unloadLock?.promise;
    dialogOnce = undefined;
      else {
         for (const li of imgList) {
             const idImg = li.children![0].id;
             const idsImg = container[0].children[0].children.map((e: TagElementProps) => e.children![0].id);
             if (!idsImg.includes(idImg)) {
                 container[0].children[0].children.push(li);
             }
         }
     }
} */
function makeDialogElementProps(srcImgBase64Arr: imageProps[], maxWidth: number) {
    let hasNewContent = false;
    let dialogImgViewer;
    if (!(dialogImgViewer = addon.data.globalObjs?.dialogImgViewer)) {
        dialogImgViewer = new ztoolkit.Dialog(1, 1);
        addon.data.globalObjs = { dialogImgViewer: dialogImgViewer };
    }
    let container = dialogImgViewer.elementProps.children[0].children[0].children;
    const childs = makeImgTags(srcImgBase64Arr);
    const imgList = imgListProps(childs);
    const ulProps = makeTagElementProps({
        tag: "ul",
        namespace: "html",
        id: "images",
        children: imgList,
    });
    if (!container.length) {
        container = makeTagElementProps(
            {
                tag: "div",
                namespace: "html",
                id: "dialogImgViewer-container",
                children: [ulProps],
            });
        dialogImgViewer.addCell(0, 0,
            container
        );
    } else {
        const lis = container[0].children[0].children;
        const imgIds = lis.map((li: TagElementProps) => li.children![0].id);
        //.replace("showImg-", '')
        for (const imgLi of imgList) {
            const imgId = imgLi.children![0].id;
            if (!imgIds.includes(imgId)) {
                container[0].children[0].children.push(imgLi);
                hasNewContent = true;
            }
        }

    }
    return hasNewContent;
}
async function showDialog(hasNewContent: boolean, dialogData?: any,) {
    const args = {
        title: `${config.addonRef}`,
        windowFeatures: {
            centerscreen: true,
            resizable: true,
            fitContent: true,
            noDialogMode: true,
        }
    };
    const dialogImgViewer = addon.data.globalObjs?.dialogImgViewer;
    if (dialogData) {
        dialogImgViewer.setDialogData(dialogData);
    }
    const open = (obj: any) => dialogImgViewer.open(obj.title, obj.windowFeatures);
    const closeOpen = (obj: any) => {
        dialogImgViewer.window.close();
        open(args);
    };
    const focus = () => dialogImgViewer.window.focus();

    dialogImgViewer.window ? (dialogImgViewer.window.closed ? open(args) : (hasNewContent ? closeOpen(args) : focus())) : open(args);
    //等待对话窗数据加载完成，对话框关键机制，
    const something = await dialogImgViewer.dialogData.loadLock?.promise;
    const test = something;
    windowFitSize(dialogImgViewer.window);

}
function windowFitSize(dialogWin: Window) {
    const reduceFactor = 0.95;
    const outerHeight = dialogWin.outerHeight;
    const outerWidth = dialogWin.outerWidth;
    let finalHeight = outerHeight;
    let finalWidth = outerWidth;
    if (outerHeight > window.screen.height) {
        finalWidth = window.screen.width * reduceFactor;
    }
    if (outerHeight > window.screen.height || outerWidth > window.screen.width) {
        finalHeight = window.screen.height * reduceFactor;
    }
    /*  if (outerHeight > window.screen.height || outerWidth > window.screen.width) {
         if (outerWidth / window.screen.width > outerHeight / window.screen.height) {
             finalWidth = window.screen.width * reduceFactor;
             finalHeight = outerHeight * window.screen.width / outerWidth * reduceFactor;
         } else {
             finalHeight = window.screen.height * reduceFactor;
             finalWidth = outerWidth * window.screen.height / outerHeight * reduceFactor;
         }
     } */
    if (finalHeight != outerHeight || finalWidth != outerWidth) {
        dialogWin.resizeTo(finalWidth, finalHeight);
    }
}

function imgListProps(imgsElementProps: TagElementProps[]) {
    const listProps = [];
    for (const imgTagProps of imgsElementProps) {
        const liProps = makeTagElementProps({
            tag: "li",
            namespace: "html",
            children: [imgTagProps]
        });
        listProps.push(liProps);
    }
    return listProps;
}

async function getImgsBase64(maxWidth?: number, itemIDs?: number | number[]) {
    const srcImgBase64ArrTotal: imageProps[] = [];
    const items = getItems(itemIDs);
    if (!items) return;
    for (const item of items) {
        await findImage(item, srcImgBase64ArrTotal, maxWidth);
    }
    if (srcImgBase64ArrTotal.length) {
        return srcImgBase64ArrTotal;
    }
}

function getItems(itemID?: number | number[]) {
    let items: Zotero.Item[];
    if (itemID) {
        if (typeof itemID == "number") {
            items = [Zotero.Items.get(itemID)];
        } else {
            items = [];
            for (const id of itemID) {
                items.push(Zotero.Items.get(id));
            }

        }
    } else {
        items = Zotero.getActiveZoteroPane().getSelectedItems();
        if (!items.length && Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.type === 'reader') {
            itemID = Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.data.itemID;
            if (!itemID) return;
            items = [Zotero.Items.get(itemID as number)];
        }
    }
    return items;

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
            const attachment = Zotero.Items.get(attachmentID);
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
            if (imageAnnotation.parentID) {
                const tabID = Zotero_Tabs.getTabIDByItemID(imageAnnotation.parentID);
                tabID ? Zotero_Tabs.select(tabID) : await Zotero.Reader.open(imageAnnotation.parentID);
            }
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
        const elementProp = makeTagElementProps({
            tag: "img",
            namespace: "html",
            id: "showImg-" + obj.key,
            attributes: {
                src: obj.src,
                style: `width:${obj.srcWidthHeight.width}; height:${obj.srcWidthHeight.height};`
            },
        });
        elementProps.push(elementProp);
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


function viewer(document: Document) {
    // You should import the CSS file.
    // import 'viewerjs/dist/viewer.css';


    // View an image.
    /* const viewer = new Viewer(document.getElementById('image')!, {
      inline: true,
      viewed() {
        viewer.zoomTo(1);
      },
    }); */
    // Then, show the image by clicking it, or call `viewer.show()`.

    // View a list of images.
    // Note: All images within the container will be found by calling `element.querySelectorAll('img')`.
    const gallery = new Viewer(document.getElementById('images')!);
    // Then, show one image by click it, or call `gallery.show()`.
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
