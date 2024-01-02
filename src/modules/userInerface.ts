
import { ElementProps, HTMLElementProps, TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { getString } from "../utils/locale";
import { config } from "../../package.json";
import { getPref, onSaveImageAs, readImage, setPref } from "../utils/prefs";
import { calColumns, getParentItem, getThumbnailSize } from "./imageViewer";
import { objFactory, objsAddKVFactory } from "../utils/tools";
import { imageIdPrefix } from "../utils/imageConjfig";
import { ApiName, BaiduOcrAccurateBasic, BaiduOcrPictureTr, baiduOcr, extractData } from "./OCR/baiduOCR";


export declare type MenuProps = [label: string, func?: (...args: any[]) => any | void, args?: any[]];
export declare type ToolbarbuttonType = "menu" | "menu-button" | "checkbox" | "radio" | undefined;
export declare type ButtonParas = ElementProps & {
    attributes?: {
        accesskey?: string;
        autocheck?: boolean;
        checkState?: number;
        checked?: boolean;
        command?: string;
        crop?: "start" | "end" | "left" | "right" | "center" | "none";
        dir?: "normal" | "reverse";
        disabled?: boolean;
        group?: string;
        image?: string;
        label?: string;
        oncommand?: string;
        open?: boolean;
        orient?: "horizontal" | "vertical";
        tabindex?: number;
        title?: string;
        tooltiptext?: string;
        type?: ToolbarbuttonType;
        validate?: "always" | "never";
        wantdropmarker?: boolean;
    };
    properties?: {
        accesskey?: string;
        accessibleType?: number;
        autocheck?: boolean;
        checkState?: number;
        checked?: boolean;
        command?: string;
        crop?: "start" | "end" | "left" | "right" | "center" | "none";
        dir?: "normal" | "reverse";
        disabled?: boolean;
        group?: string;
        image?: string;
        open?: boolean;
        orient?: "horizontal" | "vertical";
        tabindex?: number;
        title?: string;
        type?: ToolbarbuttonType;
    };
};
export declare type Container = {
    container: Element;
    position?: 'head' | 'end';
};
export declare type RefElement = {
    refElement: Element;
    position?: 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend';
};
export declare type ButtonGroupData = {
    buttonParasArr: ButtonParas[];
    container?: Container;
    refElement?: RefElement;
    childBox?: "hbox" | "vbox";
    label?: TagElementProps;
};
export declare type ToobarData = {
    toolbarParas: ElementProps;
    container?: Container;
    refElement?: RefElement;
    buttonGroupsData?: ButtonGroupData[];
    //childBox?: "hbox" | "vbox";
};
export declare type ToolboxData = {
    toolboxParas: ElementProps;
    container?: Container;
    refElement?: RefElement;
};

export declare type ToolbarOption = {
    doc: Document;
    toolbarGroupData?: ToobarData[];
    toolboxData?: ToolboxData;
};


export async function waitNoteShown(editorInstance: Zotero.EditorInstance | _ZoteroTypes.Notes) {
    if (editorInstance.itemType == "note") {
        const temp = Zotero.Notes._editorInstances.find(x => x._item.id == editorInstance.id);
        if (temp) {
            editorInstance = temp;
        }
        else {
            return;
        }
    }


    let n = 1;
    while (n) {

        editorInstance.instanceID == editorInstance._iframeWindow.wrappedJSObject._currentEditorInstance.instanceID ? n = 0 : await Zotero.Promise.delay(100);
    }


}

export class contextMenu {
    contextMenu: XUL.MenuPopup;
    constructor(option: any) {
        this.contextMenu = this.createContextMenu(option.menuPropsGroupsArr, option.idPostfix);
    }

    copyImage(target: Element) {
        let imgSrc = (target as HTMLImageElement).src;
        if (!imgSrc) return;
        if (imgSrc.startsWith("file:///")) {
            const imgPath = imgSrc.replace("file:///", "");
            readImage(imgPath).then((imgData) => {
                imgSrc = imgData?.base64 as string;
                if (!imgSrc.startsWith("data:")) return;
                const clip = new ztoolkit.Clipboard();
                //仅支持添加一张图
                clip.addImage(imgSrc);
                clip.copy();
            });
        }
        if (imgSrc.startsWith("data:")) {
            const clip = new ztoolkit.Clipboard();
            //仅支持添加一张图
            clip.addImage(imgSrc);
            clip.copy();
        };

    }
    saveImage(target: Element) {
        const imgSrc = (target as HTMLImageElement).src;
        const altText = (target as HTMLImageElement).alt;
        onSaveImageAs(imgSrc, altText);

    }
    showFolder(target: Element) {
        const attachmentKey = target.id.replace(imageIdPrefix, "");
        const libraryID = Zotero.Libraries.userLibraryID;
        const attachment = Zotero.Items.getByLibraryAndKey(libraryID, attachmentKey) as Zotero.Item;
        const imgSrc = (target as HTMLImageElement).src;
        let path;
        if (!imgSrc) return;
        if (imgSrc.startsWith("file:///")) {
            path = imgSrc.replace("file:///", "");


        } else {
            const itemType = attachment.itemType as string;
            switch (itemType) {
                case "annotation":
                    if (attachment.annotationType != "image") { break; };
                    path = Zotero.Annotations.getCacheImagePath(attachment);
                    break;

                case "attachment":
                    if (!attachment.attachmentContentType.includes("image")) { break; };
                    path = attachment.getFilePath() as string;
                    break;
            }
        }
        path = OS.Path.normalize(path!);
        const file = Zotero.File.pathToFile(path);
        try {
            Zotero.debug("Revealing " + file.path);
            file.reveal();
        }
        catch (e) {
            // On platforms that don't support nsIFile.reveal() (e.g. Linux),
            // launch the parent directory
            Zotero.launchFile(file.parent as any);
        }
        Zotero.Notifier.trigger('open', 'file', attachment.id);


    }
    async showLibraryItem(target: Element) {
        Zotero_Tabs.select("zotero-pane");
        const zp = ztoolkit.getGlobal("ZoteroPane");
        const match = target?.parentElement?.parentElement?.id.match(/\d+$/m);
        let collectionId;
        if (match) {
            collectionId = match[0];
        }
        //分类 id 字符串 数字均可
        collectionId ? await zp.collectionsView.selectCollection(collectionId) : () => { };
        const attachmentKey = target.id.replace(imageIdPrefix, "");
        const libraryID = Zotero.Libraries.userLibraryID;
        const attachment = Zotero.Items.getByLibraryAndKey(libraryID, attachmentKey) as Zotero.Item;
        const parentItem = getParentItem(attachment);
        window.focus();
        zp.selectItem(parentItem!.id);

    }
    async showArticleLocation(target: Element) {
        //Zotero_Tabs.select("zotero-pane");
        const zp = Zotero.getActiveZoteroPane();
        const attachmentKey = target.id.replace(imageIdPrefix, "");
        const libraryID = Zotero.Libraries.userLibraryID;
        const attachment = Zotero.Items.getByLibraryAndKey(libraryID, attachmentKey) as Zotero.Item;
        const parentItem = attachment.parentItem;
        if (parentItem?.isPDFAttachment() && attachment.itemType as string == "annotation") {
            if (zp) {
                const position = JSON.parse(attachment.annotationPosition);
                const handler = Zotero.Prefs.get('fileHandler.' + "pdf") as string;
                if (handler) {
                    Zotero.Prefs.set('fileHandler.' + "pdf", '');
                }
                await zp.viewPDF(parentItem.id, { position });
                Zotero.Prefs.set('fileHandler.' + "pdf", handler);
            }
        }
        if (parentItem?.isNote()) {
            //笔记实例打开时不会删除废弃的图片，故在实例打开前执行清理动作
            //const win=ztoolkit.getGlobal("window")
            await Zotero.Notes.deleteUnusedEmbeddedImages(parentItem);
            window.focus();
            //无打开的笔记，则打开
            while (!window.document.getElementById('zotero-note-editor')) {
                await zp.selectItem(parentItem.id);
                //await Zotero.Promise.delay(100);
            }
            let editorInstance;
            //const editorInstance = window.document.getElementById('zotero-note-editor')._editorInstance;//赋值后实例不随笔记切换而切换
            //const noteEditor = window.document.getElementById('zotero-note-editor')!;
            //等待目标笔记
            while (!(editorInstance = Zotero.Notes._editorInstances.find(x => x._item.id == parentItem.id))) {
                await zp.selectItem(parentItem.id);
            }
            if (!editorInstance) return;
            editorInstance._iframeWindow.addEventListener('load', function infoShow() { ztoolkit.log("加载完成"); });
            await waitNoteShown(editorInstance);
            const editorCore = (editorInstance._iframeWindow as any).wrappedJSObject._currentEditorInstance._editorCore;
            editorInstance.focus();
            const dom = this.getNoteDom(editorCore, "attachmentKey", attachmentKey);
            dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.flicker(dom);
        }
    };

    getNoteDom(editorCore: any, attr: string, attrValue: string) {
        let nodeID: string, posTarget;
        const state = editorCore.view.state;
        state.doc.descendants((node: any, pos: number) => {
            if (node.attrs[attr] === attrValue) {
                nodeID = node.attrs.nodeID;
                posTarget = pos;
                return false;
            }
        });
        //const dom = editorCore.view.domAtPos(posTarget);
        let nodeDom = editorCore.view.docView.descAt(posTarget).nodeDOM;
        if (nodeDom.className.includes("image")) {
            nodeDom = nodeDom.querySelector("img");
        }
        return nodeDom;
    }

    flicker(element: HTMLElement) {
        const docWidth = element.ownerDocument.documentElement.clientWidth;
        const width = element.style.width;
        const border = element.style.border;
        const width2 = Math.floor(element.clientWidth * 1.1 >= docWidth ? docWidth * 0.9 : element.clientWidth * 1.1) + "px";
        const border2 = "2px solid red";
        for (let i = 0; i < 10; i++) {
            if (i % 2 == 0) {
                setTimeout(() => {
                    element.style.border = border2;
                    element.style.width = width2;
                }, 200 * i);
            } else {
                setTimeout(() => {
                    element.style.width = width;
                    element.style.border = border;
                }, 200 * i);
            }
        }
    }

    async editImage(target: HTMLImageElement) {
        const type = "image";
        let defaultPath;
        if (Zotero.isWin) {
            defaultPath = "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs";
        }
        const pref = this.getFileHandlerPref(type);
        let handler = getPref(pref) as string;
        if (!handler || !await IOUtils.exists(handler)) {
            handler = await this.chooseFileHandler(type, defaultPath);
        }
        if (!handler) return;
        const filePath = OS.Path.normalize(target.src.replace("file:///", ""));
        const imageStat = await IOUtils.stat(filePath);
        Zotero.launchFileWithApplication(filePath, handler);
        const timestamp = new Date().getTime();
        //@ts-ignore has ownerGlobal
        target.ownerGlobal.addEventListener('focus', updateImage);
        async function updateImage() {
            const imageStatLast = await IOUtils.stat(filePath);
            if (imageStatLast != imageStat) {
                target.src = target.src + "?t=" + timestamp;

            }
        }
    }
    async chooseFileHandler(type: string, defaultPath: string | undefined) {
        const FilePicker = ztoolkit.getGlobal("require")("zotero/modules/filePicker").default;
        const fp = new FilePicker();
        defaultPath = defaultPath || this.getDefaultPath();
        fp.displayDirectory = defaultPath;
        fp.init(
            window,
            Zotero.getString('zotero.preferences.chooseApplication'),
            fp.modeOpen
        );
        fp.appendFilters(fp.filterApps);
        if (await fp.show() != fp.returnOK) {
            return false;
        }
        this.setFileHandler(type, fp.file);
        return fp.file;
    }
    getDefaultPath() {
        if (Zotero.isWin) {
            return "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs";
        } else {
            return "";
        }
    }
    setFileHandler(type: string, handler: string) {
        const pref = this.getFileHandlerPref(type);
        setPref(pref, handler);
    }
    getFileHandlerPref(type: string) {
        return 'fileHandler.' + type;
    }
    //convertImage() { }
    async ocrImage(target: Element) {
        const secretKey = "20230302001582861#uXy0Gx8MaL8Wc46DIlvJ";
        //const secretKey = `3hZgZRDlgkZrumbdv7l3Rd0C#uMn7h7yhsMXC24KGG49uaerjxsz2QxhG`;
        let apiName: ApiName;
        if (secretKey.length > 50) {
            apiName = "baiduOcrAccurate";
        } else {
            apiName = "baiduPictureTranslate";
        }
        const imgSrc = (target as HTMLImageElement).src;
        if (!imgSrc) return;
        const option: BaiduOcrPictureTr | BaiduOcrAccurateBasic = {
            image: imgSrc,
        };
        let response;
        try {
            response = await baiduOcr(secretKey, option);
        }
        catch (e) {
            ztoolkit.log(e);
        }

        const res = extractData(response, apiName);
        ztoolkit.log(res);
        if (!res) return;

        //await insertMyDB("myDBFirstTable", response);


        const textArr = res?.split("\n");

        const recorderToDB = {
            sourceText: "TEXT NOT NULL",
            targetText: "TEXT NOT NULL",
            score: "INTEGER"
        };
        let spanArr = "";
        textArr.forEach((p: string) => {
            const str = "<p>" + p + "</p>";
            spanArr += str;
        });
        const style = `font-size: "16px"; float: "right";justifyContent: "center";max-width: "50%";z-index: 3`;
        const props: TagElementProps = {
            tag: "div",
            namespace: "html",
            id: "popupOcr",
            attributes: {
                style: style,
            },
            properties: {
                innerHTML: spanArr
            }
        };
        const ocrDialog = new ztoolkit.Dialog(1, 1)
            .addCell(0, 0, props)
            .open('', {
                resizable: true,
                noDialogMode: true,
                centerscreen: true,
                width: window.screen.width * 0.5,
                height: window.screen.height * 0.5
            });
    }
    shareImage() { }
    sendToPPT() { }
    async printImage(target: Element) {
        const html = this.getHtml(target as HTMLImageElement);
        const args = {
            _initPromise: Zotero.Promise.defer(),
            browser: undefined as any,
            //url: `about:blank`,
            url: `chrome://${config.addonRef}/content/printTemplate.xhtml`,
        };
        const printWindow = window.openDialog(
            `chrome://${config.addonRef}/content/printWrapper.xhtml`,
            `${config.addonRef}-printWrapper`,
            `chrome,centerscreen,resizable,status,width=900,height=650,dialog=no`,
            args,
        )!;

        await args._initPromise.promise;
        args.browser?.contentWindow.postMessage({ type: "print", html }, "*");
        window.addEventListener("afterprint", (event) => {
            console.log("打印后");
        });
        //无效
        //printWindow.addEventListener("afterprint", () => { printWindow.close(); });
        printWindow.print();
        Zotero.Promise.delay(10000).then(() => printWindow.close());
        //printWindow.close();
    }
    getHtml(htmlImageElement: HTMLImageElement) {
        const img = (htmlImageElement as HTMLImageElement).src;
        const imgProps = makeTagElementProps({
            tag: "img",
            namespace: "html",
            attributes: {
                src: img,
                alt: "printImg",
                style: `width:100%`

            },
        });
        const style =
            `display: "flex";
            justifyContent: "center";
            width: "100vw"`;
        const props = {
            namespace: "html",
            id: "printImg",
            attributes: {
                style: style,
            },
            children: [imgProps],
        } as HTMLElementProps;

        const imgElment = ztoolkit.UI.createElement(document, "div", props);
        const body = ztoolkit.UI.createElement(document, "body");
        body.appendChild(imgElment);
        //@ts-ignore has resetBranch
        Zotero.Prefs.resetBranch([], "print");
        Zotero.Prefs.set("print.print_footercenter", "", true);
        Zotero.Prefs.set("print.print_footerleft", "", true);
        Zotero.Prefs.set("print.print_footerright", "", true);
        Zotero.Prefs.set("print.print_headercenter", "", true);
        Zotero.Prefs.set("print.print_headerleft", "", true);
        Zotero.Prefs.set("print.print_headerright", "", true);
        return body.innerHTML;
    }




    async handleMenuItem(target: Element, menuPopupEvent: Event) {
        if (!menuPopupEvent || !((menuPopupEvent.target as any).label)) return;
        switch ((menuPopupEvent.target as any).label) {
            case `${getString("info-copyImage")}`: this.copyImage(target);
                break;
            case `${getString("info-saveImage")}`: this.saveImage(target);
                break;
            case `${getString("info-editImage")}`: this.editImage(target as HTMLImageElement);
                break;
            //case `${getString("info-convertImage")}`: this.convertImage();
            //break;
            case `${getString("info-ocrImage")}`: await this.ocrImage(target);
                break;
            case `${getString("info-shareImage")}`: this.shareImage();
                break;
            case `${getString("info-sendToPPT")}`: this.sendToPPT();
                break;
            case `${getString("info-printImage")}`: this.printImage(target);
                break;
            case `${getString("info-showFolder")}`: this.showFolder(target);
                break;
            case `${getString("info-showLibraryItem")}`: await this.showLibraryItem(target);
                break;
            case `${getString("info-showArticleLocation")}`: await this.showArticleLocation(target);
                break;
        }
    }

    batchAddEventListener(args: [element: Element, [eventName: string, callBack: any][]][]) {
        for (const arg of args) {
            for (const paras of arg[1]) {
                arg[0].addEventListener(paras[0], paras[1]);
            }
        }
    }
    creatPropsMeun(menuProps: MenuProps) {
        return {
            label: menuProps[0],
            func: menuProps[1] || undefined,
            args: menuProps[2] || undefined,
        };
    };

    createContextMenu(menuPropsGroups: MenuProps[][], idPostfix: string) {
        const menupopup = this.makeMenupopup(idPostfix);
        if (menupopup.childElementCount) return menupopup;
        menuPropsGroups.filter((menuPropsGroup: MenuProps[]) => {
            menuPropsGroup.filter((menuProps: MenuProps) => {
                this.makeMenuitem(this.creatPropsMeun(menuProps), menupopup);
            });
            if (menuPropsGroups.indexOf(menuPropsGroup) !== menuPropsGroups.length - 1) {
                this.menuseparator(menupopup);
            }
        }
        );
        return menupopup;
    }

    createContextMenuOld(menuPropsGroups: MenuProps[][], idPostfix: string, event?: MouseEvent) {
        const menupopup = this.makeMenupopup(idPostfix);
        if (menupopup.childElementCount) return menupopup;
        menuPropsGroups.filter((menuPropsGroup: MenuProps[]) =>
            menuPropsGroup.filter((menuProps: MenuProps) => {
                this.makeMenuitemOld(this.creatPropsMeun(menuProps), menupopup, event);
            }));
        return menupopup;
    }

    menuseparator(menupopup: any) {
        ztoolkit.UI.appendElement({
            tag: "menuseparator",
            namespace: "xul",
        }, menupopup);
    };
    makeMenupopup(idPostfix: string) {
        const menupopupOld = document.querySelector(`[id$="${idPostfix}"]`) as XUL.MenuPopup | null;
        if (menupopupOld) return menupopupOld;
        const menupopup = ztoolkit.UI.appendElement({
            tag: "menupopup",
            id: config.addonRef + '-' + idPostfix,
            namespace: "xul",
            children: [],
        }, document.querySelector("#browser")!) as XUL.MenuPopup;
        menupopup.addEventListener("command", async e => {
            const tagName = (e.target as any).tagName.toLowerCase();
            if (tagName === 'menuitem') {
                // anchorNode 为操作的目标元素
                //@ts-ignore has anchorNode
                await this.handleMenuItem(menupopup.anchorNode, e);
            }
        });
        return menupopup;

    };

    makeMenuitem(
        option: {
            label: string,
        },
        menupopup: any,
    ) {
        const menuitem = ztoolkit.UI.appendElement({
            tag: "menuitem",
            namespace: "xul",
            attributes: {
                label: getString(option.label),
            }
        }, menupopup);
        /* menuitem.addEventListener("command", async (e) => {
            window.alert(menupopup.selectedItem);
        }); */
    };

    makeMenuitemOld(
        option: {
            label: string,
            func?: (...args: any[]) => any | void,
            args?: any[];
        },
        menupopup: any,
        event?: MouseEvent
    ) {
        const menuitem = ztoolkit.UI.appendElement({
            tag: "menuitem",
            namespace: "xul",
            attributes: {
                label: getString(option.label),
            }
        }, menupopup);
        if (option.func) {
            if (this.judgeAsync(option.func)) {
                menuitem.addEventListener("command", async (e) => {
                    if (option.args?.length) {
                        await option.func!(...option.args, event);
                    } else {
                        await option.func!(event);
                    }
                });
            } else {
                menuitem.addEventListener("command", (e) => {
                    if (option.args?.length) {
                        option.func!(...option.args, event);
                    } else {
                        option.func!(event);
                    }
                });
            }
        }
    };

    judgeAsync(fun: any) {
        const AsyncFunction = (async () => { }).constructor;
        return fun instanceof AsyncFunction;
    };
}

export class Toolbar {
    toolbox?: XUL.Element;
    toolbarGroup: XUL.Element[];
    doc: Document;
    constructor(option: ToolbarOption) {
        this.doc = option.doc;
        option.toolboxData ? this.toolbox = this.makeToolBox(option.toolboxData) : () => { };
        this.toolbarGroup = [];
        this.init(option);
    }
    init(option: ToolbarOption) {
        option.toolbarGroupData?.filter((toolbardata: ToobarData) => {
            if (!toolbardata.container && !toolbardata.refElement && this.toolbox) {
                toolbardata.container = { container: this.toolbox };
            }
            const toolbar = this.makeToolBar(toolbardata);
            const Vbox = ztoolkit.UI.appendElement(
                makeTagElementProps({
                    tag: "vbox",
                    classList: ["toolbarVbox"]
                }) as TagElementProps,
                toolbar);

            /* if (toolbardata.container && option.toolbarGroupData!.indexOf(toolbardata) !== option.toolbarGroupData!.length - 1) {
                ztoolkit.UI.appendElement(makeTagElementProps({ tag: "toolbarseparator" }) as TagElementProps, toolbardata.container.container);
            } */

            toolbardata.buttonGroupsData?.filter((buttonGroupData: ButtonGroupData) => {
                if (!buttonGroupData.container && !buttonGroupData.refElement) {
                    buttonGroupData.container = { container: Vbox };
                }
                const buttons = this.makeToolBarButtons(buttonGroupData);
            });
            this.toolbarGroup.push(toolbar);
        });
    }

    /**
     * 参数有 childBox 则创建 vbox或 hbox，
     * 挂载至 container 或 refElement，
     * 按钮挂载到 v/hbox 中。
     * 
     * 参数无 childBox 时，按钮挂载至 container 或 refElement
     * @param {ButtonGroupData} param0 
     * @returns 
     */
    makeToolBarButtons({ buttonParasArr, container, refElement, childBox, label }: ButtonGroupData) {
        const buttons: Element[] = [];
        if (childBox) {
            const VHbox = this.makeButtonVHBox(childBox, container, refElement);
            container = { container: VHbox };
        }
        label && container ? ztoolkit.UI.appendElement(label, container.container) : () => { };
        buttonParasArr.filter((buttonParas) => {
            buttonParas.id ? buttonParas.id = idWithAddon(buttonParas.id) : () => { };
            const toolbarbuttonProps = makeTagElementProps(buttonParas);
            const tagName = buttonParas.tag || "button";
            const button = ztoolkit.UI.createElement(this.doc, tagName, toolbarbuttonProps);
            this.mounting(button, container, refElement);
            buttons.push(button);
        });
        return buttons;
    }

    /**
     * 生成水平或垂直容器盒，
     * 并完成事件委托
     * @param {"hbox" | "vbox"} childBox 
     * @param {Element} container 
     * @returns 
     */
    makeButtonVHBox(childBox: "hbox" | "vbox", container?: Container, refElement?: RefElement) {
        const tag = childBox;
        const boxProps = makeTagElementProps({
            id: config.addonRef + '-' + Zotero.randomString(8),
            classList: ["buttonVHBox"],
            namespace: "xul",
        });
        const buttonVHbox = ztoolkit.UI.createElement(this.doc, tag, boxProps) as XUL.Element;
        this.mounting(buttonVHbox, container, refElement);
        eventDelegation(buttonVHbox, "click", 'button', this.handleToolButton);
        return buttonVHbox;
    }

    /**
     * 生成工具条 toolbar
     * @param {ToobarData} param0 
     * @returns 
     */
    makeToolBar({ toolbarParas, container, refElement }: ToobarData) {
        toolbarParas.tag = "toolbarbutton";
        toolbarParas.id ? toolbarParas.id = idWithAddon(toolbarParas.id) : () => { };
        const toolbarProps = makeTagElementProps(toolbarParas);
        const toolbar = ztoolkit.UI.createElement(this.doc, "toolbar", toolbarProps) as XUL.ToolBar;
        this.mounting(toolbar, container, refElement);
        return toolbar;
    }

    /**
     * 生成工具盒 toolbox
     * @param {ElementProps} toolboxParas
     * @param {Container} container
     * @param {RefElement} refElement   
     * @returns 
     */
    makeToolBox({ toolboxParas, container, refElement }: ToolboxData) {
        toolboxParas.tag = "toolbox";
        toolboxParas.id ? toolboxParas.id = idWithAddon(toolboxParas.id) : () => { };
        const toolboxProps = makeTagElementProps(toolboxParas);
        const toolbox = ztoolkit.UI.createElement(this.doc, "toolbox", toolboxProps) as XUL.ToolBox;
        this.mounting(toolbox, container, refElement);
        return toolbox;
    }

    /**
     * 装载 DOM 元素至父元素开头或末尾，
     * 
     * 或装载 DOM 元素至参考元素前后
     * @param {Element} element 
     * @param {Container} container 
     * @param {RefElement} refElement 
     */
    mounting(element: Element, container?: Container, refElement?: RefElement) {
        if (container && !refElement) {
            container.position && container.position == "head" ? container.container.insertBefore(element, container.container.firstChild) : container.container.appendChild(element);
        }
        if (!container && refElement) {
            const position = refElement.position || "afterend";
            refElement.refElement.insertAdjacentElement(position, element);
        }
        if (container && refElement) {
            container.container.insertBefore(element, refElement.refElement);
        }
    }

    handleToolButton(target: EventTarget) {
        let size, fit;
        switch ((target as any).id) {
            case `${idWithAddon("imageToolButtonSmall")}`: size = "small";
                break;
            case `${idWithAddon("imageToolButtonMedium")}`: size = "medium";
                break;
            case `${idWithAddon("imageToolButtonLarge")}`: size = "large";
                break;
            case `${idWithAddon("fitWidthToolButton")}`: fit = "fitWidth";
                break;
            case `${idWithAddon("fitHeightToolButton")}`: fit = "fitHeight";
                break;
            case `${idWithAddon("fitDefaultToolButton")}`: fit = "fitDefault";
                break;
        }
        if (size) {
            let sizeStyle: number;
            switch (size) {
                case "small": sizeStyle = 100;
                    break;
                case "medium": sizeStyle = 300;
                    break;
                case "large": sizeStyle = 600;
                    break;
                default: sizeStyle = 100;
            }
            setPref('thumbnailSize', size);
            const columns = calColumns(sizeStyle);
            const objTempArr = [
                {
                    varName: "--thumbnailSize",
                    value: sizeStyle,
                },
                {
                    varName: "--columns",
                    value: columns,
                }];
            const doc = addon.data.globalObjs.dialogImgViewer.window.document! as Document;
            if (!doc) return;
            const targetElement = styleElement(doc)();
            setStyleVar(objTempArr)(targetElement);
            const imagesColumns = doc.querySelector("#".concat(idWithAddon("imagesColumns")));
            if (imagesColumns) {
                //@ts-ignore has value
                imagesColumns.value = String(columns);
            }
            //showDialog(true);
            //insertStyle(addon.data.globalObjs.dialogImgViewer.window.document, makeStyle());
            //updateDialog();
        }
        if (fit) {
            if (addon.data.globalObjs?.dialogImgViewer) {
                addon.data.globalObjs.dialogImgViewer.fit = fit;
            }

        }
        ztoolkit.log(size);
    }
}

export function idWithAddon(idPostfix: string) {
    return config.addonRef + '-' + idPostfix;
}

export function setStyleVar(KVs: { varName: string; value: string | number; } | any[]) {
    return function doIt(element: XUL.Element | HTMLElement) {
        if (!Array.isArray(KVs)) {
            KVs = [KVs];
        }
        KVs.filter((kv: { varName: string; value: string | number; }) => {
            element.style.setProperty(kv.varName, String(kv.value));
        });
    };
};

export function getStyleVar(varNames: string[]) {
    return function doIt(element: XUL.Element | HTMLElement) {
        const elementStyle = getComputedStyle(element);
        if (varNames.length == 1) return elementStyle.getPropertyValue(varNames[0]);
        const obj: any = {};
        varNames.filter((varName) => {
            obj[varName] = elementStyle.getPropertyValue(varName);
        });
        return obj;
    };
}

/**
 * 
 * @param doc 
 * @returns :root or element
 */
export function styleElement(doc: Document) {
    return function targetElement(element?: Element) {
        !element ? element = doc.querySelector(":root")! : element;
        return element as XUL.Element | HTMLElement;
    };
}

export function makeToolBox(option: {
    doc: Document;
    elementProps: {
        idPostfix: string;
        classList: string[];
    };
    location: 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend';
    refElement: Element;

}) {
    const toolboxProps = makeTagElementProps({
        tag: "toolbox",
        id: config.addonRef + '-' + option.elementProps.idPostfix,
        namespace: "xul",
        classList: option.elementProps.classList,
        attributes: {
            mode: "icons",
            defaultmode: "icons",
        },
    });
    const toolboxElement = ztoolkit.UI.createElement(option.doc, "toolbox", toolboxProps) as XUL.ToolBox;
    option.refElement.insertAdjacentElement(option.location, toolboxElement);
    return toolboxElement;
}

export function insertStyle(document: Document, style: string = '') {
    if (!style.length) return;
    const styleElement = document.getElementsByTagName("style")[0];
    if (styleElement) {
        styleElement.innerHTML += style;
    } else {
        document.head.appendChild(ztoolkit.UI.createElement(document, "style", {
            properties: {
                innerHTML: style,
            },
        }));
    }
}

export function loadCss(document: Document, cssfilesURL: string[] = [`chrome://${config.addonRef}/content/css/viewer.css`]) {
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


function eventDelegation(element: Element, eventType: string, tagNameTarget: string, func: (arg0: any) => any) {
    element.addEventListener(eventType, e => {
        const tagName = (e.target as any).tagName.toLowerCase();
        if (tagName === tagNameTarget) {
            func(e.target!);
        }
    });
}


/* export function batchAddEventListener(args: [element: Element, [eventName: string, callBack: any][]][]) {
    for (const arg of args) {
        for (const paras of arg[1]) {
            arg[0].addEventListener(paras[0], paras[1]);
        }
    }
}
 */
export function batchAddEventListener(element: Element, args: [eventName: string, callBack: any][]) {

    for (const paras of args) {
        element.addEventListener(paras[0], paras[1]);
    }

}

/**
* @example
 * ```
 * //TagElementProps 属性. 传入的参数会覆盖原默认参数, 同时处理 children 属性
 * //默认参数
 * ignoreIfExists: true,根据 id 查找元素，如果有则仅返回该元素。
 * skipIfExists：true，不新建元素，继续处理 props/attrs/children
 * removeIfExists: false, 
 * namespace: "xul",
 * enableElementRecord: true,
 * enableElementJSONLog: false,
 * nableElementDOMLog: false,
 * //其他属性
 * tag: string;     
 * classList ?: Array<string>; 
 * styles ?: Partial<CSSStyleDeclaration>; 、
 * properties ?: {*[key: string]: unknown;*}; 
 * attributes ?: {*[key: string]: string | boolean | number | null | undefined;*}; 
 * listeners ?: Array<{
 *  type: string;
 *  listener: EventListenerOrEventListenerObject | ((e: Event) => void) | null | undefined;
 *  options?: boolean | AddEventListenerOptions;}>;
 * children ?: Array<TagElementProps>;
 * skipIfExists ?: boolean;
 * removeIfExists ?: boolean;
 * checkExistenceParent ?: HTMLElement;
 * customCheck ?: (doc: Document, options: ElementProps) => boolean;
 * subElementOptions ?: Array<TagElementProps>;
 * ```
 * @see  {@link ElementProps} for detail
     * @param option 
     * @returns TagElementProps
     */
export function makeTagElementProps(option: ElementProps | TagElementProps): ElementProps | TagElementProps {
    const preDefined = {
        enableElementRecord: false,
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "xul",
    };
    if (option.children) {
        option.children.filter((child: ElementProps | TagElementProps) => {
            child = makeTagElementProps(child);
        });
    }
    if (option.tag) {
        return Object.assign(preDefined, option) as TagElementProps;
    } else {
        return Object.assign(preDefined, option) as ElementProps;
    }
}

export const cssfilesURL = [
    `chrome://${config.addonRef}/content/css/viewer.css`,
    `chrome://${config.addonRef}/content/css/dragula.css`,
    `chrome://${config.addonRef}/content/css/imageDialog.css`,
];

export function addToolBar(doc: Document, ref: Element) {
    const commonProps = objFactory(
        ["tag", "classList", "namespace", ["attributes", ["type"]]],
        ["button", ["imageToolButton"], "html", "button"]);
    const privatePropsArrKeys = ["id", ["properties", ["innerHTML"]], ["attributes", ["tooltiptext"]]];

    const privatePropsArr = objFactory(privatePropsArrKeys,
        [
            ["imageToolButtonSmall", [getString("info-small")], [getString("info-small")]],
            ["imageToolButtonMedium", [getString("info-medium")], [getString("info-medium")]],
            ["imageToolButtonLarge", [getString("info-large")], [getString("info-large")]],
        ]);
    const buttonPropsArr = objsAddKVFactory({
        commonProps: commonProps,
        privatePropsArr: privatePropsArr
    });

    const sizeStyle = getThumbnailSize();
    const columns = calColumns(sizeStyle);

    const columnsPropsArr = makeTagElementProps({
        tag: "input",
        id: "imagesColumns",
        namespace: "html",
        classList: ["columnsInput"],
        attributes: {
            type: "number",
            min: "1",
            max: "10",
            value: String(columns),
            required: "true",
            style: `width:3em`,
        },
        listeners: [{
            type: "change",
            listener: (e) => {
                const doc = addon.data.globalObjs.dialogImgViewer.window.document! as Document;
                if (!doc) return;
                setStyleVar({
                    varName: "--columns",
                    //@ts-ignore has value
                    value: e.target!.value,
                })(styleElement(doc)());
            }
        }]
    });
    //getPref();
    const bibliographyProps = makeTagElementProps({
        tag: "input",
        id: "imagesBibliography",
        namespace: "html",
        classList: ["imageBibliography"],
        attributes: {
            type: "checkbox",
            name: "showBibliography",
            checked: "true",
        },
    });


    const fitModeButtonProps = {
        commonProps: {
            tag: "button",
            classList: ["fitModeToolButton"],
            namespace: "html",
            attributes: {
                type: "button",
            },
        },

        privatePropsArr: objFactory(privatePropsArrKeys,
            [
                ["fitWidthToolButton", [getString("info-fitWidth")], [getString("info-fitWidth")]],
                ["fitHeightToolButton", [getString("info-fitHeight")], [getString("info-fitHeight")]],
                ["fitDefaultToolButton", [getString("info-fitDefault")], [getString("info-fitDefault")]]
            ]
        )
    };

    const fitModeButtonPropsArr = objsAddKVFactory(fitModeButtonProps);
    function labelProps(label: string) {
        return makeTagElementProps({
            tag: "label",
            namespace: "html",
            properties: {
                innerHTML: `${getString(label)}`
            },
            attributes: {
                style: `font-size:120%`,
            },
        }) as TagElementProps;
    }

    const toolbarGroupData: ToobarData = {
        toolbarParas: {
            id: "imageToolBar",
            classList: ["imageToolBar"],
        },
        buttonGroupsData: [
            {
                buttonParasArr: buttonPropsArr,
                childBox: "hbox",
                label: labelProps("info-thumbnailSize")
            },
            {
                buttonParasArr: [columnsPropsArr],
                childBox: "hbox",
                label: labelProps("info-thumbnailColumns")
            },
            {
                buttonParasArr: [bibliographyProps],
                childBox: "hbox",
                label: labelProps("info-showBibliography")
            },

            {
                buttonParasArr: fitModeButtonPropsArr,
                childBox: "hbox",
                label: labelProps("info-fitModel")
            }],
    };

    const toolboxData: ToolboxData = {
        toolboxParas: {
            id: "imageToolBox",
            classList: ["imageToolbox"],
        },
        refElement: {
            refElement: ref,
            position: 'beforebegin',
        }

    };
    const toolbarOption: ToolbarOption = {
        doc: doc,
        toolboxData: toolboxData,
        toolbarGroupData: [toolbarGroupData],
    };
    const toolBarThumbnail = new Toolbar(toolbarOption);
    return toolBarThumbnail;
}



export function addContextMenu(elementTriggerCTM: Element) {
    const menuPropsGroupsArr = [
        [
            ["info-copyImage"],
            ["info-saveImage"],
            ["info-editImage"],
            //["info-convertImage"],
            ["info-ocrImage"]
        ],
        [
            ["info-showFolder"],
            ["info-showLibraryItem"],
            ["info-showArticleLocation"],
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
    //事件委托：事件监听设置在上级元素，判断事件由子元素触发则执行回调函数
    elementTriggerCTM.addEventListener('contextmenu', e => {
        const tagName = (e.target as any).tagName;
        if (tagName === 'IMG') {
            //如果传入了最后一个参数 triggerEvent （此处为 e ），contextMenu 才会有 triggerNode
            //@ts-ignore has target
            imgCtxObj.contextMenu.openPopup(e.target, 'after_pointer', 0, 0, true, false, e);
            //@ts-ignore has screenX
            imgCtxObj.contextMenu.moveTo(e.screenX, e.screenY);

        }
    });
}

export function setGlobalCssVar(doc: Document) {
    if (!doc.documentElement.style) {
        doc.head.appendChild(ztoolkit.UI.createElement(doc, "style"));
    };
    return function setKVs(KVs: (string | number)[][]) {
        KVs.filter((KV) => {
            doc.documentElement.style.setProperty(String(KV[0]), String(KV[1]));
        });
    };
}

/* function makeButtonAttributes(imageSize: string) {
    return {
        tooltiptext: getString(imageSize),
    };
}
function makeButtonProperties(imageSize: string) {
    return {
        innerHTML: getString(imageSize),
    };
} */

/* creatToolBars(option: any) {
    option.toolbuttonParasArr.filter((buttonParasArr: any[]) => {
        const [idPostfix: string, tooltiptext: string, toolBarButtonClassList?: string, imageURL?: string, iconsize?: string] = buttonParasArr;
        const toolBarContainer = this.createToolbar(option.isHbox)(toolbarParas.buttonParasArr);
        this.toolBar.appendChild(toolBarContainer);
    });
} */


/*
//insertStyle(dialogImgViewer.window.document, makeStyle());
export function makeStyle() {


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
    //containerImg{object-fit: contain;}
    const columns = calColumns(sizeStyle);
    const KVs = [
        ["--bgColor", backgroundColor],
        ["--columns", columns],
        ["--thumbnailSize", `${sizeStyle}px`],
        ["--screenHeight", `${window.screen.availHeight}px`]
    ];

    const rootStyle =
        `:root{
--bgColor:${backgroundColor};
--columns:${calColumns(sizeStyle)};
--thumbnailSize:${sizeStyle}px;
--screenHeight:${window.screen.availHeight}px;
}`;


    const styleImgDiv =
        `div[id^="container-"]{
margin:2px;
padding:5px;
background-color:var(--bgColor);
}`;
    const styleImg =
        `img{
 display: block;
 width: 100%;
 max-height: calc(2 * var(--thumbnailSize));
 object-fit: contain;
 border-color: #FFFFFF;
}`;

    const containerImagesDivStyle =
        `[id^="images"]{
margin: 2px;
display: grid;
grid-template-rows: masonry;
max-width: 100vw;
max-height: calc(var(--screenHeight) - 100px);
min-height: 200px;
background-color: var(--bgColor);
grid-template-columns: repeat(var(--columns), 1fr);
min-width: calc(var(--thumbnailSize) * var(--columns));
}
[id^="gallaryGroup-"]{
margin: 2px;
grid-column-start: span var(--columns);
place-self: center center;
background-color: #FFFFFF;
}`;
    return rootStyle + containerImagesDivStyle + styleImg + styleImgDiv;
} */



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

/* [
    {
        id: "imageToolButtonSmall",
        classList: ["imageToolButton"],
        attributes: {
            type: "checkbox",
            label: getString("info-small"),
            tooltiptext: getString("info-small"),
        },
    },
    {
        id: "imageToolButtonMedium",
        classList: ["imageToolButton"],
        attributes: {
            type: "checkbox",
            label: getString("info-medium"),
            tooltiptext: getString("info-medium"),
        },
    },
    {
        id: "imageToolButtonLarge",
        classList: ["imageToolButton"],
        attributes: {
            type: "checkbox",
            label: getString("info-large"),
            tooltiptext: getString("info-large"),
        },
    },


    {
                            label: getString("info-small"),
                            tooltiptext: getString("info-small"),
                        },
                        {
                            label: getString("info-medium"),
                            tooltiptext: getString("info-medium"),
                        },
                        {
                            label: getString("info-large"),
                            tooltiptext: getString("info-large"),
                        },
] */


/* {
    ${getStyle2String(columns, sizeStyle)};   
    function getStyle2String(columns: number, sizeStyle: number) {
        return `grid-template-columns: repeat(${columns},1fr); min-width: calc(${sizeStyle}px * ${columns});`;
    }
} */

/* export declare type ContainerOrRef = {
    container?: Element;
    refElement?: Element;
    position?: 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend';
} & ({ container: Element; } | { refElement: Element; }); */

/* {
    tag: "button",
    classList: ["imageToolButton"],
    namespace: "html",
    attributes: {
        type: "button",
    },
}, */

/* const buttonProps = {
    commonProps: commonProps, 
    privatePropsArr: privatePropsArr    
}; */
/* [
    {
        id: "imageToolButtonSmall",
        properties: makeButtonProperties("info-small"),
        attributes: makeButtonAttributes("info-small"),
    },
    {
        id: "imageToolButtonMedium",
        properties: makeButtonProperties("info-medium"),
        attributes: makeButtonAttributes("info-medium"),
    },
    {
        id: "imageToolButtonLarge",
        properties: makeButtonProperties("info-large"),
        attributes: makeButtonAttributes("info-large"),
    },
], */



/*  [
     {
         id: "fitWidthToolButton",
         properties: makeButtonProperties("info-fitWidth"),
         attributes: makeButtonAttributes("info-fitWidth"),
     },
     {
         id: "fitHeightToolButton",
         properties: makeButtonProperties("info-fitHeight"),
         attributes: makeButtonAttributes("info-fitHeight"),
     },
     {
         id: "fitDefaultToolButton",
         properties: makeButtonProperties("info-fitDefault"),
         attributes: makeButtonAttributes("info-fitDefault"),
     },
 ], */