
import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { getString } from "../utils/locale";
import { config } from "../../package.json";


declare type MenuProps = [label: string, func?: (...args: any[]) => any | void, args?: any[]];



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


export class contextMenu {
    contextMenu: Element;
    constructor(option: any) {
        this.contextMenu = this.createContextMenu(option.menuPropsGroupsArr, option.idPostfix);
    }

    copyImage(e: Event) {
        //const dialogImgViewer = addon.data.globalObjs?.dialogImgViewer;
        //const doc = dialogImgViewer.window.document as Document;
        //const images = doc.querySelectorAll("img[id^='showImg-'"); 
        const img = (e.target as HTMLImageElement).src;
        if (!img) return;
        const clip = new ztoolkit.Clipboard();
        clip.addImage(img);
        clip.copy();
    }
    saveImage() { }
    editImage() { }
    convertImage() { }
    ocrImage() { }
    shareImage() { }
    sendToPPT() { }
    printImage() { }

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


    createContextMenu(menuPropsGroups: MenuProps[][], idPostfix: string, event?: MouseEvent) {
        //event的传递在打开菜单时进行
        //菜单项的事件监听可以通过事件委托进行
        const menupopup = this.makeMenupopup(idPostfix);
        menuPropsGroups.filter((menuPropsGroup: MenuProps[]) =>
            menuPropsGroup.filter((menuProps: MenuProps) => {
                this.makeMenuitem(this.creatPropsMeun(menuProps), menupopup, event);
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

    /**
     * @remark
     * 传入的参数会覆盖默认参数：
     *  ignoreIfExists: true,不创建不替换，返回存在的元素。
        namespace: "xul",
        enableElementRecord: true,
        enableElementJSONLog: false,
        nableElementDOMLog: false,
     * @param option 
     * @returns 
     */
    makeTagElementProps(option: TagElementProps): TagElementProps {
        const preDefinedObj = {
            enableElementDOMLog: false,
            ignoreIfExists: true,
            namespace: "xul",
        };
        return Object.assign(preDefinedObj, option);
    }

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

        return ztoolkit.UI.appendElement({
            tag: "menupopup",
            id: config.addonRef + '-' + idPostfix,
            namespace: "xul",
            children: [],
        }, document.querySelector("#browser")!) as XUL.MenuPopup;

    };

    makeMenuitem(
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
export function batchAddEventListener(args: [element: Element, [eventName: string, callBack: any][]][]) {
    for (const arg of args) {
        for (const paras of arg[1]) {
            arg[0].addEventListener(paras[0], paras[1]);
        }
    }
}

/* export function copyImage(e: Event) {
    //const dialogImgViewer = addon.data.globalObjs?.dialogImgViewer;
    //const doc = dialogImgViewer.window.document as Document;
    //const images = doc.querySelectorAll("img[id^='showImg-'"); 
    const img = (e.target as HTMLImageElement).src;
    if (!img) return;
    const clip = new ztoolkit.Clipboard();
    clip.addImage(img);
    clip.copy();
}
export function saveImage() { }
export function editImage() { }
export function convertImage() { }
export function ocrImage() { }
export function shareImage() { }
export function sendToPPT() { }
export function printImage() { }
export const menuPropsGroupsArr = creatPropsMeunGroups(
    //event的传递在打开菜单时进行
    //菜单项的事件监听可以通过事件委托进行
    [
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
    ]
);


export function creatPropsMeunGroups(menuPropsGroups: MenuProps[][]) {
    return menuPropsGroups.map((menuPropsGroup: MenuProps[]) => creatPropsMeunGroup(menuPropsGroup));
};
export function creatPropsMeunGroup(menuPropsGroup: MenuProps[]) {
    return menuPropsGroup.map((menuProps: MenuProps) => creatPropsMeun(menuProps));

};
export function creatPropsMeun(menuProps: [label: string, func: (...args: any[]) => any | void, args?: any[]]) {
    return {
        label: menuProps[0],
        func: menuProps[1],
        args: menuProps[2] || [],
    };
};

export function createContextMenu(menuitemGroupArr: any[][], idPostfix: string, event: MouseEvent) {
    const menupopup = makeMenupopup(idPostfix);
    menuitemGroupArr.filter((menuitemGroup: any[]) => {
        menuitemGroup.map((e: any) => makeMenuitem(e, menupopup, event));
        if (menuitemGroupArr.indexOf(menuitemGroup) !== menuitemGroupArr.length - 1) {
            menuseparator(menupopup);
        }
    });
    return menupopup;
} */

/**
 * @remark
 * 传入的参数会覆盖默认参数：
 *  ignoreIfExists: true,不创建不替换，返回存在的元素。
    namespace: "xul",
    enableElementRecord: true,
    enableElementJSONLog: false,
    nableElementDOMLog: false,
 * @param option 
 * @returns 
 */
/* export function makeTagElementProps(option: TagElementProps): TagElementProps {
    const preDefinedObj = {
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "xul",
    };
    return Object.assign(preDefinedObj, option);
}

export function menuseparator(menupopup: any) {
    ztoolkit.UI.appendElement({
        tag: "menuseparator",
        namespace: "xul",
    }, menupopup);
};
export function makeMenupopup(idPostfix: string) {


    return ztoolkit.UI.appendElement({
        tag: "menupopup",
        id: config.addonRef + '-' + idPostfix,
        namespace: "xul",
        children: [],
    }, document.querySelector("#browser")!) as XUL.MenuPopup;

};

export function makeMenuitem(option: { label: string, func: (...args: any[]) => any | void, args: any[]; }, menupopup: any, event: MouseEvent) {
    const menuitem = ztoolkit.UI.appendElement({
        tag: "menuitem",
        namespace: "xul",
        attributes: {
            label: getString(option.label),
        }
    }, menupopup);
    if (judgeAsync(option.func)) {
        menuitem.addEventListener("command", async (e) => {
            await option.func(...option.args, event);
        });
    } else {
        menuitem.addEventListener("command", (e) => {
            option.func(...option.args, event);
        });
    }
};

export function judgeAsync(fun: any) {
    const AsyncFunction = (async () => { }).constructor;
    return fun instanceof AsyncFunction;
}; */




/* makeTagElementProps({
    tag: "menupopup",
    id: config.addonRef + '-' + idPostfix,
    children: children,
}); */


/* async function _openContextMenu({ x, y, itemGroups }) {
    const popup = document.createXULElement('menupopup');
    this._popupset.appendChild(popup);
    popup.addEventListener('popuphidden', function () {
        popup.remove();
    });
    const appendItems = (parentNode, itemGroups) => {
        for (const itemGroup of itemGroups) {
            for (const item of itemGroup) {
                if (item.groups) {
                    const menu = parentNode.ownerDocument.createXULElement('menu');
                    menu.setAttribute('label', item.label);
                    const menupopup = parentNode.ownerDocument.createXULElement('menupopup');
                    menu.append(menupopup);
                    appendItems(menupopup, item.groups);
                    parentNode.appendChild(menu);
                }
                else {
                    const menuitem = parentNode.ownerDocument.createXULElement('menuitem');
                    menuitem.setAttribute('label', item.label);
                    menuitem.setAttribute('disabled', item.disabled);
                    if (item.color) {
                        menuitem.className = 'menuitem-iconic';
                        menuitem.setAttribute('image', this._getColorIcon(item.color, item.checked));
                    }
                    else if (item.checked) {
                        menuitem.setAttribute('type', 'checkbox');
                        menuitem.setAttribute('checked', item.checked);
                    }
                    menuitem.addEventListener('command', () => item.onCommand());
                    parentNode.appendChild(menuitem);
                }
            }
            if (itemGroups.indexOf(itemGroup) !== itemGroups.length - 1) {
                const separator = parentNode.ownerDocument.createXULElement('menuseparator');
                parentNode.appendChild(separator);
            }
        }
    };
    appendItems(popup, itemGroups);
    let rect = this._iframe.getBoundingClientRect();
    rect = this._window.windowUtils.toScreenRectInCSSUnits(rect.x + x, rect.y + y, 0, 0);
    setTimeout(() => popup.openPopupAtScreen(rect.x, rect.y, true));
} */



