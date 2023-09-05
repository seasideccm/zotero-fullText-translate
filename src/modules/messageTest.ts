

export function findFontOnPdfLoading() {
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
    const type = event.type;
    ztoolkit.log("event.type: ", type, "target:", event.target);

    const tab = Zotero_Tabs._getTab(Zotero_Tabs.selectedID);
    while (tab.tab.type != "reader") {
        Zotero.Promise.delay(100);
    }

    const _reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
    ztoolkit.log("_reader._isReaderInitialized：", _reader._isReaderInitialized);
    let loop = 0;
    while (!_reader._iframeWindow) {

        loop += 1;
        ztoolkit.log("loop: ", loop);
        //Zotero.Promise.delay(100);
        await _reader._waitForReader();
    }
    const wr = (_reader._iframeWindow as any).wrappedJSObject;
    //await wr.PDFViewerApplication.initializedPromise;

    wr[0].addEventListener('DOMContentLoaded', async (event: Event) => {
        ztoolkit.log("event.type: ", type);
        loop = 0;
        while (!wr.if) {
            loop += 1;
            ztoolkit.log("loop: ", loop);
            await Zotero.Promise.delay(100);
            //await _reader._waitForReader();
        }

    });

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


};