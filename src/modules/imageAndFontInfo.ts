import { frequency } from "./getPdfFullText";

export async function getInfo(PDFViewerApplication: any) {
    await PDFViewerApplication.pdfViewer.firstPagePromise;
    const imgDataArr: any[] = [];
    const pageRenderingIdChecked: any[] = [];
    const fontInfo: any = {};
    /*     const firstPage: any = PDFViewerApplication.pdfViewer._pages.filter((e: any) => e.id == 1)[0];
        await getOpsInfo(firstPage); */
    await PDFViewerApplication.pdfViewer.pagesPromise;
    //const pages: any[] = PDFViewerApplication.pdfViewer._pages.filter((e: any) => e.id != 1);
    const pages: any[] = PDFViewerApplication.pdfViewer._pages;
    for (const page of pages) {
        await getOpsInfo(page);
    }
    return {
        imgDataArr: imgDataArr,
        fontInfo: fontInfo,
    };
    async function getOpsInfo(page: any) {
        if (!page.pdfPage) { return; }
        const ops = await page.pdfPage.getOperatorList();
        for (let i = 0; i < ops.fnArray.length; i++) {
            if (ops.fnArray[i] == 85 || ops.fnArray[i] == 86) {
                const name = ops.argsArray[i][0];
                const obj = await page.pdfPage.objs.has(name);
                let imgObj: any;
                if (obj) {
                    const imgData = await page.pdfPage.objs.get(name);
                    //const imgData = this.getObject(objId);  class CanvasGraphics 
                    imgObj = {
                        renderingId: page.renderingId,
                        fnId: i,
                        imgName: name,
                        imgData: imgData
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
}

export const getPageData = async (pageIndex: number) => {
    //pageIndex begin from 0
    const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID) as any;
    const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
    await PDFViewerApplication.pdfViewer.pagesPromise;
    const pdfView = reader._internalReader._primaryView;
    if (!pdfView._pdfPages[pageIndex]) {
        let ready = false;
        PDFViewerApplication.pdfViewer.currentPageNumber = pageIndex + 1;
        while (!ready) {
            if (pdfView._pages[pageIndex] && pdfView._pages[pageIndex].originalPage.renderTask?.promise) {
                await pdfView._pages[pageIndex].originalPage.renderTask.promise;
            } else {
                await Zotero.Promise.delay(100);
            }
            if (pdfView._pdfPages[pageIndex]) {
                ready = true;
            }
        }
    }
    const pageData = pdfView._pdfPages[pageIndex];
    pageData.pageIndex = pageIndex;
    return pageData;
};


export async function combineParagraphsWords(pageDateArr: any[]) {
    for (let i = 0, ii = pageDateArr.length; i < ii; i++) {
        const text = [];
        const structuredText = pageDateArr[i].structuredText;
        const { paragraphs } = structuredText;
        //按高度和分栏排序
        for (const paragraph of paragraphs) {
            for (const line of paragraph.lines) {
                for (const word of line.words) {
                    for (const char of word.chars) {
                        text.push(char.c);
                    }
                    if (word.spaceAfter) {
                        text.push(' ');
                    }
                }
                if (line !== paragraph.lines.at(-1)) {
                    if (line.hyphenated) {
                        text.pop();
                    }
                    else {
                        text.push(' ');
                    }
                }
            }

            if (paragraph !== paragraphs.at(-1)) {
                text.push('\n');
            } else {
                //页面最后一个段落添加空行
                text.push('\n\n');
                //非后一页结尾添加换页符
                if (i !== ii - 1) {
                    text.push('\f');
                }
            }
            paragraph.text = text.join('');
            text.length = 0;
        }
    }
}


export const boxByParagraphs = (pageDateArr: any[]) => {
    pageDateArr.filter((pageDate: any) => {
        const { paragraphs } = pageDate.structuredText;
        const temp = frequency(paragraphs.map((para: any) => Math.round(para.rect[0] * 10) / 10));
        const xfrequency = temp.objFrequency;
        const xorderByFrequency = temp.itemOrderByFrequency;

    });

    /*     const validBox: any[] = [];
        const invalidBox: any[] = [];
        paragraphs.filter((para:any)=>{
            const box = {para:[para],
                rect:para.rect}
    
            
        }) */

};