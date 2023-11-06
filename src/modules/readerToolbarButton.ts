import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getFileInfo, getPathDir, readJsonFromDisk, saveJsonToDisk } from "../utils/prefs";
import { fileSizeFormat } from "../utils/tools";
import { fontStyleFileName, saveDiskFontSimpleInfo, getFontInfo, clearCanvas, identityFontStyle, redPointCollectToDisk, makeFontInfoNote } from "./fontDetect";
import { fullTextTranslate } from "./fullTextTranslate";
import { clearAnnotations, imageToAnnotation } from "./imageToAnnotation";
import { prepareReader } from "./prepareReader";




const dropmarker =
{
    tag: "span",
    id: config.addonRef + "_dropmarker",
    namespace: "html",
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
};
const buttonBackground =
{
    tag: "span",
    id: config.addonRef + "_buttonBackground",
    namespace: "html",
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
    id: config.addonRef + "_toolbarButtonSpacer",
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
        pdfItemIDChecked = (Object.values(fontSimpleInfo) as any).some((fontSimpleInfo: any) => fontSimpleInfo.pdfItemID == pdfItemID);
        lengthBeforCheck = Object.keys(fontSimpleInfo).length;
    }
    if (!pdfItemIDChecked || pdfItemIDChecked) {
        const fontSimpleInfoArrs = (await getFontInfo()).fontSimpleInfoArr;
        //await clearCanvas();
        if (fontSimpleInfoArrs.length) {
            const boldRedPointArr = identityFontStyle(fontSimpleInfoArrs);
            await redPointCollectToDisk(boldRedPointArr);
            fontSimpleInfo = await saveDiskFontSimpleInfo(fontSimpleInfoArrs, fontSimpleInfo);
            //await makeFontInfoNote(fontSimpleInfo, boldRedPointArr);
            const note = "note";

        }
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
    const textJsonStringify = JSON.stringify(
        fontSimpleInfo,
        (k, v) => {
            if (k == "chars") {
                return v.join("");
            }
            return v;
        },
        4);
    const content = "isReadDisk: " + isReadDisk + " hasThisPdfFont: " + hasThisPdfFont + "\n\n"
        + getString("info-fileInfo-size") + fileSizeFormat(fileSize) + "\n\n"
        + textJsonStringify;

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
                    //namespace: "html",
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
        //将对话框挂载到全局对象 dialog 上
        addon.data.dialog = dialogHelperFont;
    }
}

function showDialog(dialogData: any) {
    /* const openArgs = {
        title: `${config.addonRef}`,
    }; */
    const dialogCellID = "dialog-fontInfo";
    const dialogHelperFont = addon.data.dialog!;
    if (dialogHelperFont.window) {
        if (dialogHelperFont.window.closed) {
            dialogHelperFont.setDialogData(dialogData).open(`${config.addonRef}`);

        } else {
            dialogHelperFont.window.focus();
            const textarea = dialogHelperFont.window.document.querySelector("#" + dialogCellID);
            textarea!.innerHTML = dialogData.content;
        };
    } else {
        dialogHelperFont.setDialogData(dialogData).open(`${config.addonRef}`);
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
        namespace: "xul",
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
        namespace: "xul",
        attributes: {
            label: getString(option.label),
        }
    }, menupopup).addEventListener("command", () => {
        option.func(...option.args);
    });
};

