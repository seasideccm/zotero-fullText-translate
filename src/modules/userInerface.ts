
import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { getString } from "../utils/locale";
import { config } from "../../package.json";
import { onSaveImageAs } from "../utils/prefs";
import { randomUUID } from "crypto";



declare type MenuProps = [label: string, func?: (...args: any[]) => any | void, args?: any[]];


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




export class Toolbar {
    toolBox?: XUL.ToolBox;
    toolBar: XUL.ToolBar;
    iconsize: string;
    idPostfixToolbox?: string;
    toolboxClassList: string[];
    idPostfixToolbar: string;
    toolbarClassList: string[];
    toolBarButtonClassList: string[];
    toolBoxcontainer: Element;
    doc: Document;
    toolbarParasArr: any[];
    /**
     * 
     * @param option 
     */
    constructor(option: {
        doc: Document;

        idPostfixToolbar: string;
        toolbarParasArr: {
            idPostfixHbox: string;
            buttonParasArr: [idPostfixToolBarButton: string, tooltiptext: string, imageURL?: string][];
        }[];
        toolBoxcontainer?: Element;
        toolBoxcontainerId?: string;
        idPostfixToolbox?: string;
        toolboxClassList?: string[];
        toolbarClassList?: string[];
        toolBarButtonClassList?: string[];
        iconsize?: string;
    }) {
        this.toolBoxcontainer = option.toolBoxcontainer || option.doc.querySelector(`#${option.toolBoxcontainerId}`)!;
        this.idPostfixToolbox = option.idPostfixToolbox || undefined;
        this.toolboxClassList = option.toolboxClassList || ["toolbox-top"];
        this.idPostfixToolbar = option.idPostfixToolbar;
        this.toolbarClassList = option.toolbarClassList || ["toolbar", "toolbar-primary"];
        this.toolBox = this.idPostfixToolbox ? this.makeToolBox() : undefined;
        this.toolBar = this.makeToolBar(this.toolBox);
        this.iconsize = option.iconsize || "small";
        this.toolBarButtonClassList = option.toolBarButtonClassList || ["zotero-tb-button"];
        this.doc = option.doc;
        this.toolbarParasArr = option.toolbarParasArr;
        this.creatToolBars();
    }

    creatToolBars() {
        this.toolbarParasArr.filter((toolbarParas: any) => {
            const toolBarContainer = this.createToolbar(toolbarParas.idPostfixHbox)(toolbarParas.buttonParasArr);
            this.toolBar.appendChild(toolBarContainer);
        });
    }

    createToolbar(idPostfixHbox: string) {
        return (buttonParasArr: any[]) => {
            const toolBarContainer = this.makeHbox(idPostfixHbox);
            buttonParasArr.filter((buttonParas: string[]) => {
                const [idPostfixToolBarButton, tooltiptext, imageURL] = buttonParas;
                this.makeToolBarButton(toolBarContainer, idPostfixToolBarButton, tooltiptext, imageURL);
            });
            return toolBarContainer;
        };
    }

    //oncommand?: string Zotero.randomString(8)
    makeToolBarButton(container: Element, idPostfixToolBarButton: string, tooltiptext: string, imageURL?: string) {
        const toolBarButtonProps = makeTagElementProps({
            tag: "toolbarbutton",
            id: config.addonRef + '-' + idPostfixToolBarButton,
            namespace: "xul",
            classList: this.toolBarButtonClassList,
            attributes: {
                tabindex: "-1",
                tooltiptext: getString(tooltiptext),
                image: imageURL || undefined,
                label: getString(tooltiptext),
            },
        });
        return ztoolkit.UI.appendElement(toolBarButtonProps, container) as XUL.ToolBarButton;
    }

    makeHbox(idPostfixHbox: string) {
        const hboxProps = makeTagElementProps({
            tag: "hbox",
            id: config.addonRef + '-' + idPostfixHbox,
            namespace: "xul",
            attributes: {
                align: "center",
                flex: 1,
            },
        });
        const hboxToolButton = ztoolkit.UI.appendElement(hboxProps, this.toolBar);
        eventDelegation(hboxToolButton, "command", 'toolbarbutton', this.handleToolButton);
        /* hboxToolButton.addEventListener("command", e => {            
            const tagName = (e.target as any).tagName.toLowerCase();
            if (tagName === 'toolbarbutton') {
                // anchorNode 为操作的目标元素
                this.handleToolButton(e.target!);
            }
        }); */
        return hboxToolButton;
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

    makeToolBox() {
        const toolboxProps = makeTagElementProps({
            tag: "toolbox",
            id: config.addonRef + '-' + this.idPostfixToolbox,
            namespace: "xul",
            classList: this.toolboxClassList,
            attributes: {
                mode: "icons",
                defaultmode: "icons",
            },
        });
        return ztoolkit.UI.insertElementBefore(toolboxProps, this.toolBoxcontainer.firstElementChild!) as XUL.ToolBox;
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
     * @remark
     * 传入的参数会覆盖默原有参数：
     *  ignoreIfExists: true,返回存在的元素,不新建不替换
        namespace: "xul",
        enableElementRecord: true,
        enableElementJSONLog: false,
        nableElementDOMLog: false,
     * @param option 
     * @returns 
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


