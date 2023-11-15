import { fullTextTranslate } from "./fullTextTranslate";



export async function prepareReader(result: "beforReaderInit" | "waitForReader" | "initializedReader" | "initializedPDFView" | "initializedPDFViewerApplication" | "pdfLoaded" | "firstPageLoaded"
  | "pagesLoaded"
  , itmeID?: number) {
  let tabID;
  let n = 0;
  while (!Zotero_Tabs.selectedID && n++ < 50) {
    Zotero.Promise.delay(50);
  }
  //参数itemID未传递
  if (!itmeID) {
    //如果页面不是 pdf reader，则打开选中的 pdf 或条目下的首个 pdf
    if (Zotero_Tabs.selectedID == "zotero-pane") {
      const item = Zotero.getActiveZoteroPane().getSelectedItems()[0];
      if (!item || !item.isPDFAttachment()) {
        if (item) {
          itmeID = item.getAttachments().filter(id => Zotero.Items.get(id).isPDFAttachment())[0];
        }
        //选中的条目没有pdf，查看打开的标签是否有reader，如果有则选择最后激活的reader
        if (!itmeID) {
          itmeID = getLatestReader();

        }
      } else {
        itmeID = item.id;
      }
      if (!itmeID) {
        fullTextTranslate.showInfo("info-noItemSelectedNoReaderOpened", 3000);
        return;
      }

      await Zotero.Reader.open(itmeID);

      //todo 检查其他打开的 pdf reader
      tabID = Zotero_Tabs.getTabIDByItemID(itmeID);
    } else {
      if (Zotero_Tabs._getTab(Zotero_Tabs.selectedID).tab.type === 'reader') {
        //所选标签即为pdf
        tabID = Zotero_Tabs.selectedID;
      } else {
        //查找pdf标签，找不到则退出      
        const tab = getLatestTab(true);
        //Zotero_Tabs._tabs.find(x => x.type === 'reader');
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


  let reader: any;
  n = 0;
  let time;
  if (result == "pagesLoaded") {
    time = 500;
  } else {
    time = 50;
  }
  while (!(reader = Zotero.Reader.getByTabID(tabID as string)) && n < 200) {
    Zotero.Promise.delay(time);
    if (!reader && ++n % 20 == 0) {
      const sec = (n * time / 1000).toFixed(2);
      ztoolkit.log(`prepare reader... ${sec} seconds past.`);
    }
    if (reader) {
      const sec = (n * time / 1000).toFixed(2);
      ztoolkit.log(`Spend ${sec} seconds reader loaded.`);
    }
  }

  Zotero_Tabs.select(tabID as string);

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
  const document = (reader._iframeWindow as any).wrappedJSObject.document;
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
    | "PDFViewerApplication" | "pdfViewer" | "pages" | "pdfPages"
    | "pdfDocument" | "pdfItemID" | "document" | "documentPDFView") {
    switch (obj) {
      case "reader": return reader;
      case "internalReader": return internalReader;
      case "PDFView": return PDFView;
      case "pdfViewer": return pdfViewer;
      case "pages": return pages;
      case "pdfPages": return pdfPages;
      case "pdfDocument": return pdfDocument;
      case "PDFViewerApplication": return PDFViewerApplication;
      case "pdfItemID": return reader._item.id;
      case "document": return document;
      case "documentPDFView": return PDFView._iframeWindow.document;
      default:
        return reader;
    }
  };
  function getLatestReader() {
    return Zotero_Tabs._tabs
      .map((x: any) => {
        if ((x.type == 'reader' || x.type == 'reader-unloaded')
          && Zotero.Items.exists(x.data.itemID)) {
          return x;
        }
      })
      .filter(e => e)
      .sort((a, b) => a.timeUnselected - b.timeUnselected)
      .slice(-1)[0].data.itemID;
  }
  function getLatestTab(onlyReaderTab?: boolean) {
    let condition: any;
    onlyReaderTab ? condition = (x: any) => (x.type == 'reader' || x.type == 'reader-unloaded') : 1;
    return Zotero_Tabs._tabs
      .map((x: any) => {
        if (condition() && Zotero.Items.exists(x.data.itemID)) {
          return x;
        }
      })
      .filter(e => e)
      .sort((a, b) => a.timeUnselected - b.timeUnselected)
      .slice(-1)[0];
  }
  //Zotero.Session.state.windows.map((x: any) => { if (x.type == 'reader' && Zotero.Items.exists(x.itemID)) { return x.itemID; } });

}



