import { prepareReader } from "./prepareReader";

export const pdfFontInfo: {
    [key: string]: string;
} = {};
export async function pdfFont() {

    const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance;
    await reader._waitForReader;
    let port;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    while (!(port = reader._iframeWindow?.wrappedJSObject?.PDFViewerApplication?.pdfLoadingTask?._worker?._port)) {
        await Zotero.Promise.delay(0.5);
    }
    port.addEventListener("message", (event: MessageEvent) => {
        //ztoolkit.log(event.target, event.data.data);
        if (event.data.data && event.data.data[1] == "Font") {
            const loadedName = event.data.data[2].loadedName;
            const name = event.data.data[2].name.replace(/^[A-Z]{6}\+/m, "");
            pdfFontInfo[loadedName] = name;
            ztoolkit.log("pdfLoadingTask._worker._port:", "loadedName", loadedName, ", name:", name);
        }

        //获取pageDate
        if (event.data.data && event.data.data.structuredText) {
            ztoolkit.log("页面结构化数据获取成功: ", event.data.data.pageLabel);
        }

    });
}

let ctxCache: any;
const redPointArr: number[] = [];
export function identifyFontStyle(fontObj: any, ctx: any) {
    if (fontObj.isType3Font) {
        return;
    }
    const browserFontSize = 30;
    const typeface = `"${fontObj.loadedName}", ${fontObj.fallbackName}`;
    let bold = "normal";
    if (fontObj.black) {
        bold = "900";
    } else if (fontObj.bold) {
        bold = "bold";
    }
    const italic = fontObj.italic ? "italic" : "normal";
    ctx.font = `${italic} ${bold} ${browserFontSize}px ${typeface}`;
    ctx.fillStyle = "red";
    ctx.clearRect(0, 0, browserFontSize, browserFontSize);
    ctx.fillText("H", 0, browserFontSize);
    const pixels = ctx.getImageData(0, 0, browserFontSize, browserFontSize).data;
    //The RGBA order goes by rows from the top-left pixel to the bottom-right.
    //30x30 采集 900 个像素，红点越多，字重越大
    let redPoint = 0;
    for (let i = pixels.length - 1 - 3; i >= 0; i -= 4) {
        if (pixels[i] > 0) {
            redPoint += 1;
        }
    }
    fontObj.redPoint = redPoint;
    redPointArr.push(redPoint);
}


export const getFontStyle = (fontName: string) => {
    if (/(-Bold$)|(\.B(\+\d+)?$)|(Heavey$)|(Black$)|(-Semibold$)|(-Bold-)/mi.test(fontName)) {
        return "bold";
    } else if (/(BoldItal$)|(.BI$)|(-SemiboldIt$)|(BoldItalic$)/mi.test(fontName)) {
        return "boldItalic";
    } else if (/(Italic$)|(\.I$)|(Oblique$)|(-LightIt$)|(-It$)/mi.test(fontName)) {
        return "italic";
    } else {
        //todo canvas渲染字体判断字体格式
        return "normal";
    }
};

export async function getFont() {
    const g_F_ByPage: any = {};
    const fontInfoObj: any = {};
    const PDFView = (await prepareReader("pagesLoaded"))("PDFView");
    const pages = (await prepareReader("pagesLoaded"))("pages");
    for (const page of pages) {
        const g_F_FontObj: any = {};
        const pdfPage = page.pdfPage;
        const textContent = await pdfPage.getTextContent();
        const items = textContent.items;
        for (const e of items) {
            const loadedName = e.fontName;
            if (!e.chars) continue;
            const charFontName = e.chars[0]?.fontName;
            /* if (fontInfoObj_g[loadedName]) {
                continue; 
            }*/
            if (g_F_FontObj[charFontName]) {
                continue;
            }
            g_F_FontObj[charFontName] = loadedName;

            if (fontInfoObj[loadedName]) {
                continue;
            }
            let common;
            let n = 0;
            while (!(common = pdfPage.commonObjs.has(loadedName)) && n < 10) {
                await page.pdfPage.getOperatorList();
                n += 1;
            }
            if (common) {
                const font: any = pdfPage.commonObjs.get(loadedName);
                //font.pageIndex = pdfPage._pageIndex;
                //font.fontStyle = getFontStyle(font.name);
                //fontData已经清除，
                //用不上fontData，如果需要可尝试通过 worker message 获取
                fontInfoObj[loadedName] = font;

            }
        }
        g_F_ByPage[page.id] = g_F_FontObj;

    };
    if (!ctxCache) {
        const document = PDFView._iframeWindow.document;
        let canvasWrapper;
        while (!(canvasWrapper = document.querySelector("#viewer.pdfViewer .page:nth-child(1) .canvasWrapper"))) {
            await Zotero.Promise.delay(10);
        }
        const size = 500;
        const canvasFontCheck = document.createElement("canvas");
        canvasFontCheck.id = "fontCheck";
        canvasWrapper.appendChild(canvasFontCheck);
        canvasFontCheck.width = canvasFontCheck.height = size;
        ctxCache = canvasFontCheck.getContext("2d");
    }
    const ctx = ctxCache;

    for (const font of Object.values(fontInfoObj)) {
        identifyFontStyle(font, ctx);
    }
    redPointArr.sort((a, b) => b - a);
    const boldCutoff = 220;
    for (const font of Object.values(fontInfoObj)) {
        const index = redPointArr.indexOf((font as any).redPoint);
        if (index > boldCutoff) {
            (font as any).style = "bold";
        }
    }
    return {
        g_F_ByPage: g_F_ByPage,
        fontInfoObj: fontInfoObj
    };
}