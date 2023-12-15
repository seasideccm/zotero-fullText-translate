
import { ElementProps, HTMLElementProps, TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { getString } from "../utils/locale";
import { config } from "../../package.json";
import { onSaveImageAs, setPref } from "../utils/prefs";
import { calColumns } from "./imageViewer";



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




export class contextMenu {
    contextMenu: XUL.MenuPopup;
    constructor(option: any) {
        this.contextMenu = this.createContextMenu(option.menuPropsGroupsArr, option.idPostfix);
    }

    copyImage(target: Element) {
        const img = (target as HTMLImageElement).src;
        if (!img) return;
        const clip = new ztoolkit.Clipboard();
        //仅支持添加一张图
        clip.addImage(img);
        clip.copy();
    }
    saveImage(target: Element) {
        const img = (target as HTMLImageElement).src;
        onSaveImageAs(img);

    }
    editImage() { }
    convertImage() { }
    ocrImage() { }
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
        //if (!printWindow) return;
        await args._initPromise.promise;
        args.browser?.contentWindow.postMessage({ type: "print", html }, "*");
        printWindow.print();
        //printWindow.close();



        /* printWindow.addEventListener("DOMContentLoaded", async function onWindowLoad(ev) {
            const img = (targetElementEvent.target as HTMLImageElement).src;
            const imgElment = ztoolkit.UI.createElement(printWindow.document, "img", {
                namespace: "html",
                id: "printImg",
                attributes: {
                    src: img,
                    alt: "printImg",
                },
            });
            printWindow.document.body.appendChild(imgElment);


            let n = 0;
            while (printWindow.document.readyState != "complete" && n++ < 1000) {
                await Zotero.Promise.delay(100);
            }
        }); */




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
        Zotero.Prefs.resetBranch([], "print");
        Zotero.Prefs.set("print.print_footercenter", "", true);
        Zotero.Prefs.set("print.print_footerleft", "", true);
        Zotero.Prefs.set("print.print_footerright", "", true);
        Zotero.Prefs.set("print.print_headercenter", "", true);
        Zotero.Prefs.set("print.print_headerleft", "", true);
        Zotero.Prefs.set("print.print_headerright", "", true);
        return body.innerHTML;
    }


    handleMenuItem(target: Element, menuPopupEvent: Event) {
        if (!menuPopupEvent || !((menuPopupEvent.target as any).label)) return;
        switch ((menuPopupEvent.target as any).label) {
            case `${getString("info-copyImage")}`: this.copyImage(target);
                break;
            case `${getString("info-saveImage")}`: this.saveImage(target);
                break;
            case `${getString("info-editImage")}`: this.editImage();
                break;
            case `${getString("info-convertImage")}`: this.convertImage();
                break;
            case `${getString("info-ocrImage")}`: this.ocrImage();
                break;
            case `${getString("info-shareImage")}`: this.shareImage();
                break;
            case `${getString("info-sendToPPT")}`: this.sendToPPT();
                break;
            case `${getString("info-printImage")}`: this.printImage(target);
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
    /*  creatPropsMeunGroups(menuPropsGroups: MenuProps[][]) {
         
         return menuPropsGroups.map((menuPropsGroup: MenuProps[]) => this.creatPropsMeunGroup(menuPropsGroup));
     };
     creatPropsMeunGroup(menuPropsGroup: MenuProps[]) {
         return menuPropsGroup.map((menuProps: MenuProps) => this.creatPropsMeun(menuProps));
 
     }; */
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

    /* createContextMenu(menuitemGroupArr: any[][], idPostfix: string, event: MouseEvent) {
        const menupopup = this.makeMenupopup(idPostfix);
        menuitemGroupArr.filter((menuitemGroup: any[]) => {
            menuitemGroup.map((e: any) => this.makeMenuitem(e, menupopup, event));
            if (menuitemGroupArr.indexOf(menuitemGroup) !== menuitemGroupArr.length - 1) {
                this.menuseparator(menupopup);
            }
        });
        return menupopup;
    } */



    menuseparator(menupopup: any) {
        ztoolkit.UI.appendElement({
            tag: "menuseparator",
            namespace: "xul",
        }, menupopup);
    };
    makeMenupopup(idPostfix: string) {
        /* makeTagElementProps({
            tag: "menupopup",
            id: config.addonRef + '-' + idPostfix,
            children: children,
        }); */
        const menupopupOld = document.querySelector(`[id$="${idPostfix}"]`) as XUL.MenuPopup | null;
        if (menupopupOld) return menupopupOld;
        const menupopup = ztoolkit.UI.appendElement({
            tag: "menupopup",
            id: config.addonRef + '-' + idPostfix,
            namespace: "xul",
            children: [],
        }, document.querySelector("#browser")!) as XUL.MenuPopup;
        menupopup.addEventListener("command", e => {
            const tagName = (e.target as any).tagName.toLowerCase();
            if (tagName === 'menuitem') {
                // anchorNode 为操作的目标元素
                this.handleMenuItem(menupopup.anchorNode, e);
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

            if (toolbardata.container && option.toolbarGroupData!.indexOf(toolbardata) !== option.toolbarGroupData!.length - 1) {
                ztoolkit.UI.appendElement(makeTagElementProps({ tag: "toolbarseparator" }) as TagElementProps, toolbardata.container.container);
            }

            toolbardata.buttonGroupsData?.filter((buttonGroupData: ButtonGroupData) => {
                if (!buttonGroupData.container && !buttonGroupData.refElement) {
                    buttonGroupData.container = { container: toolbar };
                }
                const buttons = this.makeToolBarButtons(buttonGroupData);
                if (buttons[0].parentElement) {
                    if (toolbardata.buttonGroupsData && toolbardata.buttonGroupsData!.indexOf(buttonGroupData) !== toolbardata.buttonGroupsData!.length - 1) {
                        ztoolkit.UI.appendElement(makeTagElementProps({ tag: "toolbarseparator" }) as TagElementProps, buttons[0].parentElement!);
                    }
                }
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
        let size, fill;
        switch ((target as any).id) {
            case `${idWithAddon("imageToolButtonSmall")}`: size = "small";
                break;
            case `${idWithAddon("imageToolButtonMedium")}`: size = "medium";
                break;
            case `${idWithAddon("imageToolButtonLarge")}`: size = "large";
                break;
            case `${idWithAddon("fillWidthToolButton")}`: fill = "fillWidth";
                break;
            case `${idWithAddon("fillHeightToolButton")}`: fill = "fillHeight";
                break;
            case `${idWithAddon("fillDefaultToolButton")}`: fill = "fillDefault";
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
            const objTempArr = [{
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

            //showDialog(true);
            //insertStyle(addon.data.globalObjs.dialogImgViewer.window.document, makeStyle());
            //updateDialog();
        }
        if (fill) {
            if (addon.data.globalObjs?.dialogImgViewer) {
                addon.data.globalObjs.dialogImgViewer.fill = fill;
            }

        }
        ztoolkit.log(size);
    }
}

export function idWithAddon(idPostfix: string) {
    return config.addonRef + '-' + idPostfix;
}

export function setStyleVar(KVs: { varName: string; value: string | number; }[]) {
    return function doIt(element: XUL.Element | HTMLElement) {
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

export function loadCss(document: Document, cssfilesURL: string[] = [`chrome://${config.addonRef}/content/viewer.css`]) {
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


export function batchAddEventListener(args: [element: Element, [eventName: string, callBack: any][]][]) {
    for (const arg of args) {
        for (const paras of arg[1]) {
            arg[0].addEventListener(paras[0], paras[1]);
        }
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
function makeTagElementProps(option: ElementProps | TagElementProps): ElementProps | TagElementProps {
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
    `chrome://${config.addonRef}/content/viewer.css`,
    `chrome://${config.addonRef}/content/dragula.css`,
    `chrome://${config.addonRef}/content/css/imageDialog.css`,
];
export function addToolBar(doc: Document, ref: Element) {
    const buttonProps = {
        commonProps: {
            tag: "button",
            classList: ["imageToolButton"],
            namespace: "html",
            attributes: {
                type: "button",
            },
        },
        privatePropsArr: [
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
        ],
    };
    function makeButtonAttributes(imageSize: string) {
        return {
            tooltiptext: getString(imageSize),
        };
    }
    function makeButtonProperties(imageSize: string) {
        return {
            innerHTML: getString(imageSize),
        };
    }

    const buttonPropsArr = objsGenerateFactory(buttonProps);


    const fillModeButtonProps = {
        commonProps: {
            tag: "button",
            classList: ["fillModeToolButton"],
            namespace: "html",
            attributes: {
                type: "button",
            },
        },

        privatePropsArr: [
            {
                id: "fillWidthToolButton",
                properties: makeButtonProperties("info-fillWidth"),
                attributes: makeButtonAttributes("info-fillWidth"),
            },
            {
                id: "fillHeightToolButton",
                properties: makeButtonProperties("info-fillHeight"),
                attributes: makeButtonAttributes("info-fillHeight"),
            },
            {
                id: "fillDefaultToolButton",
                properties: makeButtonProperties("info-fillDefault"),
                attributes: makeButtonAttributes("info-fillDefault"),
            },
        ],
    };
    const fillModeButtonPropsArr = objsGenerateFactory(fillModeButtonProps);

    const toolbarGroupData: ToobarData = {
        toolbarParas: {
            id: "imageToolBar",
            classList: ["imageToolBar"],
        },
        buttonGroupsData: [{
            buttonParasArr: buttonPropsArr,
            childBox: "hbox",
            label: makeTagElementProps({
                tag: "label", namespace: "html", properties: {
                    innerHTML: `${getString("info-thumbnailSize")}`
                },
                attributes: {
                    style: `font-size:120%`,
                },
            }) as TagElementProps
        },
        {
            buttonParasArr: fillModeButtonPropsArr,
            childBox: "hbox",
            label: makeTagElementProps({
                tag: "label", namespace: "html", properties: {
                    innerHTML: `${getString("info-fillModel")}`
                },
                attributes: {
                    style: `font-size:120%`,
                }
            }) as TagElementProps
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

export function objsGenerateFactory(option: {
    commonProps: any;
    privatePropsArr: any[];
}) {
    const result: any[] = [];
    option.privatePropsArr.filter((obj: any) => {
        result.push(mergeDeep(obj, option.commonProps));
    });
    return result;
    function mergeDeep(target: any, ...sources: any[]) {
        sources.forEach(source => {
            Object.keys(source).forEach(key => {
                if (Array.isArray(source[key])) {
                    if (!target[key]) {
                        Object.assign(target, { [key]: source[key] });
                    }
                    else {
                        Object.assign(target, { [key]: [] });
                        mergeDeep(target[key], source[key]);
                    }

                }
                else if (source[key] instanceof Object) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            });
        });
        return target;
    }
}

export function addContextMenu(elementTriggerCTM: Element) {
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
    elementTriggerCTM.addEventListener('contextmenu', e => {
        const tagName = (e.target as any).tagName;
        if (tagName === 'IMG') {
            //如果传入了最后一个参数 triggerEvent （此处为 e ），contextMenu 才会有 triggerNode

            imgCtxObj.contextMenu.openPopup(e.target, 'after_pointer', 0, 0, true, false, e);
            imgCtxObj.contextMenu.moveTo(e.screenX, e.screenY);

        }
    });
}

export function setGlobalCssVar(doc: Document) {
    if (!doc.documentElement.style) doc.head.appendChild(ztoolkit.UI.createElement(doc, "style"));
    return function setKVs(KVs: (string | number)[][]) {
        KVs.filter((KV) => {
            doc.documentElement.style.setProperty(String(KV[0]), String(KV[1]));
        });
    };
}


/* const menuPropsGroupsArrWithFunction = [
    [
        ["info-copyImage", copyImage, []],
        ["info-saveImage", saveImage, []],
        ["info-editImage", editImage, []],
        ["info-convertImage", convertImage, []],
        ["info-ocrImage", ocrImage, []]
    ],
    [
        ["info-shareImage", shareImage, []],
        ["info-sendToPPT", sendToPPT, []],
        ["info-printImage", printImage, []]
    ],
]; */



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
[id^="collection-"]{
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