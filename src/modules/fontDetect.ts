import { alphabetDigital } from "../utils/config";
import { getString } from "../utils/locale";
import { getFileInfo, getPathDir, readJsonFromDisk, saveJsonToDisk } from "../utils/prefs";
import { saveImage } from "./annotationImage";
import { fullTextTranslate } from "./fullTextTranslate";
import { prepareReader } from "./prepareReader";
import { WriteNote } from "./writeNote";

export const pdfFontInfo: {
    [key: string]: string;
} = {};

const upDownBeginleftPoint = 'BDEFHIKLNPRXZbhkxz'.split('');
const downBeginLeftPoint = 'SUilmnprsuy'.split('');
const upBeginRightPoint = 'JCQGacdefgjqt'.split('');
const upDownCenterPoint = 'AMVWYTvwOo'.split('');
export const fontStyleJudgeType = {
    0: upDownBeginleftPoint,
    1: downBeginLeftPoint,
    2: upBeginRightPoint,
    3: upDownCenterPoint,
};



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
    //const document = (await prepareReader("pagesLoaded"))("documentPDFView");
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
    const ctx = await getCtx(idRenderFinished);
    const fontSimpleInfoArr: any[] = [];
    const itemsAll: PDFItem[] = [];

    for (const page of pages) {
        const g_F_FontObj: any = {};
        const pdfPage = page.pdfPage;
        const textContent = await pdfPage.getTextContent();
        const items = textContent.items;
        itemsAll.push(...items);
        for (const e of items) {
            const loadedName = e.fontName;
            if (!e.chars) continue;
            const charFontName = e.chars[0]?.fontName;
            if (!g_F_FontObj[charFontName]) {
                g_F_FontObj[charFontName] = loadedName;
            }
            if (fontInfoObj[loadedName]) {
                continue;
            }
            let common;
            let n = 0;
            while (!(common = pdfPage.commonObjs.has(loadedName)) && n++ < 50) {
                await page.pdfPage.getOperatorList();
            }
            if (common) {
                const font: any = JSON.parse(JSON.stringify(pdfPage.commonObjs.get(loadedName)));
                fontInfoObj[loadedName] = font;
            }
        }
        g_F_ByPage[page.id] = g_F_FontObj;
    };

    //将尽可能多的该字体对应的字符收集全
    for (const loadedName of Object.keys(fontInfoObj)) {
        const charsObj: any = {};
        let strsOfloadedName = itemsAll.filter((item: PDFItem) =>
            item.fontName == loadedName && item.str && !(item.str == "" || item.str == " "
            )).map((item: PDFItem) => item.str);
        strsOfloadedName = [...new Set(strsOfloadedName)];
        strsOfloadedName.filter((str: string) => {
            for (const char of str) {
                charsObj[char] ? charsObj[char] += 1 : charsObj[char] = 1;
            }
        });
        const charsArr = Object.keys(charsObj).filter((char: string) => char != " ");
        const font = fontInfoObj[loadedName];
        font.charsArr = charsArr;
        for (const type of Object.keys(fontStyleJudgeType)) {
            const judgeCharArr = fontStyleJudgeType[(type as unknown) as keyof typeof fontStyleJudgeType];
            if (charsArr.some((char: string) => judgeCharArr.includes(char))) {
                font.styleJudgeType = type;
                font.judgeCharArr = judgeCharArr;
                break;
            }

        }
        let fontSimpleInfo;
        if (!font.isType3Font) {
            fontSimpleInfo = await identifyRedPointAndItalic(font, ctx, pdfItemID);
        }
        if (fontSimpleInfo) {
            fontSimpleInfoArr.push(fontSimpleInfo);
        }
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
export const saveDiskFontSimpleInfo = async (fontSimpleInfoArr: any[], fromDisk?: any) => {
    if (!fromDisk) {
        fromDisk = await readJsonFromDisk(fontStyleFileName);
    }
    if (!fromDisk) {
        fromDisk = {};
    }
    //清理掉image
    const obj = JSON.parse(JSON.stringify(fontSimpleInfoArr));
    obj.filter((obj: any) => {
        obj.charImg ? delete obj.charImg : () => { };
        obj.charsImg ? delete obj.charsImg : () => { };
    });
    obj.filter((e: any) => e).filter((fontSimpleInfo: any) => {
        if (!fromDisk[fontSimpleInfo.fontName]) {
            fromDisk[fontSimpleInfo.fontName] = fontSimpleInfo;
        }
    });
    await saveJsonToDisk(fromDisk, fontStyleFileName);

    const fileInfo = await getFileInfo(getPathDir(fontStyleFileName).path);
    let fileSize;
    if (!fileInfo) {
        fileSize = 0;
    } else {
        fileSize = fileInfo.size;
    }

    fullTextTranslate.showInfo(
        getString("info-dataWriteToDiskSuccess") + getString("info-fileInfo-size") + fileSize,
        2000);
    //返回合并后的数据
    return fromDisk;
};

export const makeFontInfoNote = async (fontSimpleInfo: any, boldRedPointArr?: number[]) => {

    const note = new WriteNote({ title: "Font Style Collection" });

    note.addContent("粗体红点数:\n" + boldRedPointArr);

    const data: {
        dataArr: any[][];
        caption?: string | undefined;
        header?: string[] | undefined;
    } = {
        dataArr: Object.values(fontSimpleInfo)
            .filter((obj: any) => !Array.isArray(obj))
            .map((obj: any) => Object.values(obj))
            .filter(e => e)
    };
    data.header = ["fontName",
        "loadName",
        "redPoint",
        "isItalic",
        "pdfItemID",
        "style",
        "isBold"];

    note.addTable(data);
    await note.makeNote();
    const testWriteNote = "test";
};

export async function identifyRedPointAndItalic(fontObj: any, ctx: any, pdfItemID: number) {
    const browserFontSize = 40;
    const typeface = `"${fontObj.loadedName}", ${fontObj.fallbackName}`;
    const bold = "normal";
    /* if (fontObj.black) {
        bold = "900";
    } else if (fontObj.bold) {
        bold = "bold";
    }
    const italic = fontObj.italic ? "italic" : "normal"; */

    const italic = "normal";
    const fontValue = `${italic} ${bold} ${browserFontSize}px ${typeface}`;
    ctx.canvas.width = ctx.canvas.height = browserFontSize + 2;
    ctx.font = fontValue;
    ctx.fillStyle = "red";
    //ctx.clearRect(0, 0, browserFontSize + 2, browserFontSize + 2);
    const fontName = fontObj.name.replace(regFontName, "");
    if (!fontObj.styleJudgeType || fontObj.isType3Font) {
        return {
            fontName: fontName,
            char: null,
            charImg: null,
            charsImg: null,
            redPoint: null,
            isItalic: null,
            loadName: fontObj.loadedName,
            pdfItemID: pdfItemID,
        };
    }
    //确定绘制字符，依照判别字符顺序找，返回符合的第一个字符，否则返回 undefined   
    const char = fontObj.judgeCharArr.find((char: string) => fontObj.charsArr.includes(char));
    ctx.fillText(char, 0, browserFontSize);
    let charImgData = ctx.getImageData(0, 0, browserFontSize, browserFontSize);
    const pixels = charImgData.data;
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
    let reds = pixels.filter((e: number, i: number) => i % 4 == 0);
    const redPoints2 = reds.filter((e: number) => e).length;
    if (redPoints2 != redPoint) {
        ztoolkit.log("红点不相等");
    }
    const charBorder = findRedsBorder(reds, charImgData.width, charImgData.height);
    charImgData = null;
    charImgData = ctx.getImageData(0, 0, charBorder.widthBox, charBorder.heightBox);
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
    reds = null;
    const charsPerLine = 15;
    const fontNotIncludeChars = alphabetDigital.filter((char: string) => !fontObj.charsArr.includes(char));
    const rowsTotal = Math.ceil(fontObj.charsArr.length / charsPerLine) + Math.ceil(fontNotIncludeChars.length / charsPerLine) + 4;
    ctx.canvas.width = 500;
    ctx.canvas.height = rowsTotal * (browserFontSize + 2);
    ctx.font = fontValue;
    ctx.fillStyle = "red";
    //ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    let rowIndexBeginDraw = drawChars(fontObj.charsArr, browserFontSize, charsPerLine, 1, true);
    rowIndexBeginDraw = drawChars(fontNotIncludeChars, browserFontSize, charsPerLine, rowIndexBeginDraw, false);
    const imgWidth = ctx.canvas.width;
    const imgHeight = ctx.canvas.height;

    let tempCharsImgData = ctx.getImageData(0, 0, imgWidth, imgHeight);
    let charsImgDataReds = tempCharsImgData.data.filter((e: number, i: number) => i % 4 == 0);
    const border = findRedsBorder(charsImgDataReds, ctx.canvas.width, ctx.canvas.height);
    tempCharsImgData = charsImgDataReds = null;
    const charsImgData = ctx.getImageData(0, 0, border.widthBox + 2 >= imgWidth ? imgWidth : border.widthBox + 2, border.heightBox + 2 >= imgHeight ? imgHeight : border.heightBox + 2);
    //ctx.clearRect(0, 0, imgWidth, imgHeight);
    const charImgDataURL = makeImgDataURL(charImgData);
    const charsImgDataURL = makeImgDataURL(charsImgData);
    //测试直接保存图片
    const path1 = getPathDir(fontName, "f:\\testImg\\", ".png").path;
    const path2 = getPathDir("2" + fontName, "f:\\testImg\\", ".png").path;

    await saveImage(charImgDataURL as string, path1);
    await saveImage(charsImgDataURL as string, path2);

    fontObj.isItalic = isItalic;
    fontObj.redPoint = redPoint;
    return {
        fontName: fontName,
        char: char,
        charImg: charImgDataURL,
        chars: fontObj.charsArr,
        charsImg: charsImgDataURL,
        redPoint: fontObj.redPoint,
        isItalic: fontObj.isItalic,
        loadName: fontObj.loadedName,
        pdfItemID: pdfItemID,
        browserFontSize: browserFontSize,
    };

    function makeImgDataURL(imgData: ImageData) {
        /* const canvas = document.createElement('canvas');
        canvas.width = imgData.width;
        canvas.height = imgData.height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return; */
        //ctx.clearRect(0, 0, imgWidth, imgHeight);
        ctx.canvas.width = imgData.width;
        ctx.canvas.height = imgData.height;
        ctx.putImageData(imgData, 0, 0);
        const imgDataURL = ctx.canvas.toDataURL('image/png');
        ctx.canvas.width = ctx.canvas.height = 0;
        //canvas.width = canvas.height = 0;
        return imgDataURL;
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
    function drawChars(chars: string[], browserFontSize: number, charsPerLine: number, rowIndexBeginDraw?: number, isSeperator?: boolean) {
        //计算画布大小



        let i = rowIndexBeginDraw || 1;
        for (let j = 0; j < Math.ceil(chars.length / charsPerLine); i++, j++) {
            const str = chars.slice(j * charsPerLine, (j + 1) * charsPerLine).join("");
            if (str) {
                ctx.fillText(str, 0, (browserFontSize + 2) * i);
            }
        }
        if (isSeperator) {
            let seperator = `--------------------`;
            ctx.fillText(seperator, 0, (browserFontSize + 2) * i);
            i += 1;
            ctx.fillText(fontName, 0, (browserFontSize + 2) * i);
            seperator = `chars not included `;
            i += 1;
            ctx.fillText(seperator, 0, (browserFontSize + 2) * i);
            seperator = `--------------------`;
            i += 1;
            ctx.fillText(seperator, 0, (browserFontSize + 2) * i);
        }

        return i + 1;
    }
    function findRedsBorder(imgDataReds: number[], imgWidth: number, imgHeight: number) {
        let widthBox = 0, heightBox = 0;
        for (let x = imgWidth - 1; x >= 0; x--) {
            let find;
            for (let y = 0; y < imgHeight; y++) {
                if (imgDataReds[y * 500 + x] > 0) {
                    find = 1;
                    break;
                }
            }
            if (find) {
                widthBox = x + 1;
                break;
            }

        }
        for (let x = (imgHeight - 1); x >= 0; x--) {
            let find;
            for (let y = 0; y < imgWidth; y++) {
                if (imgDataReds[x * imgWidth + y] > 0) {
                    find = 1;
                    break;
                }
            }
            if (find) {
                heightBox = x + 1;
                break;
            }

        }
        return {
            widthBox: widthBox,
            heightBox: heightBox
        };
    }
}

export async function getCtx(idRenderFinished: number) {
    const document = (await prepareReader("pagesLoaded"))("documentPDFView");
    const selector = makeSelector(idRenderFinished);
    if (document.querySelector("#fontCheck")) {
        return document.querySelector("#fontCheck").getContext("2d", { alpha: false });
    }
    const canvasWrapper = document.querySelector(selector);
    const size = 500;
    const canvas = document.createElement("canvas");
    canvas.id = "fontCheck";
    canvasWrapper.appendChild(canvas);
    canvas.width = canvas.height = size;
    return canvas.getContext("2d", { alpha: false });
}
export async function clearCanvas() {
    const document = (await prepareReader("pagesLoaded"))("documentPDFView");
    const canvas = document.querySelector("#fontCheck");
    if (canvas) {
        canvas.width = canvas.height = 0;
    }

}

export const identityFontStyle = (fontSimpleInfoArr: any[]) => {
    //暂不考虑半粗体
    const redPointThisPdfArr: number[] = [];
    fontSimpleInfoArr.filter((fontSimpleInfo: any) => {
        if (fontSimpleInfo.redPoint) {
            redPointThisPdfArr.push(fontSimpleInfo.redPoint);
        }
    });
    redPointThisPdfArr.sort((a, b) => b - a);
    const boldRedPointArr: number[] = [];
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
            //canvas渲染字体判断字体格式
            //由于渲染的字母不同，粗体红点数各异
            /* fontSimpleInfo.redPoint >= boldRedPointArr.slice(-1)[0] ? fontSimpleInfo.style = "bold" : judgePdfFontStyoe(fontSimpleInfo); */
            judgePdfFontStyoe(fontSimpleInfo);
            if (fontSimpleInfo.isItalic) {
                fontSimpleInfo.style == "bold" ? fontSimpleInfo.style = "boldItalic" : fontSimpleInfo.style = "italic";
            }
            //主观判断结果暂不记录
            /* if (fontSimpleInfo.redPoint && fontSimpleInfo.style.includes("bold")) {
                boldRedPointArr.push(fontSimpleInfo.redPoint);
            } */
        }
    }
    return boldRedPointArr;

    function judgePdfFontStyoe(fontSimpleInfo: any) {
        const boldCutoffUnit = 7;
        const boldCutoff = boldCutoffUnit * fontSimpleInfo.browserFontSize;
        //const index = redPointThisPdfArr.indexOf(fontSimpleInfo.redPoint);
        if (fontSimpleInfo.redPoint > boldCutoff) {
            fontSimpleInfo.style = "bold";
        } else {
            fontSimpleInfo.style = "";
        }
    }
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

export async function redPointCollectToDisk(boldRedPointArr: number[]) {
    const boldRedPointArrFromDisk: number[] = await readJsonFromDisk("boldRedPointArr");
    let initialLength = 0;
    if (boldRedPointArrFromDisk && boldRedPointArrFromDisk.length) {
        initialLength = boldRedPointArrFromDisk.length;
        if (boldRedPointArr.length) {
            boldRedPointArr.push(...boldRedPointArrFromDisk);
        }
    }
    if (boldRedPointArr.length > initialLength) {
        await saveJsonToDisk(boldRedPointArr, "boldRedPointArr");
    }
}


