
import { ElementProps, TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { getString } from "../utils/locale";
import { config } from "../../package.json";
import { onSaveImageAs } from "../utils/prefs";
import { ztoolkit } from "../../typings/global";


declare type MenuProps = [label: string, func?: (...args: any[]) => any | void, args?: any[]];
declare type Toolbarbutton = "menu" | "menu-button" | "checkbox" | "radio" | undefined;
declare type ButtonParas = [idPostfix: string,
    tooltiptext: string,
    type?: Toolbarbutton,
    namespace?: "xul" | "html" | "svg",
    children?: TagElementProps[],
    classList?: string[],
    imageURL?: string];

declare type ToolbarOption = {
    doc: Document;
    toolbarParas: [toolbarIdPostfix: string, toolbarClassList?: string[]];
    isHbox: boolean;
    toolbuttonParasArr: [buttonParasArr: ButtonParas];
    styleInsert: string;
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

        const imgElment = ztoolkit.UI.createElement(document, "div", {
            namespace: "html",
            id: "printImg",
            attributes: {
                style: style,
            },
            children: [imgProps]
        });
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



//["toolbar", "toolbar-primary"];["toolbar", "toolbar-primary"];["toolbox-top"]
export class Toolbar {
    buttonVHbox: XUL.Element;
    //toolbar: XUL.Element;
    doc: Document;

    constructor(option: ToolbarOption) {
        this.doc = option.doc;
        this.buttonVHbox = this.makeButtonBox(option.isHbox);
        //this.toolbar = this.createToolbar(option);
        insertStyle(option.doc, option.styleInsert);
    }

    createToolbar(option: ToolbarOption) {
        option.toolbuttonParasArr.filter((buttonParasArr) => {
            //this.makeToolBarButton(buttonParasArr); 
            const [idPostfix, tooltiptext, type, children, classList, imageURL] = buttonParasArr;
            const toolbarbuttonProps = makeTagElementProps({
                tag: "toolbarbutton",
                id: config.addonRef + '-' + idPostfix,
                namespace: "xul",
                classList: classList,
                attributes: {
                    tabindex: "-1",
                    tooltiptext: getString(tooltiptext),
                    image: imageURL,
                    label: getString(tooltiptext),
                    type: type,
                },
                children: children,
            });
            ztoolkit.UI.appendElement(toolbarbuttonProps, this.buttonVHbox) as XUL.ToolBarButton;
        });
    }

    makeToolBarButton(buttonParasArr: ButtonParas) {
        const [idPostfix, tooltiptext, type, children, classList, imageURL] = buttonParasArr;
        const toolbarbuttonProps = makeTagElementProps({
            tag: "toolbarbutton",
            id: config.addonRef + '-' + idPostfix,
            namespace: "xul",
            classList: classList,
            attributes: {
                tabindex: "-1",
                tooltiptext: getString(tooltiptext),
                image: imageURL,
                label: getString(tooltiptext),
                type: type,
            },
            children: children,
        });
        return ztoolkit.UI.appendElement(toolbarbuttonProps, this.buttonVHbox) as XUL.ToolBarButton;
    }

    makeButtonBox(isHbox: boolean) {
        let tag;
        isHbox ? tag = "hbox" : tag = "vbox";
        const boxProps = makeTagElementProps({
            tag: tag,
            id: config.addonRef + '-' + Zotero.randomString(8),
            namespace: "xul",
            attributes: {
                align: "center",
                flex: 1,
            },
        });
        const buttonVHbox = ztoolkit.UI.appendElement(boxProps, this.toolbar) as XUL.Element;
        eventDelegation(buttonVHbox, "command", 'toolbarbutton', this.handleToolButton);
        /* hboxToolButton.addEventListener("command", e => {            
            const tagName = (e.target as any).tagName.toLowerCase();
            if (tagName === 'toolbarbutton') {
                // anchorNode 为操作的目标元素
                this.handleToolButton(e.target!);
            }
        }); */
        return buttonVHbox;
    }

    makeToolBar(container?: Element) {
        const toolbarProps = makeTagElementProps({
            tag: "toolbar",
            id: config.addonRef + '-' + this.idPostfixToolbar,
            namespace: "xul",
            classList: this.toolbarClassList,
            attributes: {
                tabindex: "-1",
            },
        });
        return container ? ztoolkit.UI.appendElement(toolbarProps, container) as XUL.ToolBar
            : ztoolkit.UI.createElement(this.doc, "toolbar", toolbarProps) as XUL.ToolBar;

    }



    handleToolButton(target: EventTarget) {
        () => { };
    }
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
 * //TagElementProps 属性. 传入的参数会覆盖原默认参数
 * //默认参数
 * ignoreIfExists: true,返回存在的元素,不新建不替换
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
function makeTagElementProps(option: TagElementProps): TagElementProps {
    const preDefinedObj = {
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "xul",
    };
    return Object.assign(preDefinedObj, option);
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

