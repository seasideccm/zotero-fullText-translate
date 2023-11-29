import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { resolution } from "../utils/imageDimension";
import { getPref, readImage } from "../utils/prefs";
import { makeTagElementProps } from "./toolbarButton";
import Viewer from 'viewerjs';
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { batchAddEventListener, contextMenu, } from './userInerface';
import { prepareReader } from "./prepareReader";
import dragula from 'dragula';

export const viewImgMenuArr = [
    {
        label: "info-viewImg",
        func: viewImg,
        args: []
    },
];

/* async function viewImg() {
    const srcImgBase64Arr = await getImgsBase64();
    if (!srcImgBase64Arr) return;
    const hasNewContent = makeDialogElementProps(srcImgBase64Arr);
    await showDialog(hasNewContent);
} */

async function viewImg() {
    const hasNewContent = await makeDialogElementProps();
    await showDialog(hasNewContent);
}
;
async function makeDialogElementProps() {
    const items = getItems() || [];
    const imageItems: Zotero.Item[] = [];
    for (const item of items) {
        imageItems.push(...(await findImageItems(item)));
    }

    let hasNewContent = false;
    let dialogImgViewer: DialogHelper;
    if (!(dialogImgViewer = addon.data.globalObjs?.dialogImgViewer)) {
        dialogImgViewer = new ztoolkit.Dialog(1, 1);
        addon.data.globalObjs = { dialogImgViewer: dialogImgViewer };
    }
    let container = (dialogImgViewer as any).elementProps.children[0].children[0].children;
    const thumbnailSize = getPref('thumbnailSize') as string || "small";
    //const imgsProps = makeImgTags(srcImgBase64Arr);
    const backgroundColor = getPref("backgroundColorDialogImgViewer") as string || "#b90f0f";

    const style1 = `
    display: grid;    
    grid-gap: 1vw;    
    grid-template-rows: masonry;
    max-Width: 100vw;
    background-color: ${backgroundColor};    
    `;

    let sizeStyle: number = 0;
    switch (thumbnailSize) {
        case "small": sizeStyle = 100;
            break;
        case "medium": sizeStyle = 300;
            break;
        case "large": sizeStyle = 600;
    }
    let columnsByScreen;
    if (sizeStyle != 0) {
        columnsByScreen = Math.floor(window.screen.width / sizeStyle);
        columnsByScreen == 0 ? columnsByScreen = 1 : () => { };
    } else {
        window.screen.width > 768 ? columnsByScreen = 4 : columnsByScreen = 2;
    }

    if (!container.length) {
        const imageInfoArr = [];
        for (const imgItem of imageItems) {
            const imageInfo = await getImageInfo(imgItem);
            if (!imageInfo) continue;
            imageInfoArr.push(imageInfo);
        }
        const imgsProps = makeImgTags(imageInfoArr);
        const columns = imgsProps.length >= columnsByScreen ? columnsByScreen : imgsProps.length;
        const style2 = `grid-template-columns: repeat(${columns},1fr); min-width: calc(200px * ${columns});`;
        const imagesProps = makeTagElementProps({
            tag: "div",
            namespace: "html",
            id: "images",
            children: imgsProps,
            attributes: {
                //style: `display: flex; flex-flow: row wrap;`,
                style: style1 + style2,
            }
        });
        container = makeTagElementProps(
            {
                tag: "div",
                namespace: "html",
                id: "dialogImgViewer-container",
                children: [imagesProps],
                attributes: {
                    style: `min-height: 20vw;`,

                }
                //display: flex; flex-wrap: wrap; 
            });
        dialogImgViewer.addCell(0, 0,
            container
        );
    } else {
        const imgs = container[0].children[0].children;
        const imgIds = imgs.map((img: TagElementProps) => img.id);
        const imgIdsString = imgIds.join("");
        const imageInfoArr = [];
        for (const imgItem of imageItems) {
            const imgKey = imgItem.key;
            if (!imgIdsString.includes(imgKey)) {
                const imageInfo = await getImageInfo(imgItem);
                if (!imageInfo) continue;
                imageInfoArr.push(imageInfo);
                hasNewContent = true;
            }
        }
        const imgsProps = makeImgTags(imageInfoArr);
        container[0].children[0].children.push(imgsProps);
        const columns = imgs.length >= columnsByScreen ? columnsByScreen : imgs.length;
        const style2 = `grid-template-columns: repeat(${columns},1fr); min-width: calc(200px * ${columns});`;
        const style = style1 + style2;
        container[0].children[0].attributes.style = style;
    }
    return hasNewContent;
}

/* function makeDialogElementProps(srcImgBase64Arr?: imageProps[]) {
    let hasNewContent = false;
    let dialogImgViewer: DialogHelper;
    if (!(dialogImgViewer = addon.data.globalObjs?.dialogImgViewer)) {
        dialogImgViewer = new ztoolkit.Dialog(1, 1);
        addon.data.globalObjs = { dialogImgViewer: dialogImgViewer };
    }
    let container = (dialogImgViewer as any).elementProps.children[0].children[0].children;
    const thumbnailSize = getPref('thumbnailSize') as string;
    const imgsProps = makeImgTags(srcImgBase64Arr);
    const backgroundColor = getPref("backgroundColorDialogImgViewer") as string || "#b90f0f";

    const style1 = `
    display: grid;    
    grid-gap: 1vw;    
    grid-template-rows: masonry;
    max-Width: 100vw;
    background-color: ${backgroundColor};    
    `;

    let sizeStyle: number = 0;
    switch (thumbnailSize) {
        case "small": sizeStyle = 100;
            break;
        case "medium": sizeStyle = 300;
            break;
        case "large": sizeStyle = 600;
    }
    let columnsByScreen;
    if (sizeStyle != 0) {
        columnsByScreen = Math.floor(window.screen.width / sizeStyle);
        columnsByScreen == 0 ? columnsByScreen = 1 : () => { };
    } else {
        window.screen.width > 768 ? columnsByScreen = 4 : columnsByScreen = 2;
    }

    if (!container.length) {
        const columns = imgsProps.length >= columnsByScreen ? columnsByScreen : imgsProps.length;
        const style2 = `grid-template-columns: repeat(${columns},1fr); min-width: calc(200px * ${columns});`;
        const imagesProps = makeTagElementProps({
            tag: "div",
            namespace: "html",
            id: "images",
            children: imgsProps,
            attributes: {
                //style: `display: flex; flex-flow: row wrap;`,
                style: style1 + style2,
            }
        });
        container = makeTagElementProps(
            {
                tag: "div",
                namespace: "html",
                id: "dialogImgViewer-container",
                children: [imagesProps],
                attributes: {
                    style: `min-height: 20vw;`,

                }
                //display: flex; flex-wrap: wrap; 
            });
        dialogImgViewer.addCell(0, 0,
            container
        );
    } else {
        const imgs = container[0].children[0].children;
        const imgIds = imgs.map((img: TagElementProps) => img.id);
        for (const imgProps of imgsProps) {
            const imgId = imgProps.id;
            if (!imgIds.includes(imgId)) {
                container[0].children[0].children.push(imgProps);
                hasNewContent = true;
            }
        }

        const columns = imgs.length >= columnsByScreen ? columnsByScreen : imgs.length;
        const style2 = `grid-template-columns: repeat(${columns},1fr); min-width: calc(200px * ${columns});`;
        const style = style1 + style2;
        container[0].children[0].attributes.style = style;
    }
    return hasNewContent;
} */
async function showDialog(hasNewContent: boolean, dialogData?: any,) {
    const args = {
        title: `${config.addonRef}`,
        windowFeatures: {
            centerscreen: true,
            resizable: true,
            //fitContent: true,
            noDialogMode: true,
        }
    };
    const dialogImgViewer = addon.data.globalObjs?.dialogImgViewer;
    async function restoreDialog() {
        //dialogImgViewer.window.sizeToContent();
        if (dialogImgViewer.window.document.fullscreen) {
            await dialogImgViewer.window.document.exitFullscreen();
        }
        windowFitSize(dialogImgViewer.window);
    }
    async function maxOrFullDialog() {
        const windowSizeOnViewImage = getPref('windowSizeOnViewImage') || "full";
        if (windowSizeOnViewImage !== "origin") {
            windowSizeOnViewImage == "full" ? await dialogImgViewer.window.document.documentElement.requestFullscreen() : dialogImgViewer.window.maximize();
        }
    }

    dialogData = {
        loadCallback: async () => {
            const doc = dialogImgViewer.window.document as Document;
            const images = doc.getElementById('images')!;
            const cssfilesURL = [
                `chrome://${config.addonRef}/content/viewer.css`,
                `chrome://${config.addonRef}/content/dragula.css`,
            ];
            insertStyle(dialogImgViewer.window.document);
            loadCss(dialogImgViewer.window.document, cssfilesURL);
            function openMeun(event: MouseEvent) {
                const idPostfix = "imageViewerContextMeun";
                const menuPropsGroupsArr = [
                    [
                        ["info-copyImage"],
                        ["info-saveImage"],
                        ["info-editImage"],
                        ["info-convertImage"],
                        ["info-ocrImage"]
                    ],
                    [
                        ["info-shareImage"],
                        ["info-sendToPPT"],
                        ["info-printImage"]
                    ],
                ];
                const imgCtxObj = new contextMenu({
                    menuPropsGroupsArr,
                    idPostfix
                });
                imgCtxObj.contextMenu.addEventListener('click', e => {
                    const tagName = (e.target as any).tagName.toLowerCase();
                    if (tagName === 'menuitem') {
                        imgCtxObj.handleMenuItem(event, e);
                    }
                });

                document.querySelector("#browser")!.appendChild(imgCtxObj.contextMenu);
                imgCtxObj.contextMenu.openPopupAtScreen(event.clientX + images.screenX, event.clientY + images.screenY, true);


            }
            batchAddEventListener(
                [
                    [images,
                        [
                            ['hidden', restoreDialog],
                            ['view', maxOrFullDialog],
                            //['contextmenu', openMeun],
                        ],
                    ],
                ]);
            (images as HTMLElement).addEventListener('contextmenu', e => {
                const tagName = (e.target as any).tagName;
                if (tagName === 'IMG') {
                    openMeun(e);
                }
            });
            new Viewer(images);
            await windowFitSize(dialogImgViewer.window);
            const containers = Array.from(doc.getElementsByClassName('containerImg'));
            const foo = dragula(containers);
            const test = foo;
        }
    };
    if (dialogData) {
        dialogImgViewer.setDialogData(dialogData);
    }
    const open = (obj: any) => { return dialogImgViewer.open(obj.title, obj.windowFeatures); };
    const closeOpen = (obj: any) => {
        dialogImgViewer.window.close();
        return open(args);
    };
    const focus = () => dialogImgViewer.window.focus();
    dialogImgViewer.window ? (dialogImgViewer.window.closed ? open(args) : (hasNewContent ? closeOpen(args) : focus())) : open(args);
}
//, resize: "origin" | "small" | "medium" | "large" | string = "small"
const makeSizeStyle = (widthHeight: {
    width: number;
    height: number;
}) => {
    return `width:${widthHeight.width}; height:${widthHeight.height};`;
};
function makeImgTags(srcImgBase64Arr: {
    key: string;
    src: string;
    alt: string;
    srcWidthHeight: {
        width: number;
        height: number;
    };
}[]) {
    const elementProps: TagElementProps[] = [];
    srcImgBase64Arr.filter(obj => {
        const elementProp = makeTagElementProps({
            tag: "div",
            namespace: "html",
            id: "container-" + obj.key,
            attributes: {
                class: "containerImg",
            },
            children: [{
                tag: "img",
                namespace: "html",
                id: "showImg-" + obj.key,
                attributes: {
                    src: obj.src,
                    alt: obj.alt,
                    style: `
                    object-fit: contain;
                    display: block`,
                }
            },]
        });
        //width:${obj.srcWidthHeight.width}; 
        //height:${obj.srcWidthHeight.height};
        elementProps.push(elementProp);
    });
    return elementProps;
}

function insertStyle(document: Document, style?: string) {
    style = style || `img{width: 100%;}`;
    document.head.appendChild(ztoolkit.UI.createElement(document, "style", {
        properties: {
            innerHTML: style,
        },
    }));
}

function loadCss(document: Document, cssfilesURL: string[] = [`chrome://${config.addonRef}/content/viewer.css`]) {
    cssfilesURL.filter((hrefURL: string) => {
        document.head.appendChild(ztoolkit.UI.createElement(document, "link", {
            attributes: {
                rel: "stylesheet",
                href: hrefURL,
                type: "text/css",
            }
        }));
    });

}

async function windowFitSize(dialogWin: Window) {
    let n = 0;
    while (dialogWin.window.document?.readyState != "complete" && n++ < 50) {
        await Zotero.Promise.delay(100);
    }
    let contentHeight, contentWidth;
    while ((contentHeight = dialogWin.document.documentElement.scrollHeight) == 0) {
        await Zotero.Promise.delay(100);
    }
    while ((contentWidth = dialogWin.document.documentElement.scrollWidth) == 0) {
        await Zotero.Promise.delay(100);
    }

    if (contentHeight + 37 > window.screen.height || contentWidth + 14 > window.screen.width) {
        (dialogWin as any).maximize();
    } else {
        dialogWin.resizeTo(contentWidth + 14, contentHeight + 37);
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

async function getImgsBase64(itemIDs?: number | number[]) {
    const srcImgBase64ArrTotal: imageProps[] = [];
    const items = getItems(itemIDs);
    if (!items) return;
    for (const item of items) {
        const tempArr = await findImage(item);
        srcImgBase64ArrTotal.push(...tempArr);
    }
    if (srcImgBase64ArrTotal.length) {
        return srcImgBase64ArrTotal;
    }
}

async function getImageInfo(item: Zotero.Item) {
    const itemType = item.itemType as string;
    switch (itemType) {
        case "annotation":
            if (item.annotationType != "image") break;
            await renderAnnotationImage(item)
                ;
            return await srcBase64Annotation(item, item.parentItem?.getField("title") as string);
        case "attachment":
            if (!item.attachmentContentType.includes("image")) break;
            return await srcBase64ImageFile(item);
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
        if (!items.length) {
            const collectionSelected = Zotero.getActiveZoteroPane().getSelectedCollection();
            if (collectionSelected) {
                items = collectionSelected.getChildItems();
            }
        }
    }
    return items;

}

async function findImageItems(item: Zotero.Item, imageItems?: Zotero.Item[]) {
    if (!imageItems) {
        imageItems = [];
    }
    if (!(item.isAttachment())) {
        for (const attachmentID of item.getAttachments()) {
            const attachment = Zotero.Items.get(attachmentID);
            await findImage(attachment, imageItems);
        }
    }

    if (item.isPDFAttachment()) {
        const imageAnnotations = await getImageAnnotations(item);
        const title = item.getField("title") as string;
        for (const imageAnnotation of imageAnnotations) {
            imageItems.push(imageAnnotation);
        }
    }
    if (item.attachmentContentType?.includes("image")) {
        imageItems.push(item);
    }
    return imageItems;
}

async function findImage(item: Zotero.Item, imageItems?: Zotero.Item[], srcImgBase64Arr?: {
    key: string;
    src: string;
    alt: string;
    srcWidthHeight: {
        width: number;
        height: number;
    };
}[]) {
    if (!srcImgBase64Arr) {
        srcImgBase64Arr = [];
    }
    if (!imageItems) {
        imageItems = [];
    }
    if (!(item.isAttachment())) {
        for (const attachmentID of item.getAttachments()) {
            const attachment = Zotero.Items.get(attachmentID);
            await findImage(attachment, imageItems, srcImgBase64Arr);
        }
    }
    if (item.isPDFAttachment()) {
        const imageAnnotations = await getImageAnnotations(item);
        const title = item.getField("title") as string;
        for (const imageAnnotation of imageAnnotations) {
            const srcObj = await srcBase64Annotation(imageAnnotation, title);
            imageItems.push(imageAnnotation);
            if (srcObj) {
                srcImgBase64Arr.push(srcObj);
            }
        }
    }
    if (item.attachmentContentType?.includes("image")) {
        const srcObj = await srcBase64ImageFile(item);
        imageItems.push(item);
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
        await renderAnnotationImage(imageAnnotation); break;
    }
    return imageAnnotations;
}
async function renderAnnotationImage(imageAnnotation: Zotero.Item) {
    if (!await Zotero.Annotations.hasCacheImage(imageAnnotation)) {
        if (imageAnnotation.parentID) {
            let tabID;
            if (!(tabID = Zotero_Tabs.getTabIDByItemID(imageAnnotation.parentID))) {
                await prepareReader("pagesLoaded");
                while (!(tabID = Zotero_Tabs.getTabIDByItemID(imageAnnotation.parentID))) {
                    Zotero.Promise.delay(100);
                }
            }
            Zotero_Tabs.select(tabID);
        }

        try {
            await Zotero.PDFRenderer.renderAttachmentAnnotations(imageAnnotation.parentID);
        }
        catch (e) {
            Zotero.debug(e);
            throw e;
        }
    }
}

async function srcBase64Annotation(imageAnnotation: Zotero.Item, title: string) {
    const jsonAnnotation = await Zotero.Annotations.toJSON(imageAnnotation);
    if (!jsonAnnotation || !jsonAnnotation.image) return;
    let imgWidthHeight = resolution(jsonAnnotation.image);
    if (!imgWidthHeight) {
        imgWidthHeight = {
            width: window.screen.width,
            height: window.screen.height,
        };
    }
    //const srcWidthHeight = modifyWidthHeight(imgWidthHeight)(maxWidth);
    return {
        key: jsonAnnotation.key,
        src: jsonAnnotation.image,
        alt: title + "-annotation",
        //srcWidthHeight: srcWidthHeight,
        srcWidthHeight: imgWidthHeight,
    };
}

async function srcBase64ImageFile(attachment: Zotero.Item) {
    const srcPath = attachment.getFilePath();
    if (!srcPath) return;
    const srcBase64 = await readImage(srcPath);
    const baseName = OS.Path.basename(srcPath);
    if (!srcBase64) return;
    let imgWidthHeight;
    if (srcBase64?.width && srcBase64?.height) {
        imgWidthHeight = {
            width: srcBase64?.width,
            height: srcBase64?.height
        };
    } else {
        imgWidthHeight = {
            width: window.screen.width,
            height: window.screen.height,
        };
    }
    return {
        key: attachment.key,
        parentKey: attachment.parentID,
        src: srcBase64.base64,
        alt: srcBase64.fileName + srcBase64.fileType,
        srcWidthHeight: imgWidthHeight,
    };
}

function resizeFixRatio(obj: { width: number; height: number; }, value: number, resizeBy?: "width" | "height") {
    if (!resizeBy) {
        resizeBy == "width";
    }
    if (resizeBy == "width") {
        return {
            width: value,
            height: Math.round((value / obj.width) * obj.height)
        };
    } else {
        return {
            height: value,
            width: Math.round((value / obj.height) * obj.width)
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


/* function openContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const idPostfix = "imageViewerContextMeun";
    const copyImageProps = {
        label: "info-copyImage",
        func: copyImage,
        args: []
    };
    const saveImageProps = {
        label: "info-saveImage",
        func: saveImage,
        args: []
    };
    const convertImageProps = {
        label: "info-convertImage",
        func: convertImage,
        args: []
    };
    const editImageProps = {
        label: "info-saveImage",
        func: editImage,
        args: []
    };
    const ocrImageProps = {
        label: "info-ocrImage",
        func: ocrImage,
        args: []
    };

    function copyImage() { }
    function saveImage() { }
    function editImage() { }
    function convertImage() { }
    function ocrImage() { }
    const menuitemGroupArr = [[copyImageProps]];
    const menupopup = makeMenupopup(idPostfix);
    menuitemGroupArr.filter((menuitemGroup: any[], i: number) => {
        menuitemGroup.map((e: any) => makeMenuitem(e, menupopup));
        if (i < menuitemGroupArr.length - 1) {
            menuseparator(menupopup);
        }
    });
    //menupopup.openPopup(images, 'before_end', 0, 0, true, false);
    menupopup.openPopupAtScreen(event.clientX + images.screenX, event.clientY + images.screenY, true);


} */

/* images.addEventListener('hidden', restoreDialog);
          images.addEventListener('view', maximizeDialog);
          images.addEventListener('contextmenu', openMeun); */


/* function makeDialogData(content: string) {
    const dialogData = {
        "content": content
    };
    return dialogData;
} */




//grid-auto-flow: dense;grid-auto-rows: minmax(50px, auto); justify-items: center;    align-items: center;    justify-content: center;    align-content: center;
//min-height: 200px; max-height:${maxHeight};max-Width: ${maxWidth};
// justify-content: space-between;grid-template-rows: masonry;align-content: start; space-evenly
//let sizeStyle: string = '';
/* switch (resize) {
    case "origin": sizeStyle = `width:${obj.srcWidthHeight.width}; height:${obj.srcWidthHeight.height};`;
        break;
    case "small": sizeStyle = makeSizeStyle(resizeFixRatio(obj.srcWidthHeight, 100));
        break;
    case "medium": sizeStyle = makeSizeStyle(resizeFixRatio(obj.srcWidthHeight, 300));
        break;
    case "large": sizeStyle = makeSizeStyle(resizeFixRatio(obj.srcWidthHeight, 600));
}  */
















/* .addCell(0, 0,
    {
        tag: "div",
        namespace: "html",
        id: dialogCellID,
        attributes: {
            style: "width: 400; height: 430;",
            //??��??????????????��????????????dialogData?????????��?????
            "data-bind": "content",
            //????????????property
            "data-prop": "innerHTML",
        },
        children:[],

    }
) */
//dialogImgViewer.dialogData.loadLock.promise.then().then().then().then().then()