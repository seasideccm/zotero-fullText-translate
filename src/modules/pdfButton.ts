import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { fullTextTranslate } from "./fullTextTranslate";
import { clearAnnotations, imageToAnnotation } from "./imageToAnnotation";

export let title: string;

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
            position: "relative",
            verticalAlign: "top",
            width: "7px",
            zIndex: "1"
        }
    }
];
export async function pdfButton() {
    const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance;
    let _window: any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    while (!(_window = reader?._iframeWindow?.wrappedJSObject)) {
        await Zotero.Promise.delay(10);
    }
    const tab = Zotero_Tabs._getTab(Zotero_Tabs.selectedID);
    title = tab.tab.title;
    title = title.replace(/( - [^-]+){1,2}$/m, "");
    const parent = _window.document.querySelector("#reader-ui .toolbar .end")!;
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
    const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance;
    let _window: any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    while (!(_window = reader?._iframeWindow?.wrappedJSObject)) {
        await Zotero.Promise.delay(10);
    }
    const parent = _window.document.querySelector("#reader-ui .toolbar .center")!;
    const ref = parent.querySelector(".highlight") as HTMLDivElement;
    const dialogHelper = new ztoolkit.Dialog(2, 1).addCell(0, 0, {
        tag: "h3",
        properties: { innerHTML: "教程" },
    }).addCell(1, 0,
        {
            tag: "textarea",
            namespace: "html",
            id: "dialog-input",
            attributes: {
                "style": "width: 100%; height: 300px;",
            },
        },
        true
    );
    const dialogButton = ztoolkit.UI.insertElementBefore({
        enableElementJSONLog: false,
        enableElementDOMLog: false,
        ignoreIfExists: true,
        namespace: "html",
        tag: "button",
        id: config.addonRef + "_dialog",
        classList: ["toolbarButton"],
        styles: {
            // 解决图标
            width: "45px",
            border: "2px solid #4812c6"

        },
        properties: {
            innerText: "框"
        },
        attributes: {
            title: "对话框",
            tabindex: "-1",
        },

        listeners: [
            {
                type: "click",
                listener: () => {
                    dialogHelper.open(`${config.addonRef}`,
                        {
                            width: 400,
                            height: 450,
                            resizable: true,
                            centerscreen: true,
                        }
                    );
                }
            },
        ],


    }, ref) as HTMLButtonElement;


}

export async function clearAnnotationsButton() {
    const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance;
    let _window: any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    while (!(_window = reader?._iframeWindow?.wrappedJSObject)) {
        await Zotero.Promise.delay(10);
    }
    const tab = Zotero_Tabs._getTab(Zotero_Tabs.selectedID);
    title = tab.tab.title;
    title = title.replace(/( - [^-]+){1,2}$/m, "");
    const parent = _window.document.querySelector("#reader-ui .toolbar .center")!;
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
            title: config.addonName + "-imgTableTool",
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

