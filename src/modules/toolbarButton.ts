import { ElementProps, TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { addonStorageDir, getFileInfo, getPathDir, readJsonFromDisk } from "../utils/prefs";
import { fileSizeFormat } from "../utils/tools";
import { fontStyleFileName, saveDiskFontSimpleInfo, getFontInfo, identityFontStyle, redPointCollectToDisk, makeFontInfoNote } from "./fontDetect";
import { fullTextTranslate } from "./fullTextTranslate";
import { clearAnnotations } from "./imageToAnnotation";
import { NoteMaker } from "./noteMakerHelp";
import { prepareReader } from "./prepareReader";
import { syncFontInfo } from "./syncInfo";
import { viewImgMenuArr } from "./imageViewer";


//url(assets/icons/searchbar-dropmarker@2x.4ebeb64c.png) no-repeat 0 0/100%

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


export async function zoteroMenubarButton() {
    if (document.querySelector("#" + config.addonRef + "_imgTableTool")) { return; }
    const parent = document.querySelector("#toolbar-menubar")!;
    ztoolkit.UI.appendElement(
        makeTagElementProps({ tag: "toolbarspring" }), parent
    );
    ztoolkit.UI.appendElement(
        makeTagElementProps({ tag: "toolbarseparator" }), parent
    );
    const menupopupID = "_menupopupImgTableTool2";
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
    const syncFontInfoMenuitemArr = [
        {
            label: "info-syncFontInfo",
            func: syncFontInfo,
            args: []
        },
    ];
    const insertImgMenuitemArr = [
        {
            label: "info-insertImg",
            func: insertImg,
            args: []
        },
    ];
    const menuitemGroupArr = [
        imgTableSingleObjMenuitemArr,
        imgTableAllObjMenuitemArr,
        pdf2NoteMenuitemArr,
        translateOnePdfMenuitemArr,
        fontMenuitemArr,
        syncFontInfoMenuitemArr,
        insertImgMenuitemArr,
        viewImgMenuArr
    ];
    const toolbaritemProps = makeTagElementProps({
        tag: "toolbaritem",
        id: config.addonRef + "_toolbaritem",
        attributes: {
            align: "right",
        },

    });
    const menubarProps = makeTagElementProps({
        tag: "menubar",
        id: config.addonRef + "_topTools",
        //classList: ["tool-group", "annotation-tools"],
        attributes: {
            align: "right",
        },
        styles: {
            //width: "200px",
            padding: "4px 4px"
        },
    });
    const dropmarker = {
        tag: "dropmarker",
        namespace: "xul",
        type: "menu",
        classList: ["toolbarbutton-menu-dropmarker"],
    };
    const buttonProps = makeTagElementProps({
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "html",
        tag: "button",
        id: config.addonRef + "_imgTableTool2",
        classList: ["zotero-tb-button"],
        styles: {
            backgroundImage: `url(chrome://${config.addonRef}/content/icons/favicon.png)`,
            backgroundSize: "18px 18px",
            backgroundPosition: "10% center",
            backgroundRepeat: "no-repeat",
            //float: "right",
            display: "flex",
            justifyContent: "flex-end",
            width: "48px",
            padding: "4px 3px 4px 22px",
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
        children: [dropmarker]
    });
    const toolbaritem = ztoolkit.UI.appendElement(
        toolbaritemProps,
        parent
    );
    const topTool = ztoolkit.UI.appendElement(
        menubarProps,
        toolbaritem
    );
    const button = ztoolkit.UI.appendElement(
        /*         {
                namespace: "html",
                tag: "button",
                id: config.addonRef + "_imgTableTool2",
                classList: ["zotero-tb-button"],
                styles: {
                    backgroundImage: `url(chrome://${config.addonRef}/content/icons/favicon.png)`,
                    backgroundSize: "18px 18px",
                    backgroundPosition: "10% center",
                    backgroundRepeat: "no-repeat",
                    //float: "right",
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "48px",
                    padding: "4px 3px 4px 22px",
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
                children: [dropmarker]
        
            } */
        buttonProps,
        topTool
    ) as HTMLButtonElement;
    ztoolkit.UI.appendElement(
        makeTagElementProps({ tag: "toolbarseparator" }), parent
    );
}


export function makeTagElementProps(option: TagElementProps): TagElementProps {
    const preDefinedObj = {
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "xul",
    };
    const tempObj = Object.assign(preDefinedObj, option);
    return tempObj;
}

export function ssmakeElementProps(option: ElementProps): ElementProps {
    const preDefinedObj = {
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "xul",
    };
    const tempObj = Object.assign(preDefinedObj, option);
    return tempObj;
}

/* {
    {
        tag: string;
        id?: string;
        namespace?: "xul" | "html" | "svg";
        classList?: Array<string>;
        styles?: Partial<CSSStyleDeclaration>;
        properties?: {
            [key: string]: unknown;
        };
        directAttributes?: {
            [key: string]: string | boolean | number | null | undefined;
        };
        attributes?: {
            [key: string]: string | boolean | number | null | undefined;
        };
        listeners?: Array<{
            type: string;
            listener: EventListenerOrEventListenerObject | ((e: Event) => void) | null | undefined;
            options?: boolean | AddEventListenerOptions;
        }>;
        children?: Array<TagElementProps>;
        ignoreIfExists?: boolean;
        skipIfExists?: boolean;
        removeIfExists?: boolean;
        checkExistenceParent?: HTMLElement;
        customCheck?: (doc: Document, options: ElementProps) => boolean;
        subElementOptions?: Array<TagElementProps>;
        //默认false
        enableElementRecord?: boolean;
        //默认false
        enableElementJSONLog?: boolean;
        enableElementDOMLog?: boolean;
    }
} */

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
    const syncFontInfoMenuitemArr = [
        {
            label: "info-syncFontInfo",
            func: syncFontInfo,
            args: []
        },
    ];
    const insertImgMenuitemArr = [
        {
            label: "info-insertImg",
            func: insertImg,
            args: []
        },
    ];

    //子菜单内容组成数组 menuitemGroupArr 作为 makeClickButton 的参数
    const menuitemGroupArr = [
        imgTableSingleObjMenuitemArr,
        imgTableAllObjMenuitemArr,
        pdf2NoteMenuitemArr,
        translateOnePdfMenuitemArr,
        fontMenuitemArr,
        syncFontInfoMenuitemArr,
        insertImgMenuitemArr,
        viewImgMenuArr
    ];
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

const insertImg = async (noteID?: number) => {
    if (!addon.data.noteMaker) {
        const option = {
            title: "Font Style Collection",
            collectionName: "fontCollection",
        };
        const noteMaker = new NoteMaker(option);
        let note = await noteMaker.getFontNote();
        if (!note) {
            note = Zotero.getActiveZoteroPane().getSelectedItems()[0];
        }
        if (!note && noteID) {

            const note = Zotero.Items.get(noteID);
        }
        if (!note.isNote()) return;
        addon.data.noteMaker = noteMaker;
    }
    const fontSimpleInfoArrs = (await getFontInfo()).fontSimpleInfoArr;
    const option: any = {};
    for (const fontSimpleInfo of fontSimpleInfoArrs) {
        if (fontSimpleInfo.charImg && fontSimpleInfo.charImg.base64) {
            const insertContent = await addon.data.noteMaker!.getImgHtml(fontSimpleInfo.charImg);
            const key = fontSimpleInfo.fontName;
            option[key] = insertContent;
        }
    }
    await addon.data.noteMaker!.tableInsertContent(option, "markerChar");
};
//主要功能：生成笔记，新字体存盘
const fontCheckCallBack = async () => {
    let fontsSimpleInfo;
    let isReadDisk = false;
    let hasThisPdfFont = false;
    let thisPdfFonts: any[] = [];
    let pdfItemIDChecked = false;
    let lengthBeforCheck = 0;
    let pdfItemID: number;
    let hasFontsNoImg: boolean = false;
    if (addon.data.globalObjs?.fontsSimpleInfo) {
        fontsSimpleInfo = addon.data.globalObjs?.fontsSimpleInfo;
    } else {
        fontsSimpleInfo = await readJsonFromDisk(fontStyleFileName);
        if (fontsSimpleInfo) {
            isReadDisk = true;
            pdfItemID = Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.data.itemID;
            //const pdfItemID = Zotero_Tabs._tabs.filter((tab: any) => tab.id == Zotero_Tabs.selectedID)[0].data.itemID;
            pdfItemIDChecked = (Object.values(fontsSimpleInfo) as any).some((fontSimpleInfo: any) => fontSimpleInfo.pdfItemID == pdfItemID);
            lengthBeforCheck = Object.keys(fontsSimpleInfo).length;
            addon.data.globalObjs.fontsSimpleInfo = fontsSimpleInfo;
        }
    }
    if (fontsSimpleInfo) {
        thisPdfFonts = Object.values(fontsSimpleInfo).filter((fontSimpleInfo: any) => fontSimpleInfo.pdfItemID == pdfItemID);
        for (const obj of thisPdfFonts) {
            const charPath = getPathDir(obj.fontName, addonStorageDir + "\\fontImg\\", ".png").path;
            if (await OS.File.exists(charPath)) {
                fontsSimpleInfo.hasFontImg = true;
            } else {
                fontsSimpleInfo.hasFontImg = false;
                hasFontsNoImg = true;
            }
        }
    }
    //新字体或图片不存在则获取字体信息
    if (!pdfItemIDChecked || hasFontsNoImg) {
        const fontSimpleInfoArrs = (await getFontInfo(thisPdfFonts)).fontSimpleInfoArr;
        //await clearCanvas();
        if (fontSimpleInfoArrs.length) {
            const boldRedPointArr = fontSimpleInfoArrs.map((obj: any) => obj.redPointNumbers);
            await redPointCollectToDisk(boldRedPointArr);
            fontsSimpleInfo = await saveDiskFontSimpleInfo(fontSimpleInfoArrs, fontsSimpleInfo);
            addon.data.globalObjs.fontsSimpleInfo = fontsSimpleInfo;
            await makeFontInfoNote(fontsSimpleInfo, boldRedPointArr);
            const lengthAfterSave = Object.keys(fontsSimpleInfo).length;
            if (lengthBeforCheck != lengthAfterSave) {
                hasThisPdfFont = true;
            }
        }
        //生成对话框内容
        const fileInfo = await getFileInfo(getPathDir(fontStyleFileName).path);
        let fileSize;
        if (!fileInfo) {
            fileSize = 0;
        } else {
            fileSize = fileInfo.size;
        }
        const textJsonStringify = JSON.stringify(
            fontsSimpleInfo,
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


export const makeClickButton = (idPostfix: string, menuitemGroupArr: any[][], thisButton: HTMLButtonElement) => {
    const menupopup: any = makeMenupopup(idPostfix);
    menuitemGroupArr.filter((menuitemGroup: any[], i: number) => {
        menuitemGroup.map((e: any) => makeMenuitem(e, menupopup));
        //首个菜单组之后，每组均添加分割条，最后一组之后不添加
        if (i < menuitemGroupArr.length - 1) {
            menuseparator(menupopup);
        }
    });
    menupopup.openPopup(thisButton, 'after_start', 0, 0, false, false);
};
export const menuseparator = (menupopup: any) => {
    ztoolkit.UI.appendElement({
        tag: "menuseparator",
        namespace: "xul",
    }, menupopup);
};

export const makeMenupopup = (idPostfix: string) => {
    const menupopup = ztoolkit.UI.appendElement({
        tag: "menupopup",
        id: config.addonRef + idPostfix,
        namespace: "xul",
        children: [
        ]
    }, document.querySelector("#browser")!) as XUL.MenuPopup;
    return menupopup;
};


export const makeMenuitem = (option: { label: string, func: (...args: any[]) => any | void, args: any[]; }, menupopup: any,) => {
    const makeMenuitem = ztoolkit.UI.appendElement({
        tag: "menuitem",
        namespace: "xul",
        attributes: {
            label: getString(option.label),
        }
    }, menupopup);
    /* makeMenuitem.addEventListener("command", () => {
        option.func(...option.args);
    }); */
    const func = option.func;
    if (judgeAsync(func)) {
        makeMenuitem.addEventListener("command", async () => {
            await func(...option.args);
        });
    } else {
        makeMenuitem.addEventListener("command", () => {
            option.func(...option.args);
        });
    }
};


export const judgeAsync = (fun: any) => {
    const AsyncFunction = (async () => { }).constructor;
    return fun instanceof AsyncFunction;
}




