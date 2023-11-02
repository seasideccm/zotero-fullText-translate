import { getString } from "../utils/locale";
import { getFileInfo, getPathDir, readJsonFromDisk, saveJsonToDisk } from "../utils/prefs";
import { fullTextTranslate } from "./fullTextTranslate";
import { prepareReader } from "./prepareReader";
import { WriteNote } from "./writeNote";

export const pdfFontInfo: {
    [key: string]: string;
} = {};

const upDownBeginleftPoint = 'BDEFHIKLMNPRXZbhkxz'.split('');
const downBeginLeftPoint = 'SUilmnprsuy'.split('');
const upBeginRightPoint = 'JCQGacdefgjqt'.split('');
const upDownCenterPoint = 'AOVWYTvwo'.split('');
export const fontStyleJudgeType = {
    0: upDownBeginleftPoint,
    1: downBeginLeftPoint,
    2: upBeginRightPoint,
    3: upDownCenterPoint,
};

export async function capturePdfWorkerMessage() {
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
        //if (event.data.data && event.data.data.structuredText) {
        //    ztoolkit.log("页面结构化数据获取成功: ", event.data.data.pageLabel);
        //}

    });
}

export const regFontName = /^[A-Za-z]{6}\+/m;
export const fontStyleFileName = "fontStyleCollection";
function makeSelector(pageIndex: number) {
    return `#viewer.pdfViewer .page:nth-child(${pageIndex}) .canvasWrapper`;
}
export async function getFontInfo() {
    const g_F_ByPage: any = {};
    const fontInfoObj: any = {};
    const pdfItemID = (await prepareReader("pagesLoaded"))("pdfItemID");
    //const PDFView = (await prepareReader("pagesLoaded"))("PDFView");
    //const document = PDFView._iframeWindow.document;
    const document = (await prepareReader("pagesLoaded"))("documentPDFView");
    const pages = (await prepareReader("pagesLoaded"))("pages");
    let idRenderFinished;
    for (let i = 0; i < 100; i++) {
        let find = false;
        for (const page of pages) {
            const renderingState = page.renderingState;
            if (renderingState == 3) {
                idRenderFinished = page.id;
                find = true;
                break;
            }
        }
        if (find) break;
        Zotero.Promise.delay(10);
    }

    /*找不到？？？ if (!(idRenderFinished = pages.filter((page: any) => page.renderingState == 3)[0]?.id) && n++ < 100) {
        Zotero.Promise.delay(10);
    } */
    const ctx = getCtx(idRenderFinished, document);
    const fontSimpleInfoArr: any[] = [];
    for (const page of pages) {
        const g_F_FontObj: any = {};
        const pdfPage = page.pdfPage;
        const textContent = await pdfPage.getTextContent();
        const items = textContent.items;
        for (const e of items) {
            const loadedName = e.fontName;
            if (!e.chars) continue;
            const charFontName = e.chars[0]?.fontName;
            if (g_F_FontObj[charFontName]) continue;
            g_F_FontObj[charFontName] = loadedName;
            if (fontInfoObj[loadedName]) continue;
            let common;
            let n = 0;
            while (!(common = pdfPage.commonObjs.has(loadedName)) && n++ < 50) {
                await page.pdfPage.getOperatorList();
            }
            if (common) {
                const font: any = JSON.parse(JSON.stringify(pdfPage.commonObjs.get(loadedName)));
                //str用于测试字体，pdf字体不是完整字体，有的字母没有，
                //在此记录原文str,所含字符不可太少
                for (const item of items.filter((item: PDFItem) => item.fontName == loadedName)) {
                    font.str += item.str;
                    for (const type of Object.keys(fontStyleJudgeType)) {
                        if (judgeType(fontStyleJudgeType[(type as unknown) as keyof typeof fontStyleJudgeType], font.str)) {
                            font.styleJudgeType = type;
                            break;
                        }
                    }

                    if (font.str.length > 100) {
                        break;
                    }
                }
                //fontData已经清除，
                //用不上fontData，如果需要可尝试通过 worker message 获取
                fontInfoObj[loadedName] = font;
                const fontSimpleInfo = identifyRedPointAndItalic(font, ctx, pdfItemID);
                fontSimpleInfoArr.push(fontSimpleInfo);
            }
        }
        g_F_ByPage[page.id] = g_F_FontObj;

    };
    return {
        g_F_ByPage: g_F_ByPage,
        fontInfoObj: fontInfoObj,
        fontName: "fontName",
        fontSimpleInfoArr: fontSimpleInfoArr
    };
}

export function judgeType(arr: string[], str: string) {
    return arr.some((char: string) => str.includes(char));
}
/**
 * 保存对象到磁盘
 * 键为字体名
 * 
 * 含有字体名、红点数，pdfItemID
 * @param fontSimpleInfoArr 
 * @param fromDisk 
 * @returns 
 */
export const fontSimpleInfoToDisk = async (fontSimpleInfoArr: any[], fromDisk?: any) => {
    if (!fromDisk) {
        fromDisk = await readJsonFromDisk(fontStyleFileName);
    }
    if (!fromDisk) {
        fromDisk = {};
    }

    fontSimpleInfoArr.filter((fontSimpleInfo: any) => {
        if (!fromDisk[fontSimpleInfo.fontName]) {
            fromDisk[fontSimpleInfo.fontName] = fontSimpleInfo;
        }

    });
    getFontStyle(fontSimpleInfoArr, fromDisk);
    /* fromDisk.push(...fontSimpleInfoArr);
    fromDisk = [...new Set(fromDisk)]; */
    await saveJsonToDisk(fromDisk, fontStyleFileName);
    const fileInfo = await getFileInfo(getPathDir(fontStyleFileName).path);
    let fileSize;
    if (!fileInfo) {
        fileSize = 0;
    } else {
        fileSize = fileInfo.size;
    }


    const note = new WriteNote({ title: "Font Style Collection" });
    note.addContent("这是内容");

    const data = { dataArr: Object.values(fromDisk).map((obj: any) => Object.values(obj)).filter(e => e) };
    note.addTable(data);
    await note.makeNote();
    const testWriteNote = "test";



    fullTextTranslate.showInfo(
        getString("info-dataWriteToDiskSuccess") + getString("info-fileInfo-size") + fileSize,
        2000);
    //返回合并后的数据
    return fromDisk;
};

export function identifyRedPointAndItalic(fontObj: any, ctx: any, pdfItemID: number) {
    if (fontObj.isType3Font) {
        return;
    }
    ctx.save();
    const browserFontSize = 30;
    const typeface = `"${fontObj.loadedName}", ${fontObj.fallbackName}`;
    const bold = "normal";
    /* if (fontObj.black) {
        bold = "900";
    } else if (fontObj.bold) {
        bold = "bold";
    } */
    //const italic = fontObj.italic ? "italic" : "normal";

    const italic = "normal";
    ctx.font = `${italic} ${bold} ${browserFontSize}px ${typeface}`;
    ctx.fillStyle = "red";
    ctx.clearRect(0, 0, browserFontSize, browserFontSize);

    //查找可辨别字符
    const chars = fontStyleJudgeType[fontObj.styleJudgeType as keyof typeof fontStyleJudgeType];
    const char = chars.find((char: string) => fontObj.str.includes(char));


    ctx.fillText(char, 0, browserFontSize);
    const pixels = ctx.getImageData(0, 0, browserFontSize, browserFontSize).data;
    ctx.restore();
    //The RGBA order goes by rows from the top-left pixel to the bottom-right.
    //30x30 采集 900 个像素，红点越多，字重越大
    let redPoint = 0;
    for (let i = pixels.length - 1 - 3; i >= 0; i -= 4) {
        if (pixels[i] > 0) {
            redPoint += 1;
        }
    }

    //斜体判断，专利？？
    let isItalic = false;
    const reds = pixels.filter((e: number, i: number) => i % 4 == 0);
    let firstRedPointX;
    let lastRowRedPointX;

    switch (fontObj.styleJudgeType) {
        case "0":
            for (let y = 0; y < browserFontSize; y++) {
                if ((firstRedPointX = findRedPointXHorizontal(y))) {
                    break;
                }
            }
            for (let y = browserFontSize - 1; y > 0; y--) {
                if ((lastRowRedPointX = findRedPointXHorizontal(y))) {
                    break;
                }
            } if (firstRedPointX != lastRowRedPointX) {
                isItalic = true;
            }
            break;
        case "1": if (judgeVerticalLeft()) {
            isItalic = true;
        }
            break;
        case "2": if (judgeVerticalRight()) {
            isItalic = true;
        }
            break;
        case "3": if (judgeCenter()) {
            isItalic = true;
        }
            break;
    }
    function findRedPointXHorizontal(y: number) {
        if (reds.slice(y * browserFontSize, (y + 1) * browserFontSize).filter((e: number) => e).length) {
            return reds.slice(y * browserFontSize, (y + 1) * browserFontSize).findIndex((e: number) => e);
        }
    }
    function judgeVerticalLeft() {
        //从最后一行开始，从左到右找红点，然后向上查找，直到第一个红点出现的行
        //记录查找的行数，计算红点比例
        const firstPointIndex = reds.findIndex((e: number) => e);
        for (let left = browserFontSize * (browserFontSize - 1); left > 0; left -= browserFontSize) {
            for (let x = 0; x < browserFontSize; x++) {
                if (reds[left + x]) {
                    let i = 0, points = 0;
                    for (let up = left - browserFontSize; up > firstPointIndex; up -= browserFontSize) {
                        i++;
                        if (reds[up + x]) {
                            points++;
                        }
                    }
                    if (points / i < 0.4) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }

    }
    function judgeVerticalRight() {
        //从首次出现红点的行开始，从右到左找红点，然后向下查找。
        //记录查找的行数，计算红点比例
        const firstPointIndex = reds.findIndex((e: number) => e);

        for (let left = Math.trunc(firstPointIndex / browserFontSize) * browserFontSize; left < reds.length; left += browserFontSize) {
            for (let x = browserFontSize - 1; x >= 0; x--) {
                if (reds[left + x]) {
                    let i = 0, points = 0;
                    for (let down = left + browserFontSize; down < reds.length; down += browserFontSize) {
                        i++;
                        if (reds[down + x]) {
                            points++;
                        }
                    }
                    if (points / i < 0.4) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
    }
    function judgeCenter() {
        const firstPointIndex = reds.findIndex((e: number) => e);
        const y = Math.trunc(firstPointIndex / browserFontSize);
        const upLeftPointX = firstPointIndex % browserFontSize;
        let upRightPointX: number = 0;
        const upPointLine = reds.slice(y * browserFontSize, (y + 1) * browserFontSize);
        for (let i = browserFontSize - 1; i >= 0; i--) {
            if (upPointLine[i]) {
                upRightPointX = i;
                break;
            }
        }
        const upCenterX: number = (upLeftPointX + upRightPointX) / 2;

        let downLeftPointX: number = 0, downRightPointX: number = 0, downCenterX: number = 0;
        for (let y = browserFontSize - 1; y > 0; y--) {
            const downPointLine = reds.slice(y * browserFontSize, (y + 1) * browserFontSize).filter((e: number) => e);
            if (downPointLine.length) {
                for (let i = 0; i < browserFontSize; i++) {
                    if (downPointLine[i]) {
                        downLeftPointX = i;
                        break;
                    }
                }
                for (let i = browserFontSize - 1; i >= 0; i--) {
                    if (downPointLine[i]) {
                        downRightPointX = i;
                        break;
                    }
                }
                break;
            }
        }
        downCenterX = (downRightPointX + downLeftPointX) / 2;
        return upCenterX > downCenterX;





    }
    //斜体和字重一同判断是常规斜体还是其他斜体
    fontObj.isItalic = isItalic;
    fontObj.redPoint = redPoint;
    const fontName = fontObj.name.replace(regFontName, "");
    return {
        fontName: fontName,
        loadName: fontObj.loadedName,
        redPoint: fontObj.redPoint,
        isItalic: fontObj.isItalic,
        pdfItemID: pdfItemID,
    };
}

export function getCtx(idRenderFinished: number, document: any) {
    const selector = makeSelector(idRenderFinished);
    const canvasWrapper = document.querySelector(selector);
    const size = 200;
    const canvas = document.createElement("canvas");
    canvas.id = "fontCheck";
    canvasWrapper.appendChild(canvas);
    canvas.width = canvas.height = size;
    return canvas.getContext("2d");
}

export const getFontStyle = (fontSimpleInfoArr: any[], fromDisk?: any) => {
    //暂不考虑半粗体
    const redPointThisPdfArr: number[] = [];
    fontSimpleInfoArr.filter((fontSimpleInfo: any) => {
        if (fontSimpleInfo.redPoint) {
            redPointThisPdfArr.push(fontSimpleInfo.redPoint);
        }
    });
    redPointThisPdfArr.sort((a, b) => b - a);

    let boldRedPointArr: number[] = [];
    if (fromDisk) {
        if (fromDisk["boldRedPointArr"]) {
            boldRedPointArr = fromDisk["boldRedPointArr"];
        } else {
            fromDisk["boldRedPointArr"] = boldRedPointArr;

        }
        if (!boldRedPointArr.length) {
            Object.values(fromDisk).filter((fontSimpleInfo: any) => {
                if (fontSimpleInfo.style == "bold") {
                    boldRedPointArr.push(fontSimpleInfo.redPoint);
                }
            });
        }
        boldRedPointArr.sort((a, b) => b - a);
    }



    for (const fontSimpleInfo of fontSimpleInfoArr) {
        if (/(-Bold$)|(\.B(\+\d+)?$)|(Heavey$)|(Black$)|(-Semibold$)|(-Bold-)/mi.test(fontSimpleInfo.fontName)) {
            fontSimpleInfo.style = "bold";
            fontSimpleInfo.isBold = "true";
            if (fontSimpleInfo.redPoint) {
                boldRedPointArr.push(fontSimpleInfo.redPoint);
            }
        } else if (/(BoldItal$)|(.BI$)|(-SemiboldIt$)|(BoldItalic$)/mi.test(fontSimpleInfo.fontName)) {
            fontSimpleInfo.style = "boldItalic";
            fontSimpleInfo.isBoldItalic = "true";
            if (fontSimpleInfo.redPoint) {
                boldRedPointArr.push(fontSimpleInfo.redPoint);
            }
        } else if (/(Italic$)|(\.I$)|(Oblique$)|(-LightIt$)|(-It$)/mi.test(fontSimpleInfo.fontName)) {
            fontSimpleInfo.style = "italic";
            fontSimpleInfo.isItalic = "true";
        } else {
            //todo canvas渲染字体判断字体格式
            fontSimpleInfo.redPoint >= boldRedPointArr.slice(-1)[0] ? fontSimpleInfo.style = "bold" : judgePdfFontStyoe(fontSimpleInfo);
            if (fontSimpleInfo.isItalic) {
                fontSimpleInfo.style == "bold" ? fontSimpleInfo.style = "boldItalic" : fontSimpleInfo.style = "italic";
            }
            if (fontSimpleInfo.redPoint && fontSimpleInfo.style.includes("bold")) {
                boldRedPointArr.push(fontSimpleInfo.redPoint);
            }
        }
    }



    function judgePdfFontStyoe(fontSimpleInfo: any) {
        const boldCutoff = 220;
        const index = redPointThisPdfArr.indexOf(fontSimpleInfo.redPoint);
        if (index == 0 && fontSimpleInfo.redPoint > boldCutoff) {
            fontSimpleInfo.style = "bold";
        } else {
            fontSimpleInfo.style = "";
        }
    }
};

