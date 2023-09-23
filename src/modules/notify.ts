
import { saveJsonToDisk, readJsonFromDisk } from "../utils/prefs";
import { pdfFont, pdfFontInfo } from "./fontDetect";
import { pdfButton, title } from "./pdfButton";



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
    const fontSaved = await readJsonFromDisk("fontCollection") as string[];
    const fonts = Object.values(fontObj) as string[];
    let newArr: string[];
    if (fontSaved && fontSaved.length) {
        newArr = [...new Set(fontSaved.concat(fonts))];

    } else {
        newArr = [...new Set(fonts)];
    }
    if (newArr.length) {
        saveJsonToDisk(newArr, "fontCollection");
    }
    /* const saveFileName = title + "_pdfFontInfo";
    saveJsonToDisk(fontObj, saveFileName);
    ztoolkit.log("saveFileName:", saveFileName); */
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





