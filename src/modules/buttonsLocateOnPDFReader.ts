import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getFileInfo, getPathDir, readJsonFromDisk, saveJsonToDisk } from "../utils/prefs";
import { fontStyleFileName, fontSimpleInfoToDisk, getFontInfo } from "./fontDetect";
import { fullTextTranslate } from "./fullTextTranslate";
import { clearAnnotations, imageToAnnotation } from "./imageToAnnotation";
import { prepareReader } from "./prepareReader";


export let title: string;
let pdfItemID: number;
const children = [
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
];

const buttonBackground = [
    {
        tag: "span",
        classList: ["button-background"],

    }
];
export async function pdfButton() {
    const document1 = (await prepareReader("pagesLoaded"))("document");

    /* const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance;
    pdfItemID = reader.itemID!;
    const judge = reader.itemID == reader._item.id;
    let _window: any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    while (!(_window = reader?._iframeWindow?.wrappedJSObject)) {
        await Zotero.Promise.delay(10);
    } */
    const tab = Zotero_Tabs._getTab(Zotero_Tabs.selectedID);
    title = tab.tab.title;
    title = title.replace(/( - [^-]+){1,2}$/m, "");
    //const parent = _window.document.querySelector("#reader-ui .toolbar .end")!;
    const parent = document1.querySelector("#reader-ui .toolbar .end")!;
    const ref = parent.querySelector("#viewFind") as HTMLDivElement;
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
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    menupopup.openPopup(button, 'after_start', 0, 0, false, false);
                }
            },
        ],
        children: children
    }, ref) as HTMLButtonElement;

}

export async function fontCheck() {
    const document1 = (await prepareReader("pagesLoaded"))("document");
    const parent = document1.querySelector("#reader-ui .toolbar .center")!;
    const ref = parent.querySelector(".highlight") as HTMLDivElement;
    const dialogID = "dialog-fontInfo";
    const openArgs = {
        title: `${config.addonRef}`,
    };

    //如果本插件对话框存在，则视为dialogHelperFont，无需重复创建。之后再设置数据
    if (!addon.data.dialog) {
        const dialogHelperFont = new ztoolkit.Dialog(1, 1)
            .addCell(0, 0,
                {
                    tag: "textarea",
                    namespace: "html",
                    id: dialogID,
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
                    await fontCheckCallBack();
                }
            },
        ],
        children: buttonBackground,

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
        const dialogHelperFont = addon.data.dialog!;
        if (dialogHelperFont.window) {
            if (dialogHelperFont.window.closed) {
                dialogHelperFont.setDialogData(dialogData).open(openArgs.title);

            } else {
                dialogHelperFont.window.focus();
                const textarea = dialogHelperFont.window.document.querySelector("#" + dialogID);
                textarea!.innerHTML = content;
            };
        } else {
            dialogHelperFont.setDialogData(dialogData).open(openArgs.title);
        }

    };
}





export async function clearAnnotationsButton() {
    const document1 = (await prepareReader("pagesLoaded"))("document");
    const tab = Zotero_Tabs._getTab(Zotero_Tabs.selectedID);
    title = tab.tab.title;
    title = title.replace(/( - [^-]+){1,2}$/m, "");
    const parent = document1.querySelector("#reader-ui .toolbar .center")!;
    const ref = parent.querySelector(".highlight") as HTMLDivElement;

    const menuitemArr = [
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

    const clearAnnotationsButton = ztoolkit.UI.insertElementBefore({
        enableElementJSONLog: false,
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "html",
        tag: "button",
        id: config.addonRef + "_imgTableTool",
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
            title: getString("info-imgTableTool"),
            tabindex: "-1",
        },
        /* listeners: [
            {
                type: "click",
                listener: () => {
                    clearAnnotations();
                }
            },
        ], */
        listeners: [
            {
                type: "click",
                listener: () => {
                    const menupopup: any = makeMenupopup("_menupopupImgTableTool");
                    /* const menupopup: any = ztoolkit.UI.appendElement({
                        tag: "menupopup",
                        id: config.addonRef + "_menupopupImgTableTool",
                        namespace: "xul",
                        children: [
                        ]
                    }, document.querySelector("#browser")!) as XUL.MenuPopup; */
                    // 1. add Img and Table to Annotation

                    const menuitem0 = ztoolkit.UI.appendElement({
                        tag: "menuitem",
                        attributes: {
                            label: getString("menuitem-addImgTableAnnotation"),
                        }
                    }, menupopup);
                    menuitem0.addEventListener("command", async () => {
                        await imageToAnnotation();
                    });
                    ztoolkit.UI.appendElement({
                        tag: "menuseparator",
                    }, menupopup);
                    menuitemArr.map((e: any) => makeMenuitem(e, menupopup));
                    ztoolkit.UI.appendElement({
                        tag: "menuseparator",
                    }, menupopup);
                    const menuitem2 = ztoolkit.UI.appendElement({
                        tag: "menuitem",
                        attributes: {
                            label: getString("menuitem-hiddenAllAnnotations"),
                        }
                    }, menupopup);
                    menuitem2.addEventListener("command", () => {
                        clearAnnotations("hidden", "all");
                    });
                    const menuitem3 = ztoolkit.UI.appendElement({
                        tag: "menuitem",
                        attributes: {
                            label: getString("menuitem-showAllAnnotations"),
                        }
                    }, menupopup);
                    menuitem3.addEventListener("command", () => {
                        clearAnnotations("show", "all");
                    });
                    // 2. 删除所有注释
                    const menuitem1 = ztoolkit.UI.appendElement({
                        tag: "menuitem",
                        attributes: {
                            label: getString("menuitem-deleteAllAnnotations"),
                        }
                    }, menupopup);
                    menuitem1.addEventListener("command", () => {
                        clearAnnotations("delete", "all");
                    });
                    menupopup.openPopup(clearAnnotationsButton, 'after_start', 0, 0, false, false);
                }
            },
        ],
        children: children

    }, ref) as HTMLButtonElement;

}

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

