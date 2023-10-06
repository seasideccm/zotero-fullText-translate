
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
        for (const page of pages) {
            const imgDataArr: any[] = [];
            const ops = await page.pdfPage.getOperatorList();
            for (let i = 0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] == 85 || ops.fnArray[i] == 86) {
                    const name = ops.argsArray[i][0];
                    const common = await page.commonObjs.has(name);
                    const img = await (common
                        ? page.commonObjs.get(name)
                        : page.objs.get(name)
                    );
                    imgDataArr.push({
                        renderingId: page.renderingId,
                        fnId: i,
                        imgName: name,
                        img: img

                    });
                }
            }
            return imgDataArr;
        };
    }
    const imageInfo: any[] = [];
    if (await getImg(pages)) {
        imageInfo.push(await getImg(pages));
    };
    await PDFViewerApplication.pdfViewer.pagesPromise;
    const pages2 = PDFViewerApplication.pdfViewer._pages.filter((page: any) => !imageInfo?.map(e => e.renderingId).includes(page.renderingId));
    if (await getImg(pages2)) {
        imageInfo.push(await getImg(pages2));
    };
    const testWindow = window;
}
