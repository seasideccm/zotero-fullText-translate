import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { fullTextTranslate } from "./fullTextTranslate";



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
    const notifierID = Zotero.Notifier.registerObserver(callback, [
        "tab",
        "item",
        "file",
    ]);

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener(
        "unload",
        (e: Event) => {
            unregisterNotifier(notifierID);
        },
        false,
    );
}

/* export function NotifierCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Open Tab Detected!",
        type: "success",
        progress: 100,
      })
      .show();
  } */

export function unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
}



async function onNotify(
    event: string,
    type: string,
    ids: Array<string | number>,
    extraData: { [key: string]: any; },
) {
    // You can add your code to the corresponding notify type
    ztoolkit.log("notify", event, type, ids, extraData);
    if (
        event == "select" &&
        type == "tab" &&
        extraData[ids[0]].type == "reader"
    ) {
        pdfButton();
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