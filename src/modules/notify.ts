import { clearAnnotationsButton, fontCheck, pdfButton } from "./pdfButton";

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

async function onNotify(
    event: string,
    type: string,
    ids: Array<string | number>,
    extraData: { [key: string]: any; },
) {
    // You can add your code to the corresponding notify type
    //ztoolkit.log("notify is coming【", "event:", event, "type:", type, "ids:", ids, "extraData:", extraData + "】");
    if (
        event == "select" &&
        type == "tab" &&
        extraData[ids[0]].type == "reader"
    ) {
        pdfButton();
        clearAnnotationsButton();
        fontCheck();
    }
}





