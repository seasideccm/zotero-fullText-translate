
export async function extractImage() {
    const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID) as any;
    await reader._waitForReader();
    await reader._initPromise;
    await reader._internalReader._primaryView.initializedPromise;
    const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
    await PDFViewerApplication.initializedPromise;
    await PDFViewerApplication.pdfLoadingTask.promise;
    await PDFViewerApplication.pdfViewer.firstPagePromise;

    const pages = PDFViewerApplication.pdfViewer._pages.filter((e: any) => e.pdfPage);
    async function getImg(pages: any) {
        const imgDataArr: any[] = [];
        for (const page of pages) {
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
                }
            }
        };
        return imgDataArr;
    }
    const imageInfo: any[] = [];
    let tempResult = await getImg(pages);
    if (tempResult?.length) {
        imageInfo.push(...tempResult);
    };
    await PDFViewerApplication.pdfViewer.pagesPromise;
    const pages2 = PDFViewerApplication.pdfViewer._pages.filter((page: any) => !pages.map((e: any) => e.renderingId).includes(page.renderingId));
    tempResult = await getImg(pages2);
    if (tempResult?.length) {
        imageInfo.push(...tempResult);
    };
    const testWindow = window;
}
