

export async function getImageInfo(PDFViewerApplication: any) {
    const info = await getInfo(PDFViewerApplication);
    return info.imgDataArr;
}
export async function getFontInfo(PDFViewerApplication: any) {
    const info = await getInfo(PDFViewerApplication);
    return info.fontInfo;
}

export async function getImageAndFontInfo(PDFViewerApplication: any) {
    return await getInfo(PDFViewerApplication);
}


async function getInfo(PDFViewerApplication: any) {
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
                    //const imgData = this.getObject(objId);  class CanvasGraphics 
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

const getTransform = async (pageNumber: number) => {
    const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID) as any;
    const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
    const page = PDFViewerApplication.pdfViewer._pages.filter((page: any) => page.id == pageNumber);
    //await page._optionalContentConfigPromise;
    const intent = "display", printAnnotationStorage = null;
    let annotationMode;
    if (page.annotationLayer?.renderForms) {
        annotationMode = 2;
    } else {
        annotationMode = 1;
    }
    const intentArgs = page.pdfPage._transport.getRenderingIntent(intent, annotationMode, printAnnotationStorage);
    const intentState = page.pdfPage._intentStates.get(intentArgs.cacheKey);
    for (const internalRenderTask of intentState.renderTasks) {
        ztoolkit.log("拦截到渲染任务");
        const IT = internalRenderTask;
        //const objs=page.pdfPage.objs.get(name) 
        //const gfx = internalRenderTask.gfx;
        //const graphicsReady = gfx.graphicsReady;
    }
};


export const testFn = async (evt: any) => {
    ztoolkit.log("渲染前拦截，页面：", evt.pageNumber);

    await getTransform(evt.pageNumber);
    const test = 5;
};