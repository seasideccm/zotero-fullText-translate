import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { resolution } from "../utils/imageDimension";
import { getPref, readImage } from "../utils/prefs";
import { makeTagElementProps } from "./toolbarButton";
import Viewer from 'viewerjs';
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { addContextMenu, addToolBar, batchAddEventListener, cssfilesURL, loadCss, setGlobalCssVar, } from './userInerface';
import { prepareReader } from "./prepareReader";
import dragula from 'dragula';
import { getString } from "../utils/locale";
import { fullTextTranslate } from "./fullTextTranslate";
import { imageIdPrefix } from "../utils/imageConjfig";


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
    let items = getItems() || [];
    if (!Array.isArray(items)) items = [items];
    const imageItems: Zotero.Item[] = [];
    for (const item of items) {
        imageItems.push(...(await findImageItems(item)));
    }
    const gallaryGroup: any = {};
    gallaryGroup.title = window.document.title;
    gallaryGroup.treeRowRef = ZoteroPane.collectionsView.selectedTreeRow.ref;
    gallaryGroup.libraryId = gallaryGroup.treeRowRef.libraryID || gallaryGroup.treeRowRef._libraryID;
    gallaryGroup.currentCollectionId = gallaryGroup.treeRowRef.id && "collection-" + gallaryGroup.treeRowRef.id;
    gallaryGroup.tabSelectedID = "tab-" + Zotero_Tabs.selectedID;
    gallaryGroup.tabType = Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.type;
    gallaryGroup.getId = function getId() {
        return this.currentCollectionId || this.tabSelectedID || this.libraryId;
    };
    gallaryGroup.id = gallaryGroup.getId();


    //const selectedIndexs = ZoteroPane.itemsView.selection.selected;
    //const selectedItems = selectedIndexs.map((index: any) => ZoteroPane.itemsView.getRow(index).ref);


    let hasNewContent = false;
    if (!imageItems.length) {
        fullTextTranslate.showInfo(getString("info-selectedItemsNoImage"), 3000);
        return {
            hasNewContent: hasNewContent,
            gallaryGroupId: `gallaryGroup-${gallaryGroup.id}`
        };
    }

    let dialogImgViewer: DialogHelper;
    if (!(dialogImgViewer = addon.data.globalObjs?.dialogImgViewer)) {
        dialogImgViewer = new ztoolkit.Dialog(1, 1);
        addon.data.globalObjs = { dialogImgViewer: dialogImgViewer };
    }

    let container = (dialogImgViewer as any).elementProps.children[0].children[0].children[0];
    let creatCollectionGallery = false;
    if (!container) {
        creatCollectionGallery = true;
    } else {
        creatCollectionGallery = !container.children?.some((imgContainerDiv: TagElementProps) => imgContainerDiv.id == `images-gallaryGroup-${gallaryGroup.id}`);
    }
    if (creatCollectionGallery) {
        hasNewContent = true;
        await renderPDFs(imageItems);
        const imageInfoArr = [];
        for (const imgItem of imageItems) {
            const imageInfo = imageDataFromFile(imgItem);//old makeImgTags(imageInfoArr);
            if (!imageInfo) continue;
            imageInfoArr.push(imageInfo);
        }
        const imgsProps = makeImgTagsFilePath(imageInfoArr);
        if (!container) {
            //容器之上套一层DIV，否则页面过高，对话框有两层vbox
            const containerProps = makeTagElementProps({
                tag: "div",
                namespace: "html",
                id: "firstDiv",
                children: []
            });
            dialogImgViewer.addCell(0, 0,
                containerProps
            );
        }
        //显示分类名称
        const collectionNameDivProps =
        {
            tag: "div",
            namespace: "html",
            //currentCollection.name含有空格时导致 id 无效, ztoolkit 创建元素失败
            id: `gallaryGroup-${gallaryGroup.id}`,
            properties: {
                innerText: `${getString("info-collection")}-${gallaryGroup.title}`
            },
        };

        const imagesContainer = makeTagElementProps(
            {
                tag: "div",
                namespace: "html",
                id: `images-gallaryGroup-${gallaryGroup.id}`,
                children: [collectionNameDivProps, ...imgsProps],
            }
        );
        container = (dialogImgViewer as any).elementProps.children[0].children[0].children[0];
        container.children.push(imagesContainer);

    } else {
        //添加新图片
        const imgContainerDivs = container.children.find((imgContainerDiv: TagElementProps) => imgContainerDiv.id == `images-gallaryGroup-${gallaryGroup.id}`).children;
        const imgIds = imgContainerDivs.map((imgContainerDiv: TagElementProps) => imgContainerDiv.children ? imgContainerDiv.children[0].id : false).filter((e: any) => e);
        const imgIdsString = imgIds.join("");
        const newImgItems = [];
        for (const imgItem of imageItems) {
            if (!imgIdsString.includes(imgItem.key)) {
                newImgItems.push(imgItem);
            }
        }
        if (newImgItems.length) hasNewContent = true;
        renderPDFs(newImgItems);
        const imageInfoArr = [];
        for (const imgItem of newImgItems) {
            const imageInfo = imageDataFromFile(imgItem);
            if (!imageInfo) continue;
            imageInfoArr.push(imageInfo);
        }
        const imgsProps = makeImgTagsFilePath(imageInfoArr);
        imgContainerDivs.push(...imgsProps);
    }
    return {
        hasNewContent: hasNewContent,
        gallaryGroupId: `gallaryGroup-${gallaryGroup.id}`
    };
}

/**
 * show Dialog
 * @param param0 是否有新元素，分类 id
 * @param dialogData 回调函数，添加元素的属性数据 elementProps
 * @remarks
 * 解构传入的对象给参数赋值
 * 
 * { hasNewContent, gallaryGroupId }: { hasNewContent: boolean, gallaryGroupId: string; }
 * 
 * 要解构的参数{ hasNewContent, gallaryGroupId }
 * 
 * 参数的类型{ hasNewContent: boolean, gallaryGroupId: string; }
 */
export function showDialog({ hasNewContent, gallaryGroupId }: { hasNewContent: boolean, gallaryGroupId: string; }, dialogData?: any) {
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

    dialogData = {
        loadCallback: async () => {
            const doc = dialogImgViewer.window.document as Document;
            const firstDiv = doc.getElementById('firstDiv')! as Element;
            addToolBar(doc, firstDiv);
            const imagesArr = doc.querySelectorAll('[id^="images"]');
            setGlobalCssVar(doc)(styleGlobalVar());
            loadCss(doc, cssfilesURL);
            addContextMenu(firstDiv);
            const viewerContainer = ztoolkit.UI.appendElement({ tag: "div", namespace: "html" }, doc.body) as HTMLElement;
            for (const images of imagesArr) {
                const viewer = new Viewer(images as HTMLElement, {
                    title: [1, () => "自定义"],
                    backdrop: "static",
                    container: viewerContainer,
                    zoomRatio: 0.2,
                    initialCoverage: 1,
                });
                batchAddEventListener(
                    images,
                    [
                        ['hidden', restoreDialogSize],
                        ["show", maxOrFullDialog],
                        ["viewed", scale],
                    ],
                );
            }
            const containers = Array.from(doc.getElementsByClassName('containerImg'));
            Zotero.dragDoc = doc;
            const foo = dragula(containers);
            await windowFitSize(dialogImgViewer.window);
            scrollToCollection(gallaryGroupId);
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
    const focus = () => {
        scrollToCollection(gallaryGroupId);
        dialogImgViewer.window.focus();
    };
    dialogImgViewer.window ? (dialogImgViewer.window.closed ? open(args) : (hasNewContent ? closeOpen(args) : focus())) : open(args);

    function scrollToCollection(gallaryGroupId: string) {
        const collection = dialogImgViewer.window.document?.querySelector(`#${gallaryGroupId}`);
        collection?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    async function restoreDialogSize() {
        const state = {
            STATE_MAXIMIZED: 1,
            STATE_MINIMIZED: 2,
            STATE_NORMAL: 3,
            STATE_FULLSCREEN: 4,
        };
        if (dialogImgViewer.window.document.fullscreen && getPref('windowSizeOnViewImage') != "full") {
            await dialogImgViewer.window.document.exitFullscreen();
        }
        switch (dialogImgViewer.windowState) {
            case state.STATE_MAXIMIZED: dialogImgViewer.window.maximize();
                break;
            case state.STATE_MINIMIZED: dialogImgViewer.window.restore();
                break;
            case state.STATE_NORMAL:
                //dialogImgViewer.window.sizeToContent();
                await windowFitSize(dialogImgViewer.window);
                break;
            case state.STATE_FULLSCREEN: break;
        }
        scrollToCollection(gallaryGroupId);
    }
    async function maxOrFullDialog(e: any) {
        //const viewer = e.target.viewer;
        dialogImgViewer.windowState = dialogImgViewer.window.windowState;
        const windowSizeOnViewImage = getPref('windowSizeOnViewImage') || "full";
        if (windowSizeOnViewImage !== "origin") {
            windowSizeOnViewImage == "full" ? await dialogImgViewer.window.document.documentElement.requestFullscreen() : dialogImgViewer.window.maximize();
        }
    }
    function scale(e: any) {
        const viewer = e.target.viewer;
        const currentImg = e.detail.image;
        if (!addon.data.globalObjs?.dialogImgViewer.fit || !viewer) return;
        switch (addon.data.globalObjs?.dialogImgViewer.fit) {
            case "fitWidth":
                viewer.scale(dialogImgViewer.window.innerWidth / currentImg.width);
                break;
            case "fitHeight":
                viewer.scale(dialogImgViewer.window.innerHeight / currentImg.height);
                break;
            case "fitDefault":
                viewer.reset();
                break;
        }
    }
}



function getViewerCurrent(doc: Document, viewers: any[]) {
    const viewerIdCurrent = doc.querySelector(".viewer-canvas img")?.parentElement?.parentElement?.id;
    if (!viewerIdCurrent) return;
    const viewerCurrent = viewers.find((e: any) =>
        e.viewer?.id == viewerIdCurrent
    );
    return viewerCurrent;
}

function styleGlobalVar() {
    const backgroundColor = getPref("backgroundColorDialogImgViewer") as string || "#b90f0f";
    const sizeStyle = getThumbnailSize();
    const columns = calColumns(sizeStyle);
    return [
        ["--bgColor", backgroundColor],
        ["--columns", columns],
        ["--thumbnailSize", `${sizeStyle}px`],
        ["--screenHeight", `${window.screen.availHeight}px`]
    ];
}

export function getThumbnailSize() {
    const thumbnailSize = getPref('thumbnailSize') as string || "small";
    let sizeStyle: number = 0;
    switch (thumbnailSize) {
        case "small": sizeStyle = 100;
            break;
        case "medium": sizeStyle = 300;
            break;
        case "large": sizeStyle = 600;
    }
    return sizeStyle;
}

export function calColumns(sizeStyle: number) {

    let maxColumns;
    const maxColumnsPC = 10;
    const maxColumnsMobileH = 5;
    const maxColumnsMobileV = 3;
    window.screen.width > 768 ? maxColumns = maxColumnsPC : (window.screen.width > window.screen.height ? maxColumns = maxColumnsMobileH : maxColumns = maxColumnsMobileV);
    maxColumns * sizeStyle > window.screen.width ? maxColumns = Math.floor(window.screen.width / sizeStyle) : () => { };
    return maxColumns;
}

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

function makeImgTagsFilePath(srcData: {
    key: string;
    parentKey: number;
    src: string;
    alt: string;
}[]) {
    const elementProps: TagElementProps[] = [];
    srcData.filter(obj => {
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
                id: imageIdPrefix + obj.key,
                attributes: {
                    src: obj.src,
                    alt: obj.alt,
                    loading: "lazy",
                    decoding: "async",

                }
            },]
        });
        elementProps.push(elementProp);
    });
    return elementProps;
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
                    loading: "lazy",
                    decoding: "async",

                }
            },]
        });
        elementProps.push(elementProp);
    });
    return elementProps;
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
export const noIt = (items: any) => items === void 0 || (Array.isArray(items) && !items.length) || items === false;
function getItems(itemIDs?: number | number[]) {
    let items;
    if (itemIDs !== void 0) {
        items = Zotero.Items.get(itemIDs);
    }
    if (noIt(items)) items = Zotero.Items.get(Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.data?.itemID);
    if (noIt(items)) items = Zotero.getActiveZoteroPane().getSelectedItems();
    if (noIt(items)) items = Zotero.getActiveZoteroPane().getSelectedCollection()?.getChildItems();
    if (noIt(items)) {
        itemIDs = Zotero_Tabs._tabs.filter(tab => tab.type.includes("reader")).map(tab => tab.data.itemID);
        items = Zotero.Items.get(itemIDs);
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
    if (item.attachmentContentType === "text/html") {
        const type = 'snapshot';
        fullTextTranslate.showInfo("type = " + type);
    }
    if (item.attachmentContentType === "application/epub+zip") {
        const type = 'epub';
        fullTextTranslate.showInfo("type = " + type);
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

function imageDataFromFile(attachment: Zotero.Item) {
    let srcPath: string, title: string;
    const itemType = attachment.itemType as string;
    switch (itemType) {
        case "annotation":
            if (attachment.annotationType != "image") { break; };
            srcPath = Zotero.Annotations.getCacheImagePath(attachment);
            title = attachment.parentItem?.getField("title") + "-annotation";
            break;

        case "attachment":
            if (!attachment.attachmentContentType.includes("image")) { break; };
            srcPath = attachment.getFilePath() as string;
            title = attachment.getField("title") + "-image";
            break;
    }
    srcPath = "file:///" + srcPath!;

    /* const srcBase64 = await readImage(srcPath);
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
    } */

    //const alt = title ? title + "-annotation" : srcBase64.fileName + srcBase64.fileType;
    //const src = base64OrFilePath == "filePath" ? srcPath : srcBase64.base64;
    return {
        key: attachment.key,
        parentKey: attachment.parentID! as number,
        src: srcPath!,
        alt: title!,
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

export function getParentItem(item: Zotero.Item | undefined) {
    if (!item?.parentItem) return;
    if ((item?.parentItem as Zotero.Item).isRegularItem()) {
        return item.parentItem;
    } else {
        return getParentItem(item.parentItem);
    }
}