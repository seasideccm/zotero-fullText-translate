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
import { getString } from "../utils/locale";
import { fullTextTranslate } from "./fullTextTranslate";

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
    if (!imageItems.length) {
        fullTextTranslate.showInfo(getString("info-selectedItemsNoImage"), 3000);
        return hasNewContent;
    }

    let dialogImgViewer: DialogHelper;
    if (!(dialogImgViewer = addon.data.globalObjs?.dialogImgViewer)) {
        dialogImgViewer = new ztoolkit.Dialog(1, 1);
        addon.data.globalObjs = { dialogImgViewer: dialogImgViewer };
    }
    const currentCollection = ZoteroPane.collectionsView.selectedTreeRow.ref;
    let container = (dialogImgViewer as any).elementProps.children[0].children[0].children[0];
    let creatCollectionGallery = false;
    if (!container) {
        creatCollectionGallery = true;
    } else {
        creatCollectionGallery = !container.children?.some((imgContainerDiv: TagElementProps) => imgContainerDiv.id == `images-collection-${currentCollection.id}`);
    }
    if (creatCollectionGallery) {
        hasNewContent = true;
        await renderPDFs(imageItems);
        const imageInfoArr = [];
        for (const imgItem of imageItems) {
            const imageInfo = await getImageInfo(imgItem);
            if (!imageInfo) continue;
            imageInfoArr.push(imageInfo);
        }
        const imgsProps = makeImgTags(imageInfoArr);
        if (!container) {
            //容器之上套一层DIV，否则页面过高，对话框有两层vbox
            const container = makeTagElementProps({
                tag: "div",
                namespace: "html",
                id: "firstDiv",
                children: []
            });
            dialogImgViewer.addCell(0, 0,
                container
            );
        }
        const collectionName =
        {
            tag: "div",
            namespace: "html",
            //currentCollection.name含有空格时导致 id 无效
            id: `collection-${currentCollection.id}`,
            properties: {
                innerText: `${getString("info-collection")}-${currentCollection.name}`
            },
            attributes: {
                style: `font-size: 2rem;`
            }
        };

        const imagesContainer = makeTagElementProps(
            {
                tag: "div",
                namespace: "html",
                id: `images-collection-${currentCollection.id}`,
                children: [collectionName, ...imgsProps],
            }
        );
        container = (dialogImgViewer as any).elementProps.children[0].children[0].children[0];
        //container.children.push(collectionName, imagesContainer);
        container.children.push(imagesContainer);

    } else {
        const imgContainerDivs = container.children.find((imgContainerDiv: TagElementProps) => imgContainerDiv.id == `images-collection-${currentCollection.id}`).children;
        const imgIds = imgContainerDivs.map((imgContainerDiv: TagElementProps) => imgContainerDiv.children ? imgContainerDiv.children[0].id : false).filter((e: any) => e);
        const imgIdsString = imgIds.join("");
        const newImgItems = [];
        for (const imgItem of imageItems) {
            if (!imgIdsString.includes(imgItem.key)) {
                newImgItems.push(imgItem);
                hasNewContent = true;
            }
        }
        renderPDFs(newImgItems);
        const imageInfoArr = [];
        for (const imgItem of newImgItems) {
            const imageInfo = await getImageInfo(imgItem);
            if (!imageInfo) continue;
            imageInfoArr.push(imageInfo);
        }
        const imgsProps = makeImgTags(imageInfoArr);
        imgContainerDivs.push(...imgsProps);
    }
    return hasNewContent;
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
            //[id^="images"]
            const doc = dialogImgViewer.window.document as Document;
            const firstDiv = doc.getElementById('firstDiv')!;
            const imagesArr = doc.querySelectorAll('[id^="images"]');
            const cssfilesURL = [
                `chrome://${config.addonRef}/content/viewer.css`,
                `chrome://${config.addonRef}/content/dragula.css`,
            ];
            insertStyle(dialogImgViewer.window.document);
            loadCss(dialogImgViewer.window.document, cssfilesURL);
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
            const idPostfix = "imageViewerContextMeun";
            const imgCtxObj = new contextMenu({
                menuPropsGroupsArr,
                idPostfix
            });
            /* imgCtxObj.contextMenu.addEventListener("command", e => {
                const tagName = (e.target as any).tagName.toLowerCase();
                if (tagName === 'menuitem') {
                    imgCtxObj.handleMenuItem(imgCtxObj.contextMenu.triggerNode, e);
                }
            }); */
            //事件委托
            firstDiv.addEventListener('contextmenu', e => {
                const tagName = (e.target as any).tagName;
                if (tagName === 'IMG') {
                    //如果传入了最后一个参数 triggerEvent （此处为 e ），contextMenu 才会有 triggerNode

                    imgCtxObj.contextMenu.openPopup(e.target, 'after_pointer', 0, 0, true, false, e);
                    imgCtxObj.contextMenu.moveTo(e.x, e.y);

                }
            });

            for (const images of imagesArr) {
                new Viewer(images as HTMLElement);
                batchAddEventListener(
                    [
                        [images,
                            [
                                ['hidden', restoreDialog],
                                ['view', maxOrFullDialog],
                            ],
                        ],
                    ]);
            }
            const containers = Array.from(doc.getElementsByClassName('containerImg'));
            Zotero.dragDoc = doc;
            const foo = dragula(containers);
            await windowFitSize(dialogImgViewer.window);
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


/* function openContextMeun(contextMenuObj: contextMenu, event: MouseEvent, element: HTMLElement) {
    contextMenuObj.contextMenu.openPopupAtScreen(event.clientX + element.screenX, event.clientY + element.screenY, true);

    contextMenuObj.contextMenu.addEventListener('click', (e: Event) => {
        const tagName = (e.target as any).tagName.toLowerCase();
        if (tagName === 'menuitem') {
            contextMenuObj.handleMenuItem(event, e);
        }
    });
    document.querySelector("#browser")!.appendChild(imgCtxObj.contextMenu);
} */

async function renderPDFs(newImgItems: any[]) {
    const imageAnnotations = newImgItems.filter((item: any) => item.itemType == "annotation");
    const imageAnnotationByPdf = imageAnnotations.reduce((catalog: any, item: any) => {
        catalog[item.parentID] ? catalog[item.parentID].push(item) : catalog[item.parentID] = [item];
        return catalog;
    }, {});
    for (const imageAnnotations of Object.values(imageAnnotationByPdf)) {
        await renderAnnotationImage(imageAnnotations as Zotero.Item[]);
    }
}

async function renderAnnotationImage(imageAnnotations: Zotero.Item[]) {

    //针对一篇pdf
    let tabId, reader;
    for (const imageAnnotation of imageAnnotations) {
        if (await Zotero.Annotations.hasCacheImage(imageAnnotation)) continue;
        if (!imageAnnotation.parentID) continue;
        tabId = Zotero_Tabs.getTabIDByItemID(imageAnnotation.parentID);
        if (tabId) {
            Zotero_Tabs.select(tabId);
        } else {
            await Zotero.Reader.open(imageAnnotation.parentID);
            tabId = Zotero_Tabs.getTabIDByItemID(imageAnnotation.parentID);
        }
        if (!reader) {
            reader = (await prepareReader("pagesLoaded"))("reader");
        }
        if (await Zotero.Annotations.hasCacheImage(imageAnnotation)) continue;
        const position = JSON.parse(imageAnnotation.annotationPosition);
        const pageIndex = position.pageIndex;
        await reader.navigate({ pageIndex: pageIndex });
        let n = 0;
        while (!(await Zotero.Annotations.hasCacheImage(imageAnnotation)) && n++ < 20) {
            await Zotero.Promise.delay(100);
        }
        if (await Zotero.Annotations.hasCacheImage(imageAnnotation)) continue;
        Zotero_Tabs.close(tabId);
        await Zotero.Reader.open(imageAnnotation.parentID);
        //const primaryView = (await prepareReader("pagesLoaded"))("primaryView");
        //primaryView._iframeWindow.PDFViewerApplication.pdfViewer.currentPageNumber = pageIndex + 1;
        reader = (await prepareReader("pagesLoaded"))("reader");
        await reader.navigate({ pageIndex: pageIndex });
        tabId = Zotero_Tabs.getTabIDByItemID(imageAnnotation.parentID);
        n = 0;
        while (!(await Zotero.Annotations.hasCacheImage(imageAnnotation)) && n++ < 20) {
            await Zotero.Promise.delay(100);
        }

    }
    if (tabId) {
        Zotero_Tabs.close(tabId);
    }
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
    //containerImg{object-fit: contain;} border-color:${backgroundColor};          border: 3vw solid ${backgroundColor};          background-color:${backgroundColor};          padding:1vw;            min-height:20px;
    const styleImgDiv =
        `div[id^="container-"]{
            padding:10px;
            background-color:${backgroundColor};
    }`;
    const styleImg =
        `img{
         display: block;
         width: 100%;
         max-height: ${2 * sizeStyle}; 
         object-fit: contain;
         border-color: #FFFFFF;
        }`;
    style = style + makeImagesDivStyle(sizeStyle) + styleImg + styleImgDiv;
    if (!style.length) return;
    document.head.appendChild(ztoolkit.UI.createElement(document, "style", {
        properties: {
            innerHTML: style,
        },
    }));
}

function makeImagesDivStyle(sizeStyle: number) {
    const backgroundColor = getPref("backgroundColorDialogImgViewer") as string || "#b90f0f";
    let maxColumns;
    const maxColumnsPC = 10;
    const maxColumnsMobileH = 5;
    const maxColumnsMobileV = 3;
    window.screen.width > 768 ? maxColumns = maxColumnsPC : (window.screen.width > window.screen.height ? maxColumns = maxColumnsMobileH : maxColumns = maxColumnsMobileV);
    maxColumns * sizeStyle > window.screen.width ? maxColumns = Math.floor(window.screen.width / sizeStyle) : () => { };
    /* const container = addon.data.globalObjs?.dialogImgViewer.elementProps.children[0].children[0].children[0];
    const imgContainerDivs = container.children[0].children;
    if (sizeStyle != 0) {
        columnsByScreen = Math.floor(window.screen.width / sizeStyle);
        columnsByScreen > maxColumns ? columnsByScreen = maxColumns : (columnsByScreen == 0 ? columnsByScreen = 1 : () => { });

    } else {
        columnsByScreen = maxColumns;
    } */
    const columns = maxColumns;
    //const columns = imgContainerDivs.length >= columnsByScreen ? columnsByScreen : imgContainerDivs.length; grid-gap: 1vw; background-color: ${backgroundColor};         overflow: auto;
    const containerImagesDivStyle = `
    [id^="images"]{
        display: grid;
        grid-template-rows: masonry;
        max-width: 100vw;
        max-height: ${window.screen.availHeight - 100};
        min-height: 200px;
        ${getStyle2String(columns, sizeStyle)};
        overflow: auto;
    }
    [id^="collection-"]{
        grid-column-start: span ${columns};
        place-self: center center;
        background-color: #FFFFFF;
    }
    `;
    //防止溢出 min-width: 0;     overflow: hidden;
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

//const keepDivs = [...subSet(imgContainerDivs, imgContainerDivsExclude)];
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
//primaryView.navigate(location)

/* _render(pageIndexes) {
    for (let page of this._pages) {
        if (!pageIndexes || pageIndexes.includes(page.pageIndex)) {
            page.render();
        }
    }
} */
/* function addBrowser() {
    if (!Zotero.Browser) {
        Zotero.Browser = {
            createHiddenBrowser: function (win, options = {}) {
                if (!win) {
                    win = Services.wm.getMostRecentWindow("navigator:browser");
                    if (!win) {
                        win = Services.ww.activeWindow;
                    }
                    // Use the hidden DOM window on macOS with the main window closed
                    if (!win) {
                        const appShellService = Components.classes["@mozilla.org/appshell/appShellService;1"]
                            .getService(Components.interfaces.nsIAppShellService);
                        win = appShellService.hiddenDOMWindow;
                    }
                    if (!win) {
                        throw new Error("Parent window not available for hidden browser");
                    }
                }

                // Create a hidden browser
                const hiddenBrowser = win.document.createElement("browser");
                hiddenBrowser.setAttribute('type', 'content');
                hiddenBrowser.setAttribute('disableglobalhistory', 'true');
                win.document.documentElement.appendChild(hiddenBrowser);
                //docShell缺失
                // Disable some features
                hiddenBrowser.docShell.allowAuth = false;
                hiddenBrowser.docShell.allowDNSPrefetch = false;
                hiddenBrowser.docShell.allowImages = false;
                hiddenBrowser.docShell.allowJavascript = options.allowJavaScript !== false;
                hiddenBrowser.docShell.allowMetaRedirects = false;
                hiddenBrowser.docShell.allowPlugins = false;
                Zotero.debug("Created hidden browser");
                return hiddenBrowser;
            },

            deleteHiddenBrowser: function (myBrowsers) {
                if (!(myBrowsers instanceof Array)) myBrowsers = [myBrowsers];
                for (let i = 0; i < myBrowsers.length; i++) {
                    let myBrowser = myBrowsers[i];
                    myBrowser.stop();
                    myBrowser.destroy();
                    myBrowser.parentNode.removeChild(myBrowser);
                    myBrowser = null;
                    Zotero.debug("Deleted hidden browser");
                }
            }
        };
    }
} */

/*
const { HiddenBrowser } = ChromeUtils.import("chrome://zotero/content/HiddenBrowser.jsm");
let browser = await HiddenBrowser.create(url, {
                    requireSuccessfulStatus: true,
                    docShell: { allowImages: true },
                    cookieSandbox,
                });

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
        } */
/* if (!await Zotero.Annotations.hasCacheImage(imageAnnotation)) {
    try {

        await Zotero.PDFRenderer.renderAttachmentAnnotations(imageAnnotation.parentID);
        Zotero_Tabs.close(Zotero_Tabs.selectedID);

    }
    catch (e) {
        Zotero.debug(e);
        throw e;
    }
} */

//openContextMeun(e, firstDiv);
/* const observe = new MutationObserver(mutationCallback);
function mutationCallback (element:Element){
    if(!element.childElementCount){
        const elementFill=ztoolkit.UI.createElement(doc,"span",{})
        element.appendChild(elementFill)
    }

} */