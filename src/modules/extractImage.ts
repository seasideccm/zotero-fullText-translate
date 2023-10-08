
export async function extractImage(PDFViewerApplication: any) {

    /* const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID) as any;
    await reader._waitForReader();
    await reader._initPromise;
    await reader._internalReader._primaryView.initializedPromise;
    const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
    await PDFViewerApplication.initializedPromise;
    await PDFViewerApplication.pdfLoadingTask.promise; */
    await PDFViewerApplication.pdfViewer.firstPagePromise;
    const pages: any[] = PDFViewerApplication.pdfViewer._pages;

    //pages = pages.filter((e: any) => e.pdfPage);
    const imgDataArr: any[] = [];
    const pageRenderingIdChecked: any[] = [];

    async function getImg(pages: any) {
        for (const page of pages) {
            if (pageRenderingIdChecked.includes(page.renderingId)) {
                continue;
            }
            const ops = await page.pdfPage.getOperatorList();
            for (let i = 0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] == 85 || ops.fnArray[i] == 86) {
                    const name = ops.argsArray[i][0];
                    const common = await page.pdfPage.commonObjs.has(name);
                    const img = await (common
                        ? page.pdfPage.commonObjs.get(name)
                        : page.pdfPage.objs.get(name)
                    );
                    imgDataArr.push({
                        renderingId: page.renderingId,
                        fnId: i,
                        imgName: name,
                        img: img

                    });
                    pageRenderingIdChecked.push(page.renderingId);
                }
            }
            if (page.id == 1) {
                await PDFViewerApplication.pdfViewer.pagesPromise;
            }
        };
        return imgDataArr;
    }
    await getImg(pages);

}
