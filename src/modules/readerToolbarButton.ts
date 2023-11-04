import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getFileInfo, getPathDir, readJsonFromDisk, saveJsonToDisk } from "../utils/prefs";
import { fontStyleFileName, fontSimpleInfoToDisk, getFontInfo } from "./fontDetect";
import { fullTextTranslate } from "./fullTextTranslate";
import { clearAnnotations, imageToAnnotation } from "./imageToAnnotation";
import { prepareReader } from "./prepareReader";




const dropmarker =
{
    tag: "span",
    classList: ["dropmarker"],
    styles: {
        background: "url(assets/icons/searchbar-dropmarker@2x.4ebeb64c.png) no-repeat 0 0/100%",
        display: "inline-block",
        height: "4px",
        margin: "6px 0",
        marginInlineStart: "2px",
        marginInlineEnd: "2px",
        position: "relative",
        verticalAlign: "top",
        width: "7px",
        zIndex: "1"
    }
}
    ;

const buttonBackground =
{
    tag: "span",
    classList: ["button-background"],
    /* styles: {
        backgroundImage: `url(chrome://${config.addonRef}/content/icons/favicon.png)`,
        backgroundSize: "auto 16px",
        backgroundRepeat: "no-repeat",
    } */
};
const toolbarButtonSpacer = {
    enableElementJSONLog: false,
    enableElementDOMLog: false,
    ignoreIfExists: true,
    namespace: "html",
    tag: "div",
    classList: ["readerButtonSpacer"],
    style: {
        width: "30px",
        display: "inline-block",
        height: "1px",
    },
    properties: {
        innerHTML: "&emsp;"
    },
};
//properties: "&nbsp; &emsp; &ensp;  &thinsp; &zwnj; &zwj;",;
/* export async function readerToolbarButton() {
    const document1 = (await prepareReader("pagesLoaded"))("document");
    //while (!(_window = reader?._iframeWindow?.wrappedJSObject)) {
        //await Zotero.Promise.delay(10);
    //} 
    const tab = Zotero_Tabs._getTab(Zotero_Tabs.selectedID);
    // title = tab.tab.title;
    //title = title.replace(/( - [^-]+){1,2}$/m, ""); 
    const parent = document1.querySelector("#reader-ui .toolbar .end")!;
    const ref = parent.querySelector("#viewFind") as HTMLDivElement;
    const toolbarButtonSpacer = ztoolkit.UI.insertElementBefore(
        {
            enableElementJSONLog: false,
            enableElementDOMLog: false,
            ignoreIfExists: true,
            namespace: "html",
            tag: "div",
            classList: ["toolbarButtonSpacer"],
        }, ref
    ) as HTMLDivElement;

    const button = ztoolkit.UI.insertElementBefore({
        enableElementJSONLog: false,
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "html",
        tag: "button",
        id: config.addonRef + "-translate",
        classList: ["toolbarButton"],
        styles: {
            // 解决图标
            backgroundImage: `url(chrome://${config.addonRef}/content/icons/favicon.png)`,
            backgroundSize: "16px 16px",
            backgroundPosition: "35% center",
            backgroundRepeat: "no-repeat",
            width: "45px",
            //filter: "grayscale(100%)",
            padding: "4px 3px 4px 22px"
        },
        attributes: {
            title: config.addonName + "-translate",
            tabindex: "-1",
        },
        // 长按是解析图表，点击是切换
        listeners: [
            {
                type: "click",
                listener: () => {
                    const menupopup = ztoolkit.UI.appendElement({
                        tag: "menupopup",
                        id: config.addonRef + "-menupopup",
                        namespace: "xul",
                        children: [
                        ]
                    }, document.querySelector("#browser")!) as XUL.MenuPopup;
                    // 1. pdf2Note
                    const menuitem0 = ztoolkit.UI.appendElement({
                        tag: "menuitem",
                        attributes: {
                            label: getString("menuitem-pdf2Note"),
                        }
                    }, menupopup);
                    menuitem0.addEventListener("command", () => {
                        fullTextTranslate.onePdf2Note();
                    });
                    // 2. 图表注释视图
                    const menuitem1 = ztoolkit.UI.appendElement({
                        tag: "menuitem",
                        attributes: {
                            label: getString("menuitem-pdf"),
                        }
                    }, menupopup);
                    menuitem1.addEventListener("command", () => {
                        fullTextTranslate.translateOnePdf();
                    });
                   
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    menupopup.openPopup(button, 'after_start', 0, 0, false, false);
                }
            },
        ],
        children: [dropmarker]
    }, toolbarButtonSpacer) as HTMLButtonElement;


}
 */
/* export async function fontCheck() {
    const document1 = (await prepareReader("pagesLoaded"))("document");
    const parent = document1.querySelector("#reader-ui .toolbar .center")!;
    const ref = parent.querySelector(".highlight") as HTMLDivElement;
    const dialogButton = ztoolkit.UI.insertElementBefore({
        enableElementJSONLog: false,
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "html",
        tag: "button",
        id: config.addonRef + "_font_dialog",
        classList: ["toolbarButton"],
        styles: {
            width: "45px",
            //border: "1px solid #342753",
            //fontSize: "10px",
            backgroundImage: `url(chrome://${config.addonRef}/content/icons/favicon@0.5x.png)`,
            backgroundSize: "16px 16px",
            backgroundPosition: "35% center",
            backgroundRepeat: "no-repeat",
            padding: "4px 3px 4px 22px"
        },

        properties: {
            //innerText: getString("info-checkFont"),
        },
        attributes: {
            title: getString("info-checkFont"),
            tabindex: "-1",
        },
        listeners: [
            {
                type: "click",
                listener: async () => {
                    const dialogData = await fontCheckCallBack();
                    makeDialog();
                    showDialog(dialogData);
                }
            },
        ],
        children: [buttonBackground],
    }, ref) as HTMLButtonElement;
    const fontCheckCallBack = async () => {
        let fontSimpleInfo = await readJsonFromDisk(fontStyleFileName);
        let isReadDisk = false;
        let hasThisPdfFont = false;
        let pdfItemIDChecked = false;
        let lengthBeforCheck = 0;
        if (fontSimpleInfo) {
            isReadDisk = true;
            const pdfItemID = Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.data.itemID;
            //const pdfItemID = Zotero_Tabs._tabs.filter((tab: any) => tab.id == Zotero_Tabs.selectedID)[0].data.itemID;
            pdfItemIDChecked = (Object.values(fontSimpleInfo) as any).find((fontSimpleInfo: any) => fontSimpleInfo.pdfItemID == pdfItemID);
            lengthBeforCheck = Object.keys(fontSimpleInfo).length;
        }
        let fontSimpleInfoArr;
        if (!pdfItemIDChecked) {
            fontSimpleInfoArr = (await getFontInfo()).fontSimpleInfoArr;
            fontSimpleInfo = await fontSimpleInfoToDisk(fontSimpleInfoArr, fontSimpleInfo);
            const lengthAfterSave = Object.keys(fontSimpleInfo).length;
            if (lengthBeforCheck != lengthAfterSave) {
                hasThisPdfFont = true;
            }
        }
        const fileInfo = await getFileInfo(getPathDir(fontStyleFileName).path);
        let fileSize;
        if (!fileInfo) {
            fileSize = 0;
        } else {
            fileSize = fileInfo.size;
        }
        const content = "isReadDisk: " + isReadDisk + " hasThisPdfFont: " + hasThisPdfFont + "\n\n"
            + getString("info-fileInfo-size") + fileInfo.size + "\n\n"
            + JSON.stringify(fontSimpleInfo, null, 4);

        const dialogData = {
            "content": content
        };
        return dialogData;


    };
} */
/* 
                   menupopup.openPopup 是一个函数调用。
                   它用于打开一个弹出菜单，并将其定位在指定的按钮旁边。
                   具体来说，menupopup.openPopup 函数接受多个参数：
                   - 第一个参数 button 是一个按钮元素，表示要在其旁边打开弹出菜单的按钮。
                   - 第二个参数 'after_start' 是一个字符串，表示弹出菜单相对于按钮的位置。在这种情况下，它指定将弹出菜单放置在按钮的起始位置之后。
                   - 第三个和第四个参数 0 表示弹出菜单的偏移量，用于微调弹出菜单的位置。
                   - 第五个和第六个参数 false 表示是否在弹出菜单显示时将焦点设置在菜单上。
                   因此，给定的代码行的作用是在指定的按钮旁边打开一个弹出菜单，并将其定位在按钮的起始位置之后。
                    */




export async function readerToolbarButton() {
    //按钮定位在哪里
    const document1 = (await prepareReader("pagesLoaded"))("document");
    //const tab = Zotero_Tabs._getTab(Zotero_Tabs.selectedID);
    /* title = tab.tab.title;
    title = title.replace(/( - [^-]+){1,2}$/m, ""); */
    const parent = document1.querySelector("#reader-ui .toolbar .center")!;
    const ref = parent.querySelector(".highlight") as HTMLDivElement;
    //加入分割后按钮右侧背景icon没有右边线。应用 buttonSpacer 的时候 button的ref应改为 buttonSpacer
    //const buttonSpacer = ztoolkit.UI.insertElementBefore(toolbarButtonSpacer, ref) as HTMLDivElement;

    //弹出菜单ID，子菜单的标签、调用的函数及参数，参数按顺序组成数组（可为空）
    const menupopupID = "_menupopupImgTableTool";
    const imgTableSingleObjMenuitemArr = [
        {
            label: "menuitem-showSelectedAnnotations",
            func: clearAnnotations,
            args: ["show", "selected"]
        },
        {
            label: "menuitem-deleteSelectedAnnotations",
            func: clearAnnotations,
            args: ["delete", "selected"]
        },
        {
            label: "menuitem-hiddenSelectedAnnotations",
            func: clearAnnotations,
            args: ["hidden", "selected"]
        },
    ];
    const imgTableAllObjMenuitemArr = [
        {
            label: "menuitem-hiddenAllAnnotations",
            func: clearAnnotations,
            args: ["hidden", "all"]
        },
        {
            label: "menuitem-showAllAnnotations",
            func: clearAnnotations,
            args: ["show", "all"]
        },
        {
            label: "menuitem-deleteAllAnnotations",
            func: clearAnnotations,
            args: ["delete", "all"]
        },
    ];
    const pdf2NoteMenuitemArr = [
        {
            label: "menuitem-pdf2Note",
            func: fullTextTranslate.onePdf2Note,
            args: []
        },
    ];
    const translateOnePdfMenuitemArr = [
        {
            label: "menuitem-pdf",
            func: fullTextTranslate.translateOnePdf,
            args: []
        },
    ];
    const fontMenuitemArr = [
        {
            label: "info-checkFont",
            func: fontStyleCheck,
            args: []
        },
    ];
    //子菜单内容组成数组 menuitemGroupArr 作为 makeClickButton 的参数
    const menuitemGroupArr = [
        imgTableSingleObjMenuitemArr,
        imgTableAllObjMenuitemArr,
        pdf2NoteMenuitemArr,
        translateOnePdfMenuitemArr,
        fontMenuitemArr];
    //按钮 button 作为 button 的参数
    const button = ztoolkit.UI.insertElementBefore({
        enableElementJSONLog: false,
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "html",
        tag: "button",
        id: config.addonRef + "_imgTableTool",
        classList: ["toolbarButton"],
        styles: {
            width: "48px",
            padding: "4px 4px"
        },
        attributes: {
            title: getString("info-imgTableTool"),
            tabindex: "-1",
        },
        listeners: [
            {
                type: "click",
                listener: () => { makeClickButton(menupopupID, menuitemGroupArr, button); },
            },
        ],
        children: [buttonBackground, dropmarker,]

    }, ref) as HTMLButtonElement;
    //以伪元素注入图标，仅显示favicon？，设为其他文件，在调试模式关闭后重新打开 background-image 的勾选，可显示
    const styleConten = `#${config.addonRef}_imgTableTool::before {
        content: '';
        background-image: url(chrome://${config.addonRef}/content/icons/favicon.png);
        background-size: 100%;
        display: inline-block;
        height: 20px;
        width: 20px;
        vertical-align: top;        
    }`;
    //display: inline-block;
    //favicon font@0.5x

    document1.head.appendChild(ztoolkit.UI.createElement(document1, "style", {
        properties: {
            innerHTML: styleConten,
        },
    }));

}

const fontStyleCheck = async () => {
    const dialogData = await fontCheckCallBack();
    makeDialog();
    showDialog(dialogData);
};

const fontCheckCallBack = async () => {
    let fontSimpleInfo = await readJsonFromDisk(fontStyleFileName);
    let isReadDisk = false;
    let hasThisPdfFont = false;
    let pdfItemIDChecked = false;
    let lengthBeforCheck = 0;
    if (fontSimpleInfo) {
        isReadDisk = true;
        const pdfItemID = Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.data.itemID;
        //const pdfItemID = Zotero_Tabs._tabs.filter((tab: any) => tab.id == Zotero_Tabs.selectedID)[0].data.itemID;
        pdfItemIDChecked = (Object.values(fontSimpleInfo) as any).find((fontSimpleInfo: any) => fontSimpleInfo.pdfItemID == pdfItemID);
        lengthBeforCheck = Object.keys(fontSimpleInfo).length;
    }
    let fontSimpleInfoArr;
    if (!pdfItemIDChecked) {
        fontSimpleInfoArr = (await getFontInfo()).fontSimpleInfoArr;
        fontSimpleInfo = await fontSimpleInfoToDisk(fontSimpleInfoArr, fontSimpleInfo);
        const lengthAfterSave = Object.keys(fontSimpleInfo).length;
        if (lengthBeforCheck != lengthAfterSave) {
            hasThisPdfFont = true;
        }
    }
    const fileInfo = await getFileInfo(getPathDir(fontStyleFileName).path);
    let fileSize;
    if (!fileInfo) {
        fileSize = 0;
    } else {
        fileSize = fileInfo.size;
    }
    const content = "isReadDisk: " + isReadDisk + " hasThisPdfFont: " + hasThisPdfFont + "\n\n"
        + getString("info-fileInfo-size") + fileInfo.size + "\n\n"
        + JSON.stringify(fontSimpleInfo, null, 4);

    const dialogData = {
        "content": content
    };
    return dialogData;
};

function makeDialog() {
    const dialogCellID = "dialog-fontInfo";
    //如果本插件对话框存在，则视为dialogHelperFont，无需重复创建。之后再设置数据
    if (!addon.data.dialog) {
        const dialogHelperFont = new ztoolkit.Dialog(1, 1)
            .addCell(0, 0,
                {
                    tag: "textarea",
                    namespace: "html",
                    id: dialogCellID,
                    attributes: {
                        style: "width: 400; height: 430;",
                        //数据绑定的数据来源于dialogData的哪个键值
                        "data-bind": "content",
                        //元素某个property
                        "data-prop": "innerHTML",
                    },
                    /* properties: {
                        //无需<pre></pre>标签，加了会显示标签本身
                        innerHTML: `${content}`
                    } */
                }
            );
        addon.data.dialog = dialogHelperFont;
    }
}

function showDialog(dialogData: any) {
    const openArgs = {
        title: `${config.addonRef}`,
    };
    const dialogCellID = "dialog-fontInfo";
    const dialogHelperFont = addon.data.dialog!;
    if (dialogHelperFont.window) {
        if (dialogHelperFont.window.closed) {
            dialogHelperFont.setDialogData(dialogData).open(openArgs.title);

        } else {
            dialogHelperFont.window.focus();
            const textarea = dialogHelperFont.window.document.querySelector("#" + dialogCellID);
            textarea!.innerHTML = dialogData.content;
        };
    } else {
        dialogHelperFont.setDialogData(dialogData).open(openArgs.title);
    }
}


const makeClickButton = (idPostfix: string, menuitemGroupArr: any[][], thisButton: HTMLButtonElement) => {
    const menupopup: any = makeMenupopup(idPostfix);
    menuitemGroupArr.filter((menuitemGroup: any[], i: number) => {
        menuitemGroup.map((e: any) => makeMenuitem(e, menupopup));
        if (i < menuitemGroupArr.length - 1) {
            menuseparator(menupopup);
        }
    });
    menupopup.openPopup(thisButton, 'after_start', 0, 0, false, false);
};
const menuseparator = (menupopup: any) => {
    ztoolkit.UI.appendElement({
        tag: "menuseparator",
    }, menupopup);
};

const makeMenupopup = (idPostfix: string) => {
    const menupopup = ztoolkit.UI.appendElement({
        tag: "menupopup",
        id: config.addonRef + idPostfix,
        namespace: "xul",
        children: [
        ]
    }, document.querySelector("#browser")!) as XUL.MenuPopup;
    return menupopup;
};


const makeMenuitem = (option: { label: string, func: (...args: string[]) => void, args: string[]; }, menupopup: any,) => {
    ztoolkit.UI.appendElement({
        tag: "menuitem",
        attributes: {
            label: getString(option.label),
        }
    }, menupopup).addEventListener("command", () => {
        option.func(...option.args);
    });
};

