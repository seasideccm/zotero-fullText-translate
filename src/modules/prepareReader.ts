import { fullTextTranslate } from './fullTextTranslate';


export async function prepareReader(result: "waitForReader" | "initializedReader" | "initializedPrimaryView" | "initializedPDFViewerApplication" | "pdfLoaded" | "pagesLoaded", itmeID?: number) {
  let tabID;
  if (!itmeID) {
    tabID = Zotero_Tabs.selectedID;
    if (tabID == "zotero-pane") {
      const pdfIDs = fullTextTranslate.getPDFs();
      await Zotero.Reader.open(pdfIDs[0]);
      tabID = Zotero_Tabs.selectedID;
    }
  } else {
    if (!Zotero_Tabs.getTabIDByItemID(itmeID)) {
      await Zotero.Reader.open(itmeID);
    }
    tabID = Zotero_Tabs.getTabIDByItemID(itmeID);
  }
  Zotero_Tabs.select(tabID);
  const reader = Zotero.Reader.getByTabID(tabID) as any;
  if (!result) {
    return reader;
  }
  await reader._waitForReader();
  if (result == "waitForReader") {
    return reader;
  }
  await reader._initPromise;
  if (result == "initializedReader") {
    return reader;
  }
  await reader._internalReader._primaryView.initializedPromise;
  if (result == "initializedPrimaryView") {
    return reader;
  }
  const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
  await PDFViewerApplication.initializedPromise;
  if (result == "initializedPDFViewerApplication") {
    return PDFViewerApplication;
  }
  await PDFViewerApplication.pdfLoadingTask.promise;
  if (result == "pdfLoaded") {
    return PDFViewerApplication;
  }
  await PDFViewerApplication.pdfViewer.pagesPromise;
  if (result == "pagesLoaded") {
    return PDFViewerApplication;
  }
}

