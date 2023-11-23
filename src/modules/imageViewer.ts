import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { resolution } from "../utils/imageDimension";
import { getPref, readImage } from "../utils/prefs";
import { makeTagElementProps } from "./toolbarButton";
import Viewer from 'viewerjs';
//import viewerjsStyle from 'viewerjs/dist/viewer.css';
//import 'viewerjs/dist/viewer.css';

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
    await showDialog(hasNewContent);
}

function makeDialogElementProps(srcImgBase64Arr: imageProps[], maxWidth: number) {
    let hasNewContent = false;
    let dialogImgViewer;
    if (!(dialogImgViewer = addon.data.globalObjs?.dialogImgViewer)) {
        dialogImgViewer = new ztoolkit.Dialog(1, 1);
        addon.data.globalObjs = { dialogImgViewer: dialogImgViewer };
    }
    let container = dialogImgViewer.elementProps.children[0].children[0].children;
    const resize = getPref('thumbnailSize') as string;
    const childs = makeImgTags(srcImgBase64Arr, resize);
    const imgList = imgListProps(childs);
    const ulProps = makeTagElementProps({
        tag: "div",
        namespace: "html",
        id: "images",
        children: imgList,
        attributes: {
            style: `display: flex; flex-flow: row wrap;`,
        }
    });
    if (!container.length) {
        container = makeTagElementProps(
            {
                tag: "div",
                namespace: "html",
                id: "dialogImgViewer-container",
                children: [ulProps],
                attributes: {
                    style: `display: flex; flex-wrap: wrap;`,

                }
            });
        dialogImgViewer.addCell(0, 0,
            container
        );
    } else {
        const lis = container[0].children[0].children;
        const imgIds = lis.map((li: TagElementProps) => li.children![0].id);
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
    dialogData = {
        loadCallback: () => {
            windowFitSize(dialogImgViewer.window);
            loadCss(dialogImgViewer.window.document);
            const images = dialogImgViewer.window.document.getElementById('images')!;
            images.addEventListener('hidden', function () {
                dialogImgViewer.window.sizeToContent();
                windowFitSize(dialogImgViewer.window);
                //console.log(this.viewer === viewer);
                // > true
            });
            images.addEventListener('view', function () {
                dialogImgViewer.window.maximize();
                //console.log(this.viewer === viewer);
                // > true
            });
            const gallery = new Viewer(
                images,
                /* {
                    //inline: true,
                    ready() {
                        //最大化窗口
                        dialogImgViewer.window.moveTo(0, 0);
                        dialogImgViewer.window.resizeTo(dialogImgViewer.window.screen.availWidth, dialogImgViewer.window.screen.availHeight);
                        //全屏
                        //dialogImgViewer.window.document.documentElement.requestFullscreen();
                    },

                } */
            );

        }
    };
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
}

function loadCss(document: Document) {
    /* document.head.appendChild(ztoolkit.UI.createElement(document, "style", {
        properties: {
            innerHTML: viewerjsStyle,
        },
    })); 
   
      const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`*/

    document.head.appendChild(ztoolkit.UI.createElement(document, "link", {
        attributes: {
            rel: "stylesheet",
            href: `chrome://${config.addonRef}/content/viewer.css`,
            type: "text/css",
        }
    }));

}

function windowFitSize(dialogWin: Window) {
    const reduceFactor = 0.95;
    const outerHeight = dialogWin.outerHeight;
    const outerWidth = dialogWin.outerWidth;
    let finalHeight = outerHeight;
    let finalWidth = outerWidth;
    if (outerHeight > window.screen.height) {
        finalHeight = window.screen.height * reduceFactor;
    }
    if (outerWidth > window.screen.width) {
        finalWidth = window.screen.width * reduceFactor;
    }
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
}[], resize: "origin" | "small" | "medium" | "large" | string = "medium") {
    const elementProps: TagElementProps[] = [];
    const makeSizeStyle = (widthHeight: {
        width: number;
        height: number;
    }) => {
        return `width:${widthHeight.width}; height:${widthHeight.height};`;
    };
    srcImgBase64Arr.filter(obj => {
        let sizeStyle: string;
        switch (resize) {
            case "origin": sizeStyle = `width:${obj.srcWidthHeight.width}; height:${obj.srcWidthHeight.height};`;
                break;
            case "small": sizeStyle = makeSizeStyle(resizeFixRatio(obj.srcWidthHeight, 100));
                break;
            case "medium": sizeStyle = makeSizeStyle(resizeFixRatio(obj.srcWidthHeight, 300));
                break;
            case "large": sizeStyle = makeSizeStyle(resizeFixRatio(obj.srcWidthHeight, 600));
        }

        const elementProp = makeTagElementProps({
            tag: "img",
            namespace: "html",
            id: "showImg-" + obj.key,
            attributes: {
                src: obj.src,
                style: sizeStyle,
            },
        });
        elementProps.push(elementProp);
    });
    return elementProps;
}

function resizeFixRatio(obj: { width: number; height: number; }, value: number, resizeBy?: "width" | "height") {
    if (!resizeBy) {
        resizeBy == "width";
    }
    if (resizeBy == "width") {
        return {
            width: value,
            height: (value / obj.width) * obj.height
        };
    } else {
        return {
            height: value,
            width: (value / obj.height) * obj.width
        };
    }
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
