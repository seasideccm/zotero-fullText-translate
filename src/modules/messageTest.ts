import { saveJsonToDisk } from "../utils/prefs";

export async function findFontOnPdfLoading() {

    //window
    //ChromeWindow chrome://zotero/content/zoteroPane.xhtml
    //window.document
    //HTMLDocument chrome://zotero/content/zoteroPane.xhtml
    window.addEventListener('DOMContentLoaded', _messageHandler);
    //_postMessage({ action: 'initialized' });
}

/* const _postMessage=(message:any)=> {
    window.postMessage( message , '*');
} */

const _messageHandler = async (event: Event) => {
    function savefont(app: any) {
        let obj2;
        if (app.pdfLoadingTask._transport.commonObjs) {
            const obj = app.pdfLoadingTask._transport.commonObjs;
            obj2 = JSON.parse(JSON.stringify(obj));
        }
        saveJsonToDisk(obj2, "commonObjs");
    }
    function onMes() {

        ztoolkit.log("截获信息");

    }
    const type = event.type;
    ztoolkit.log("event.type: ", type, "target:", event.target);
    if (event.target && (event.target as any).URL == "resource://zotero/reader/pdf/web/viewer.html") {
        const wr = (Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)._iframeWindow as any).wrappedJSObject;
        if (!wr.PDFViewerApplication) {
            await wr._reader.initializedPromise;
        }
        const app = wr.PDFViewerApplication;
        //await app.pdfLoadingTask.promise;
        ztoolkit.log("PDFViewerApplication.pdfLoadingTask._transport: ");
        while (!app.pdfLoadingTask) {
            Zotero.Promise.delay(10);
        }
        while (!app.pdfLoadingTask._transport) {
            Zotero.Promise.delay(10);
        }
        while (!app.pdfLoadingTask._transport.commonObjs) {
            Zotero.Promise.delay(10);
        }
        /* while (!Object.keys(app.pdfLoadingTask._transport.commonObjs).length) {
            Zotero.Promise.delay(10);
        } */

        const length = Object.keys(app.pdfLoadingTask._transport.commonObjs).length;
        /* savefont(app); */
        ztoolkit.log("PDFViewerApplication.pdfLoadingTask._transport: ", app.pdfLoadingTask._transport.commonObjs, JSON.stringify(app.pdfLoadingTask._transport.commonObjs));

        //const obj = app.pdfLoadingTask._transport.commonObjs;




    } else {
        ztoolkit.log("This isn't PDFViewerApplication");
    }

}

/*     const tab = Zotero_Tabs._getTab(Zotero_Tabs.selectedID);
    while (tab.tab.type != "reader") {
        Zotero.Promise.delay(100);
    } */

/*     const _reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
    ztoolkit.log("_reader._isReaderInitialized：", _reader._isReaderInitialized);
    let loop = 0;
    while (!_reader._iframeWindow) {
 
        loop += 1;
        ztoolkit.log("loop: ", loop);
        //Zotero.Promise.delay(100);
        await _reader._waitForReader();
    } */
/*     const wr = (_reader._iframeWindow as any).wrappedJSObject;
const wr = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)._iframeWindow.wrappedJSObject
 
    loop = 0;
    wr.addEventListener('DOMContentLoaded', async (event: Event) => {
        ztoolkit.log("wr event.type: ", event.type);
        loop = 0;
 
    }); */
/*     while (!wr.PDFViewerApplication) {
 
        await Zotero.Promise.delay(100);
        loop++;
        ztoolkit.log("loop: ", loop);
 
    }
    const testPDFViewerApplication = wr.PDFViewerApplication; */

/*     async function await_reader(_reader: any) {
        if (_reader) {
            return;
        }
        let loop = 0;
        while (_reader) {
            if (loop >= 500) {
                throw new Error('Waiting for pdfViewer failed');
            }
            await Zotero.Promise.delay(100);
            loop++;
        }
 
    }
    //await wr.PDFViewerApplication.initializedPromise;
    loop = 0;
    while (!wr[0]) {
 
        await await_reader(!wr[0]);
        loop++;
        ztoolkit.log("loop: ", loop);
 
    } */



/* wr[0].addEventListener('DOMContentLoaded', async (event: Event) => {
    ztoolkit.log("event.type: ", type);
    loop = 0;
    while (!wr.if) {
        loop += 1;
        ztoolkit.log("loop: ", loop);
        await Zotero.Promise.delay(100);
        //await _reader._waitForReader();
    } */



/*
 
 
wr.addEventListener('DOMContentLoaded', (event: Event) => {
    const type = event.type;
    ztoolkit.log("event.type: ", type);
    while (!wr.if) {
        Zotero.Promise.delay(100);
    }
    const _viewer = wr.if;
    _viewer.addEventListener('DOMContentLoaded', (event: Event) => {
        const type = event.type;
        ztoolkit.log("event.type: ", type);
    }); 
});*/


