import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { getString } from "../utils/locale";
import { config } from "../../package.json";


declare type MenuProps = [label: string, func: (...args: any[]) => any | void, args?: any[]];

function copyImage() {

    const dialogImgViewer = addon.data.globalObjs?.dialogImgViewer;
    const doc = dialogImgViewer.window.document as Document;
    const images = doc.querySelectorAll("img[id^='showImg-'");
    if (!images) return;
    const clip = new ztoolkit.Clipboard();

    /* for (const img of images) {
        const imgData = (img as HTMLImageElement).src;
        clip.addImage(imgData);
    } */
    /* const img0 = (images[0] as HTMLImageElement).src;
    clip.addImage(img0); */
    /* const img1 =(images[1] as HTMLImageElement).src
    clip.addImage(img1); */
    const img2 = (images[2] as HTMLImageElement).src;
    clip.addImage(img2);
    clip.copy();
}
function saveImage() { }
function editImage() { }
function convertImage() { }
function ocrImage() { }
function shareImage() { }
function sendToPPT() { }
function printImage() { }

/* const saveImageProps = {
    label: "info-saveImage",
    func: saveImage,
    args: []
}; */

export const menuPropsGroupsArr = creatPropsMeunGroups(
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

export function batchAddEventListener(args: [element: Element, [eventName: string, callBack: any][]][]) {
    for (const arg of args) {
        for (const paras of arg[1]) {
            arg[0].addEventListener(paras[0], paras[1]);
        }
    }
}
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

export function createContextMenu(menuitemGroupArr: any[][], idPostfix: string) {
    const menupopup = makeMenupopup(idPostfix);
    menuitemGroupArr.filter((menuitemGroup: any[]) => {
        menuitemGroup.map((e: any) => makeMenuitem(e, menupopup));
        if (menuitemGroupArr.indexOf(menuitemGroup) !== menuitemGroupArr.length - 1) {
            menuseparator(menupopup);
        }
    });
    return menupopup;
}

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
export function makeTagElementProps(option: TagElementProps): TagElementProps {
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

export function makeMenuitem(option: { label: string, func: (...args: any[]) => any | void, args: any[]; }, menupopup: any,) {
    const menuitem = ztoolkit.UI.appendElement({
        tag: "menuitem",
        namespace: "xul",
        attributes: {
            label: getString(option.label),
        }
    }, menupopup);
    const func = option.func;
    if (judgeAsync(func)) {
        menuitem.addEventListener("command", async () => {
            await func(...option.args);
        });
    } else {
        menuitem.addEventListener("command", () => {
            option.func(...option.args);
        });
    }
};

export function judgeAsync(fun: any) {
    const AsyncFunction = (async () => { }).constructor;
    return fun instanceof AsyncFunction;
};







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



