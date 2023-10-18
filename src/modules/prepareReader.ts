import { fullTextTranslate } from './fullTextTranslate';


export async function prepareReader(result: "waitForReader" | "initializedReader" | "initializedPrimaryView" | "initializedPDFViewerApplication" | "pdfLoaded"
  | "pagesLoaded" | "pages" | "pdfView" | "internalReader"
  , itmeID?: number) {
  let tabID;
  //参数itemID未传递
  if (!itmeID) {
    //如果页面不是 pdf reader，则打开选中的 pdf 或条目下的首个 pdf
    if (Zotero_Tabs.selectedID == "zotero-pane") {
      const item = Zotero.getActiveZoteroPane().getSelectedItems()[0];
      itmeID = item.getAttachments().filter(id => Zotero.Items.get(id).isPDFAttachment())[0];
      if (!Zotero_Tabs.getTabIDByItemID(itmeID)) {
        await Zotero.Reader.open(itmeID);
      }
      //todo 检查其他打开的 pdf reader
      tabID = Zotero_Tabs.getTabIDByItemID(itmeID);
    } else {
      tabID = Zotero_Tabs.selectedID;
    }
  } else {
    //传递了参数itemID，如果 pdf 尚未打开    
    if (!Zotero_Tabs.getTabIDByItemID(itmeID)) {
      //判断是否是 pdf ，不是则获取第一个 pdf 的itemID
      if (!Zotero.Items.get(itmeID).isPDFAttachment()) {
        const item = Zotero.Items.get(itmeID);
        itmeID = item.getAttachments().filter(id => Zotero.Items.get(id).isPDFAttachment())[0];
      }
      //打开 pdf
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
  if (result == "pages") {
    const pages = PDFViewerApplication.pdfViewer._pages;
    return pages;
  }
  if (result == "pdfView") {
    return reader._internalReader._primaryView;
  }
  if (result == "internalReader") {
    return reader._internalReader;
  }
}

