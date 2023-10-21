import { fullTextTranslate } from './fullTextTranslate';


export async function prepareReader(result: "beforReaderInit" | "waitForReader" | "initializedReader" | "initializedPDFView" | "initializedPDFViewerApplication" | "pdfLoaded" | "firstPageLoaded"
  | "pagesLoaded"
  , itmeID?: number) {
  let tabID;
  //参数itemID未传递
  if (!itmeID) {
    //如果页面不是 pdf reader，则打开选中的 pdf 或条目下的首个 pdf
    if (Zotero_Tabs.selectedID == "zotero-pane") {
      const item = Zotero.getActiveZoteroPane().getSelectedItems()[0];
      if (!item.isPDFAttachment()) {
        itmeID = item.getAttachments().filter(id => Zotero.Items.get(id).isPDFAttachment())[0];
      } else {
        itmeID = item.id;
      }
      if (!Zotero_Tabs.getTabIDByItemID(itmeID)) {
        await Zotero.Reader.open(itmeID);
      }
      //todo 检查其他打开的 pdf reader
      tabID = Zotero_Tabs.getTabIDByItemID(itmeID);
    } else {
      if (Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.type === 'reader') {
        //所选标签即为pdf
        tabID = Zotero_Tabs.selectedID;
      } else {
        //查找pdf标签，找不到则退出      
        const tab = Zotero_Tabs._tabs.find(x => x.type === 'reader');
        if (tab) {
          tabID = tab.id;
        } else {
          const item = Zotero.getActiveZoteroPane().getSelectedItems()[0];
          itmeID = item.getAttachments().filter(id => Zotero.Items.get(id).isPDFAttachment())[0];
          await Zotero.Reader.open(itmeID);
          tabID = Zotero_Tabs.getTabIDByItemID(itmeID);
        }
      }
    }
  } else {
    //传递了参数itemID，如果 pdf 尚未打开    
    if (!Zotero_Tabs.getTabIDByItemID(itmeID)) {
      //判断是否是 pdf ，不是则获取第一个 pdf 的itemID
      if (!Zotero.Items.get(itmeID).isPDFAttachment()) {
        const item = Zotero.Items.get(itmeID);
        itmeID = item.getAttachments().filter(id => Zotero.Items.get(id).isPDFAttachment())[0];
        if (!Zotero_Tabs.getTabIDByItemID(itmeID)) {
          //打开 pdf
          await Zotero.Reader.open(itmeID);
        }
      }
    }
    tabID = Zotero_Tabs.getTabIDByItemID(itmeID);
  }

  Zotero_Tabs.select(tabID as string);
  const reader = Zotero.Reader.getByTabID(tabID as string) as any;
  if (result == "beforReaderInit") {
    return getObj;
  }
  await reader._waitForReader();
  if (result == "waitForReader") {
    return getObj;
  }
  await reader._initPromise;
  if (result == "initializedReader") {
    return getObj;
  }
  const internalReader = reader._internalReader;
  const PDFView = internalReader._primaryView;
  const pdfPages = PDFView._pdfPages;
  await PDFView.initializedPromise;
  if (result == "initializedPDFView") {
    return getObj;
  }
  const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
  await PDFViewerApplication.initializedPromise;
  const pdfViewer = PDFViewerApplication.pdfViewer;
  if (result == "initializedPDFViewerApplication") {
    return getObj;
  }
  await PDFViewerApplication.pdfLoadingTask.promise;
  const pdfDocument = PDFViewerApplication.pdfDocument;
  const pages = pdfViewer._pages;
  if (result == "pdfLoaded") {
    return getObj;
  }
  await PDFViewerApplication.pdfViewer.firstPagePromise;
  if (result == "firstPageLoaded") {
    return getObj;
  }
  await PDFViewerApplication.pdfViewer.pagesPromise;
  if (result == "pagesLoaded") {
    return getObj;
  } else {
    return getObj;
  }

  function getObj(obj: "reader" | "internalReader" | "PDFView"
    | "PDFViewerApplication" | "pdfViewer" | "pages" | "pdfPages" | "pdfDocument") {
    switch (obj) {
      case "reader": return reader;
      case "internalReader": return internalReader;
      case "PDFView": return PDFView;
      case "pdfViewer": return pdfViewer;
      case "pages": return pages;
      case "pdfPages": return pdfPages;
      case "pdfDocument": return pdfDocument;
      case "PDFViewerApplication": return PDFViewerApplication;
      default:
        return reader;
    }
  };


}



