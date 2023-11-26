import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { resolution } from "../utils/imageDimension";
import { getPref, readImage } from "../utils/prefs";
import { makeMenuitem, makeMenupopup, makeTagElementProps, menuseparator } from "./toolbarButton";
import Viewer from 'viewerjs';
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { batchAddEventListener, createContextMenu, menuPropsGroupsArr } from "./userInerface";
//import { imageViewerContextMeun } from "./userInerface";
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
    //const maxWidth = 800;
    const srcImgBase64Arr = await getImgsBase64();
    if (!srcImgBase64Arr) return;
    const hasNewContent = makeDialogElementProps(srcImgBase64Arr);
    await showDialog(hasNewContent);
}

function makeDialogElementProps(srcImgBase64Arr: imageProps[]) {
    let hasNewContent = false;
    let dialogImgViewer: DialogHelper;
    if (!(dialogImgViewer = addon.data.globalObjs?.dialogImgViewer)) {
        dialogImgViewer = new ztoolkit.Dialog(1, 1);
        addon.data.globalObjs = { dialogImgViewer: dialogImgViewer };
    }
    let container = (dialogImgViewer as any).elementProps.children[0].children[0].children;
    const resize = getPref('thumbnailSize') as string;
    const imgsProps = makeImgTags(srcImgBase64Arr, resize);
    const backgroundColor = getPref("backgroundColorDialogImgViewer") as string || "#b90f0f";
    //const imgList = imgListProps(childs);
    let columnsByScreen;
    window.screen.width > 768 ? columnsByScreen = 4 : columnsByScreen = 2;
    //const maxHeight = window.screen.height * 0.95;
    //const maxWidth = window.screen.width * 0.95;
    const style1 = `
    display: grid;    
    grid-gap: 1vw;    
    grid-template-rows: masonry;
    max-Width: 100vw;
    background-color: ${backgroundColor};    
    `;
    //grid-auto-flow: dense;grid-auto-rows: minmax(50px, auto); justify-items: center;    align-items: center;    justify-content: center;    align-content: center;
    //min-height: 200px; max-height:${maxHeight};max-Width: ${maxWidth}; 
    // justify-content: space-between;grid-template-rows: masonry;align-content: start; space-evenly space-between space-around normal start - 对齐容器的起始边框。end - 对齐容器的结束边框。center - 容器内部居中。stretch 
    if (!container.length) {
        const columns = imgsProps.length >= columnsByScreen ? columnsByScreen : imgsProps.length;
        const style2 = `grid-template-columns: repeat(${columns},1fr); min-width: calc(100px * ${columns});`;
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
                /* attributes: {
                    style: `min-height: 600px;`,

                } */
                //display: flex; flex-wrap: wrap; 
            });
        dialogImgViewer.addCell(0, 0,
            container
        );
    } else {
        /* const lis = container[0].children[0].children;
        const imgIds = lis.map((li: TagElementProps) => li.children![0].id);
        for (const imgLi of imgList) {
            const imgId = imgLi.children![0].id;
            if (!imgIds.includes(imgId)) {
                container[0].children[0].children.push(imgLi);
                hasNewContent = true;
            }
        } */
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
        loadCallback: () => {
            const doc = dialogImgViewer.window.document;
            const images = doc.getElementById('images')!;
            windowFitSize(dialogImgViewer.window);
            insertStyle(dialogImgViewer.window.document);
            loadCss(dialogImgViewer.window.document);
            function openMeun(event: MouseEvent) {
                const idPostfix = "imageViewerContextMeun";
                const menuId = config.addonRef + '-' + idPostfix;
                let menupopup;
                //必须挂载在节点上
                if (!(menupopup = document.getElementById(menuId) as XUL.MenuPopup)) {
                    menupopup = createContextMenu(menuPropsGroupsArr, "imageViewerContextMeun");
                    document.querySelector("#browser")!.appendChild(menupopup);
                }
                menupopup.openPopupAtScreen(event.clientX + images.screenX, event.clientY + images.screenY, true);
                //无效 images.parentNode.parentNode.parentNode.parentNode.appendChild(menupopup);
                //无效 doc.body.childNodes[0].appendChild(menupopup);

            }

            batchAddEventListener(
                [
                    [images,
                        [
                            ['hidden', restoreDialog],
                            ['view', maxOrFullDialog],
                            ['contextmenu', openMeun],
                        ],
                    ],
                ]);

            new Viewer(images);
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

function insertStyle(document: Document, style?: string) {
    style = style || `img{width: 100%;}`;
    // object-fit: contain; display: block; 
    document.head.appendChild(ztoolkit.UI.createElement(document, "style", {
        properties: {
            innerHTML: style,
        },
    }));
}

function loadCss(document: Document) {
    document.head.appendChild(ztoolkit.UI.createElement(document, "link", {
        attributes: {
            rel: "stylesheet",
            href: `chrome://${config.addonRef}/content/viewer.css`,
            type: "text/css",
        }
    }));
}

function windowFitSize(dialogWin: Window) {
    const contentHeight = dialogWin.document.documentElement.scrollHeight;
    const contentWidth = dialogWin.document.documentElement.scrollWidth;
    //const reduceFactor = 1;
    //const outerHeight = dialogWin.outerHeight;
    //const outerWidth = dialogWin.outerWidth;
    //let finalHeight = contentHeight;
    //let finalWidth = contentWidth;
    if (contentHeight + 37 > window.screen.height || contentWidth + 14 > window.screen.width) {
        (dialogWin as any).maximize();
    } else {
        dialogWin.resizeTo(contentWidth + 14, contentHeight + 37);
    }
    /* if (contentWidth > window.screen.width) {
        finalWidth = window.screen.width * reduceFactor;
    }
    if (finalHeight != outerHeight || finalWidth != outerWidth) {
        
    } */
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
        await findImage(item, srcImgBase64ArrTotal);
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
        if (!items.length) {
            const collectionSelected = Zotero.getActiveZoteroPane().getSelectedCollection();
            if (collectionSelected) {
                items = collectionSelected.getChildItems();
            }
        }
    }
    return items;

}

async function findImage(item: Zotero.Item, srcImgBase64Arr?: {
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
    /*  if (!maxWidth) {
         maxWidth = 800;
     } */
    if (!(item.isAttachment())) {
        for (const attachmentID of item.getAttachments()) {
            const attachment = Zotero.Items.get(attachmentID);
            //递归
            await findImage(attachment, srcImgBase64Arr);
        }
    }
    if (item.isPDFAttachment()) {
        const imageAnnotations = await getImageAnnotations(item);
        const title = item.getField("title") as string;
        for (const imageAnnotation of imageAnnotations) {
            const srcObj = await srcBase64Annotation(imageAnnotation, title);
            if (srcObj) {
                srcImgBase64Arr.push(srcObj);
            }
        }
    }
    if (item.attachmentContentType?.includes("image")) {
        const srcObj = await srcBase64ImageFile(item);
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
    //const srcWidthHeight = modifyWidthHeight(imgWidthHeight)(maxWidth);
    return {
        key: attachment.key,
        src: srcBase64.base64,
        alt: srcBase64.fileName + srcBase64.fileType,
        //srcWidthHeight: srcWidthHeight,
        srcWidthHeight: imgWidthHeight,
    };
}

function makeImgTags(srcImgBase64Arr: {
    key: string;
    src: string;
    alt: string;
    srcWidthHeight: {
        width: number;
        height: number;
    };
}[], resize: "origin" | "small" | "medium" | "large" | string = "small") {
    const elementProps: TagElementProps[] = [];
    const makeSizeStyle = (widthHeight: {
        width: number;
        height: number;
    }) => {
        return `width:${widthHeight.width}; height:${widthHeight.height};`;
    };
    srcImgBase64Arr.filter(obj => {
        /* let sizeStyle: string = '';
        switch (resize) {
            case "origin": sizeStyle = `width:${obj.srcWidthHeight.width}; height:${obj.srcWidthHeight.height};`;
                break;
            case "small": sizeStyle = makeSizeStyle(resizeFixRatio(obj.srcWidthHeight, 100));
                break;
            case "medium": sizeStyle = makeSizeStyle(resizeFixRatio(obj.srcWidthHeight, 300));
                break;
            case "large": sizeStyle = makeSizeStyle(resizeFixRatio(obj.srcWidthHeight, 600));
        } */
        //Zotero.Items.getByLibraryAndKey(1,obj.key)
        const elementProp = makeTagElementProps({
            tag: "img",
            namespace: "html",
            id: "showImg-" + obj.key,
            attributes: {
                src: obj.src,
                alt: obj.alt,
                //style: sizeStyle,
                //尝试瀑布流布局
                //style: `width: 100%;
                //display: block;`,
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
    event.preventDefault(); // 阻止默认菜单
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
    ztoolkit.log('右键点击事件触发了');

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
/*
              {
                 //inline: true,
                 ready() {
                     //最大化窗口
                     dialogImgViewer.window.moveTo(0, 0);
                     dialogImgViewer.window.resizeTo(dialogImgViewer.window.screen.availWidth, dialogImgViewer.window.screen.availHeight);
                     //全屏
                     //dialogImgViewer.window.document.documentElement.requestFullscreen();
                 },
             }
             */




















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
//dialogImgViewer.dialogData.loadLock.promise.then().then().then().then().then()