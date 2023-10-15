// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck

const OPS = {
    // Intentionally start from 1 so it is easy to spot bad operators that will be
    // 0's.
    // PLEASE NOTE: We purposely keep any removed operators commented out, since
    //              re-numbering the list would risk breaking third-party users.
    dependency: 1,
    setLineWidth: 2,
    setLineCap: 3,
    setLineJoin: 4,
    setMiterLimit: 5,
    setDash: 6,
    setRenderingIntent: 7,
    setFlatness: 8,
    setGState: 9,
    save: 10,
    restore: 11,
    transform: 12,
    moveTo: 13,
    lineTo: 14,
    curveTo: 15,
    curveTo2: 16,
    curveTo3: 17,
    closePath: 18,
    rectangle: 19,
    stroke: 20,
    closeStroke: 21,
    fill: 22,
    eoFill: 23,
    fillStroke: 24,
    eoFillStroke: 25,
    closeFillStroke: 26,
    closeEOFillStroke: 27,
    endPath: 28,
    clip: 29,
    eoClip: 30,
    beginText: 31,
    endText: 32,
    setCharSpacing: 33,
    setWordSpacing: 34,
    setHScale: 35,
    setLeading: 36,
    setFont: 37,
    setTextRenderingMode: 38,
    setTextRise: 39,
    moveText: 40,
    setLeadingMoveText: 41,
    setTextMatrix: 42,
    nextLine: 43,
    showText: 44,
    showSpacedText: 45,
    nextLineShowText: 46,
    nextLineSetSpacingShowText: 47,
    setCharWidth: 48,
    setCharWidthAndBounds: 49,
    setStrokeColorSpace: 50,
    setFillColorSpace: 51,
    setStrokeColor: 52,
    setStrokeColorN: 53,
    setFillColor: 54,
    setFillColorN: 55,
    setStrokeGray: 56,
    setFillGray: 57,
    setStrokeRGBColor: 58,
    setFillRGBColor: 59,
    setStrokeCMYKColor: 60,
    setFillCMYKColor: 61,
    shadingFill: 62,
    beginInlineImage: 63,
    beginImageData: 64,
    endInlineImage: 65,
    paintXObject: 66,
    markPoint: 67,
    markPointProps: 68,
    beginMarkedContent: 69,
    beginMarkedContentProps: 70,
    endMarkedContent: 71,
    beginCompat: 72,
    endCompat: 73,
    paintFormXObjectBegin: 74,
    paintFormXObjectEnd: 75,
    beginGroup: 76,
    endGroup: 77,
    // beginAnnotations: 78,
    // endAnnotations: 79,
    beginAnnotation: 80,
    endAnnotation: 81,
    // paintJpegXObject: 82,
    paintImageMaskXObject: 83,
    paintImageMaskXObjectGroup: 84,
    paintImageXObject: 85,
    paintInlineImageXObject: 86,
    paintInlineImageXObjectGroup: 87,
    paintImageXObjectRepeat: 88,
    paintImageMaskXObjectRepeat: 89,
    paintSolidColorImageMask: 90,
    constructPath: 91,
};
class PromiseCapability {
    #settled = false;

    constructor() {
        /**
         * @type {Promise<any>} The Promise object.
         */
        this.promise = new Promise((resolve, reject) => {
            /**
             * @type {function} Fulfills the Promise.
             */
            this.resolve = data => {
                this.#settled = true;
                resolve(data);
            };

            /**
             * @type {function} Rejects the Promise.
             */
            this.reject = reason => {
                if (typeof PDFJSDev === "undefined" || PDFJSDev.test("TESTING")) {
                    assert(reason instanceof Error, 'Expected valid "reason" argument.');
                }
                this.#settled = true;
                reject(reason);
            };
        });
    }

    /**
     * @type {boolean} If the Promise has been fulfilled/rejected.
     */
    get settled() {
        return this.#settled;
    }
}

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
                let imgObj;
                if (obj) {
                    const img = await page.pdfPage.objs.get(name);
                    //const imgData = this.getObject(objId);  class CanvasGraphics 
                    imgObj = {
                        renderingId: page.renderingId,
                        fnId: i,
                        imgName: name,
                        img: img
                    };

                }
                for (let j = i - 1; j > 0; j--) {
                    if (ops.fnArray[j] == 12) {
                        imgObj.transform = [...ops.argsArray[j]];
                        break;
                    }
                }
                imgDataArr.push(imgObj);
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
//let gfx;
export const ctxImg: any[] = [];
const getTransform = async (pageNumber: number) => {
    const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID) as any;
    const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
    const page = PDFViewerApplication.pdfViewer._pages.filter((page: any) => page.id == pageNumber)[0];
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
        await intentState.displayReadyCapability.promise;
        const gfx = internalRenderTask.gfx;
        const test = () => {
            ztoolkit.log("修改函数");
        };
        gfx["testFn"] = test;
        gfx.finished_85 = new PromiseCapability();
        gfx.pageNumber = pageNumber;
        /* eslint-disable no-inner-declarations */

        const executeOperatorListMod = (
            operatorList,
            executionStartIdx,
            continueCallback,
            stepper
        ) => {
            const argsArray = operatorList.argsArray;
            const fnArray = operatorList.fnArray;
            let i = executionStartIdx || 0;
            const argsArrayLen = argsArray.length;
            // Sometimes the OperatorList to execute is empty.
            if (argsArrayLen === i) {
                return i;
            }
            const chunkOperations =
                argsArrayLen - i > 10 &&
                typeof continueCallback === "function";
            const endTime = chunkOperations ? Date.now() + 15 : 0;
            let steps = 0;
            const commonObjs = gfx.commonObjs;
            const objs = gfx.objs;
            let fnId;
            // eslint-disable-next-line
            while (true) {
                if (stepper !== undefined && i === stepper.nextBreakPoint) {
                    stepper.breakIt(i, continueCallback);
                    return i;
                }
                fnId = fnArray[i];
                if (fnId !== OPS.dependency) {
                    // eslint-disable-next-line prefer-spread
                    gfx[fnId].apply(gfx, argsArray[i]);
                } else {
                    for (const depObjId of argsArray[i]) {
                        const objsPool = depObjId.startsWith("g_") ? commonObjs : objs;
                        // If the promise isn't resolved yet, add the continueCallback
                        // to the promise and bail out.
                        if (!objsPool.has(depObjId)) {
                            objsPool.get(depObjId, continueCallback);
                            return i;
                        }
                    }
                }
                if (fnId == 85 && gfx.finished_85) {
                    gfx.finished_85.resolve();
                    ctxImg.push({
                        pageNumber: gfx.pageNumber,
                        imageName: argsArray[i][0],
                        transform: [...gfx.ctx.mozCurrentTransform],
                    });
                }
                i++;
                if (i === argsArrayLen) {
                    return i;
                }
                if (chunkOperations && ++steps > 10) {
                    if (Date.now() > endTime) {
                        continueCallback();
                        return i;
                    }
                    steps = 0;
                }
            }
        };
        gfx.executeOperatorList = executeOperatorListMod;
        //gfx.__proto__.executeOperatorList = executeOperatorListMod;
        gfx.finished_85.promise.then(() => {
            const x = ctxImg[0].transform[4];
            const y = ctxImg[0].transform[5];
            const pageId = ctxImg[0].pageNumber;
            const imgName = ctxImg[0].imageName;
            ztoolkit.log("x,y,id,mame", x, y, pageId, imgName);
        });
    }
};

export const testFn = async (evt: any) => {
    ztoolkit.log("渲染前拦截，页面：", evt.pageNumber);
    await getTransform(evt.pageNumber);
};


export const getPageData = async (pageNumber?: number) => {
    let pageIndex;
    if (pageNumber) {
        pageIndex = pageNumber - 1;
    }
    const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID) as any;
    const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
    const pdfView = reader._internalReader._primaryView;
    await PDFViewerApplication.pdfViewer.pagesPromise;
    if (!pdfView._pdfPages[pageIndex]) {
        await Zotero.Promise.delay(100);
    }
    const pageData = pdfView._pdfPages[pageIndex];
    pageData.pageIndex = pageIndex;
    return pageData;

};


