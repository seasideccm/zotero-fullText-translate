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

async function viewImg() {
    const hasNewContent = await makeDialogElementProps();
    await showDialog(hasNewContent);
};

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

    const container = (dialogImgViewer as any).elementProps.children[0].children[0].children;
    if (!container.length) {
        const imageInfoArr = [];
        for (const imgItem of imageItems) {
            const imageInfo = await getImageInfo(imgItem);
            if (!imageInfo) continue;
            imageInfoArr.push(imageInfo);
        }
        const imgsProps = makeImgTags(imageInfoArr);
        //容器之上套一层DIV，否则页面过高，对话框有两层vbox
        const container = makeTagElementProps({
            tag: "div",
            namespace: "html",
            id: "firstDiv",
            children: [{
                tag: "div",
                namespace: "html",
                id: "images",
                children: imgsProps,
            }]
        });
        dialogImgViewer.addCell(0, 0,
            container
        );
    } else {
        const imgContainerDivs = container[0].children[0].children;
        const imgIds = imgContainerDivs.map((imgContainerDiv: TagElementProps) => imgContainerDiv.children![0].id);
        const imgIdsString = imgIds.join("");
        const imageInfoArr = [];
        for (const imgItem of imageItems) {
            if (!imgIdsString.includes(imgItem.key)) {
                const imageInfo = await getImageInfo(imgItem);
                if (!imageInfo) continue;
                imageInfoArr.push(imageInfo);
                hasNewContent = true;
            }
        }
        const imgsProps = makeImgTags(imageInfoArr);
        imgContainerDivs.push(...imgsProps);
        const collectionId = ZoteroPane.collectionsView.selectedTreeRow.ref.id;
        if (collectionId) {
            const imgContainerDivsExclude = imgContainerDivs
                .filter((imgContainerDiv: TagElementProps) => {
                    const attachmentKey = imgContainerDiv.children![0].id?.replace("showImg-", '') as string;
                    const attachment = Zotero.Items.getByLibraryAndKey(Zotero.Libraries.userLibraryID, attachmentKey);
                    if (!attachment) return false;
                    const parentCollections = getParentCollection(attachment as Zotero.Item);
                    if (parentCollections && parentCollections.length) {
                        return !parentCollections.includes(collectionId);
                    }
                });
            const keepDivs = [...subSet(imgContainerDivsExclude, imgContainerDivs)];
            imgContainerDivs.length = 0;
            imgContainerDivs.push(...keepDivs);
        }
    }
    return hasNewContent;
}

function subSet(arr1: any[], arr2: any[]) {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const subset = [];
    for (const item of set1) {
        if (!set2.has(item)) {
            subset.push(item);
        }
    }
    return subset;
};

function getParentCollection(item: Zotero.Item) {
    if (!item.parentItem) return;
    if ((item.parentItem as Zotero.Item).isRegularItem()) {
        return item.parentItem.getCollections();
    } else {
        item = item.parentItem;
        getParentCollection(item);
    }
    /* if (attachment.itemType == "annotation") {                
    }
    if (attachment.itemType == "attachment") {                
    } */
}

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
        if (dialogImgViewer.window.document.fullscreen && getPref('windowSizeOnViewImage') != "full") {
            await dialogImgViewer.window.document.exitFullscreen();
        }
        dialogImgViewer.window.sizeToContent();
        await windowFitSize(dialogImgViewer.window);
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
            Zotero.dragDoc = doc;
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
            //每张图片上套一层 div 作为容器
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
                }
            },]
        });
        elementProps.push(elementProp);
    });
    return elementProps;
}

function insertStyle(document: Document, style: string = '') {
    //containerImg{object-fit: contain;}
    const styleImg = `img{ display: block; width: 100%;}`;
    style = style + makeImagesDivStyle() + styleImg;
    if (!style.length) return;
    document.head.appendChild(ztoolkit.UI.createElement(document, "style", {
        properties: {
            innerHTML: style,
        },
    }));
}

function makeImagesDivStyle() {
    const backgroundColor = getPref("backgroundColorDialogImgViewer") as string || "#b90f0f";
    const thumbnailSize = getPref('thumbnailSize') as string || "small";
    let sizeStyle: number = 0;
    switch (thumbnailSize) {
        case "small": sizeStyle = 100;
            break;
        case "medium": sizeStyle = 300;
            break;
        case "large": sizeStyle = 600;
    }
    let columnsByScreen, maxColumns;
    const maxColumnsPC = 10;
    const maxColumnsMobileH = 5;
    const maxColumnsMobileV = 3;
    window.screen.width > 768 ? maxColumns = maxColumnsPC : (window.screen.width > window.screen.height ? maxColumns = maxColumnsMobileH : maxColumns = maxColumnsMobileV);
    const container = addon.data.globalObjs?.dialogImgViewer.elementProps.children[0].children[0].children;
    const imgContainerDivs = container[0].children[0].children;
    if (sizeStyle != 0) {
        columnsByScreen = Math.floor(window.screen.width / sizeStyle);
        columnsByScreen > maxColumns ? columnsByScreen = maxColumns : (columnsByScreen == 0 ? columnsByScreen = 1 : () => { });

    } else {
        columnsByScreen = maxColumns;
    }
    const columns = imgContainerDivs.length >= columnsByScreen ? columnsByScreen : imgContainerDivs.length;
    const containerImagesDivStyle = `
    #images{
        display: grid;    
        grid-gap: 1vw;    
        grid-template-rows: masonry;
        max-width: 100vw;
        background-color: ${backgroundColor};
        max-height: 100vh;
        min-height: 25vh;
        ${getStyle2String(columns, sizeStyle)}
    }
    `;
    return containerImagesDivStyle;

    function getStyle2String(columns: number, sizeStyle: number) {
        return `grid-template-columns: repeat(${columns},1fr); min-width: calc(${sizeStyle}px * ${columns});`;

    }
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
    while (dialogWin.document.documentElement.scrollHeight == 0) {
        await Zotero.Promise.delay(100);
    }
    while ((dialogWin.document.documentElement.scrollWidth) == 0) {
        await Zotero.Promise.delay(100);
    }
    let contentHeight = dialogWin.document.documentElement.scrollHeight;
    let contentWidth = dialogWin.document.documentElement.scrollWidth;
    if (contentHeight + 37 > window.screen.height) {
        contentHeight = window.screen.height - 37;
    }
    if (contentWidth + 14 > window.screen.width) {
        contentWidth = window.screen.width - 14;
    }
    dialogWin.resizeTo(contentWidth, contentHeight);
    const screenCenterX = window.screen.width / 2;
    const screenCenterY = window.screen.height / 2;
    const dialogWinCenterXscreenX = dialogWin.outerWidth / 2 + dialogWin.screenX;
    const dialogWinCenterYscreenY = dialogWin.outerHeight / 2 + dialogWin.screenY;
    const moveX = screenCenterX - dialogWinCenterXscreenX;
    const moveY = screenCenterY - dialogWinCenterYscreenY;
    dialogWin.moveBy(moveX, moveY);
}


async function getImageInfo(item: Zotero.Item) {
    const itemType = item.itemType as string;
    switch (itemType) {
        case "annotation":
            if (item.annotationType != "image") { break; };
            await renderAnnotationImage(item);
            return await srcBase64Annotation(item, item.parentItem?.getField("title") as string);
        case "attachment":
            if (!item.attachmentContentType.includes("image")) { break; };
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
            await findImageItems(attachment, imageItems);
        }
    }

    if (item.isPDFAttachment()) {
        const imageAnnotations = await getImageAnnotations(item);
        for (const imageAnnotation of imageAnnotations) {
            imageItems.push(imageAnnotation);
        }
    }
    if (item.attachmentContentType?.includes("image")) {
        imageItems.push(item);
    }
    return imageItems;
}

async function getImageAnnotations(item: Zotero.Item) {
    const annotations = item.getAnnotations();
    const imageAnnotations = annotations.filter(e => e.annotationType == 'image');
    return imageAnnotations;
}

async function renderAnnotationImage(imageAnnotation: Zotero.Item) {
    if (!await Zotero.Annotations.hasCacheImage(imageAnnotation)) {
        if (imageAnnotation.parentID) {
            let tabID;
            if (!(tabID = Zotero_Tabs.getTabIDByItemID(imageAnnotation.parentID))) {
                await Zotero.Reader.open(imageAnnotation.parentID);
                await prepareReader("pagesLoaded");
                while (!(tabID = Zotero_Tabs.getTabIDByItemID(imageAnnotation.parentID))) {
                    await Zotero.Promise.delay(100);
                }
            }
            Zotero_Tabs.select(tabID);
        }
        if (!Zotero.Browser) {
            Zotero.Browser = {
                createHiddenBrowser: function () {
                    const hiddenBrowser = document.createElement("iframe");
                    hiddenBrowser.style.display = "none";
                    if (document.domain == document.location.hostname) {
                        hiddenBrowser.sandbox = "allow-same-origin allow-forms allow-scripts";
                    }
                    const body = document.createElement("body");
                    //ztoolkit.UI.replaceElement({ tag: "body", namespace: "html" }, document.body);
                    document.body.remove();
                    document.appendChild(body);
                    document.body.appendChild(hiddenBrowser);
                    return hiddenBrowser;
                },
                deleteHiddenBrowser: function (hiddenBrowser: HTMLIFrameElement) {
                    document.body.removeChild(hiddenBrowser);
                }
            };
        }
        if (!await Zotero.Annotations.hasCacheImage(imageAnnotation)) {
            try {

                await Zotero.PDFRenderer.renderAttachmentAnnotations(imageAnnotation.parentID);
                Zotero_Tabs.close(Zotero_Tabs.selectedID);

            }
            catch (e) {
                Zotero.debug(e);
                throw e;
            }
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
    return {
        key: jsonAnnotation.key,
        src: jsonAnnotation.image,
        alt: title + "-annotation",
        srcWidthHeight: imgWidthHeight,
    };
}

async function srcBase64ImageFile(attachment: Zotero.Item) {
    const srcPath = attachment.getFilePath();
    if (!srcPath) return;
    const srcBase64 = await readImage(srcPath);
    //const baseName = OS.Path.basename(srcPath);
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

//, resize: "origin" | "small" | "medium" | "large" | string = "small"
const makeSizeStyle = (widthHeight: {
    width: number;
    height: number;
}) => {
    return `width:${widthHeight.width}; height:${widthHeight.height};`;
};

