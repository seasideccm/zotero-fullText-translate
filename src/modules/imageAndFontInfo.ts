import ZoteroToolkit from "zotero-plugin-toolkit";

export async function getImageInfo(PDFViewerApplication: any) {
    const info = await getImageAndFontInfo(PDFViewerApplication);
    return info.imgDataArr;
}
export async function getFontInfo(PDFViewerApplication: any) {
    const info = await getImageAndFontInfo(PDFViewerApplication);
    return info.fontInfo;
}




export async function getImageAndFontInfo(PDFViewerApplication: any) {
    await PDFViewerApplication.pdfViewer.firstPagePromise;
    /* PDFViewerApplication.pdfViewer.eventBus._on("pagerender", testFn());
    function testFn() {

        ztoolkit.log("渲染前拦截");


        const testP = PDFViewerApplication.pdfViewer._pages;
    } */
    const imgDataArr: any[] = [];
    const pageRenderingIdChecked: any[] = [];
    const fontInfo: any = {};
    const firstPage: any = PDFViewerApplication.pdfViewer._pages.filter((e: any) => e.id == 1)[0];
    await getImg(firstPage);
    await PDFViewerApplication.pdfViewer.pagesPromise;
    const pages: any[] = PDFViewerApplication.pdfViewer._pages.filter((e: any) => e.id != 1);
    for (const page of pages) {
        await getImg(page);
    }
    async function getImg(page: any) {
        if (!page.pdfPage) { return; }
        const ops = await page.pdfPage.getOperatorList();
        for (let i = 0; i < ops.fnArray.length; i++) {
            if (ops.fnArray[i] == 85 || ops.fnArray[i] == 86) {
                const name = ops.argsArray[i][0];
                const obj = await page.pdfPage.objs.has(name);
                if (obj) {
                    const img = await page.pdfPage.objs.get(name);
                    imgDataArr.push({
                        renderingId: page.renderingId,
                        fnId: i,
                        imgName: name,
                        img: img
                    });
                }
            }
            if (ops.fnArray[i] == 37) {
                const loadedName = ops.argsArray[i][0];
                const common = await page.pdfPage.commonObjs.has(loadedName);
                if (common) {
                    const font: any = await page.pdfPage.commonObjs.get(loadedName);
                    fontInfo[font.loadedName] = font.name;
                }
            }
        }
        pageRenderingIdChecked.push(page.renderingId);
    }
    //await getImg(pages);
    return {
        imgDataArr: imgDataArr,
        fontInfo: fontInfo,
    };
}