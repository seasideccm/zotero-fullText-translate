import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { fullTextTranslate } from "./fullTextTranslate";
import { saveJsonToDisk } from "../utils/prefs";
export const pdfFontInfo: {
    [key: string]: string;
} = {};
let title: string;
export function registerNotifier() {
    const callback = {
        notify: async (
            event: string,
            type: string,
            ids: number[] | string[],
            extraData: { [key: string]: any; },
        ) => {
            if (!addon?.data.alive) {
                unregisterNotifier(notifierID);
                return;
            }
            onNotify(event, type, ids, extraData);
        },
    };

    // Register the callback in Zotero as an item observer
    /*     const notifierID = Zotero.Notifier.registerObserver(callback, [
            "tab",
            "item",
            "file",
        ]); */
    const notifierID = Zotero.Notifier.registerObserver(callback);
    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener(
        "unload",
        (e: Event) => {
            unregisterNotifier(notifierID);
        },
        false,
    );
}

export function unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
}

async function savefont(fontObj: any) {
    //const item = Zotero.getActiveZoteroPane().getSelectedItems()[0]
    //const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance;
    //const pdfItem = reader._item;
    //const pdfPath = Zotero.Attachments.getStorageDirectory(pdfItem).path + "\\";
    //const tab = Zotero_Tabs._getTab(Zotero_Tabs.selectedID);

    const saveFileName = title + "_pdfFontInfo";
    //const saveFileName = new Date().getTime().toString() + "_pdfFontInfo";
    saveJsonToDisk(fontObj, saveFileName);
    ztoolkit.log("saveFileName:", saveFileName);
}

async function onNotify(
    event: string,
    type: string,
    ids: Array<string | number>,
    extraData: { [key: string]: any; },
) {
    // You can add your code to the corresponding notify type
    ztoolkit.log("notify is coming【", "event:", event, "type:", type, "ids:", ids, "extraData:", extraData + "】");
    if (
        event == "select" &&
        type == "tab" &&
        extraData[ids[0]].type == "reader"
    ) {
        pdfButton();
        pdfFont();
    } else if (
        event == "close" &&
        type == "tab" &&
        ids[0] != "zotero-pane"
    ) {

        savefont(pdfFontInfo);
        ztoolkit.log("保存字体信息");
    } else {
        return;
    }
}

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
        ignoreIfExists: true,
        namespace: "html",
        tag: "button",
        id: config.addonRef,
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
            title: config.addonName,
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
        children: [
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
        ]
    }, ref) as HTMLButtonElement;

}

export async function pdfFont() {

    const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance;
    await reader._waitForReader;
    let port;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    while (!(port = reader._iframeWindow?.wrappedJSObject?.PDFViewerApplication?.pdfLoadingTask?._worker?._port)) {
        await Zotero.Promise.delay(0.5);
    }
    port.addEventListener("message", (event: MessageEvent) => {
        //ztoolkit.log(event.target, event.data.data);
        if (event.data.data && event.data.data[1] == "Font") {
            const loadedName = event.data.data[2].loadedName;
            const name = event.data.data[2].name;
            pdfFontInfo[loadedName] = name;
            ztoolkit.log("pdfLoadingTask._worker._port:", "loadedName", loadedName, ", name:", name);
        }
    });
}

