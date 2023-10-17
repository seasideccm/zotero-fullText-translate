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
                // eslint-disable-next-line
                for (const [index, word] of line.words.entries()) {
                    for (const char of word.chars) {
                        //逐个字符放入之前的数组中
                        text.push(char.c);
                    }
                    if (word.spaceAfter) {
                        //仅针对已发现的错误添加的空格进行纠正
                        //否则等于重写底层规则

                        //如果行存在下一个单词
                        if (line.words[index + 1]) {
                            const reg = /^[A-Z]+$/m;
                            const textCurrent = [];
                            for (const char of word.chars) {
                                textCurrent.push(char.c);
                            }
                            const wordNext = line.words[index + 1];
                            const textNext = [];
                            for (const char of wordNext.chars) {
                                textNext.push(char.c);
                            }
                            if (textCurrent.join('') == "f" || textCurrent.join('').match(reg) && textNext.join('').match(reg)) {
                                if (!textCurrent.filter(char => isRTL(char)).length || !textNext.filter(char => isRTL(char)).length) {
                                    const averageCharWidth = (wordNext.rect[2] - word.rect[0]) / (word.chars.length + wordNext.chars.length) * 100 / 100;
                                    const charsGap1 = computeWordSpacingThreshold(word.chars);
                                    const charsGap2 = computeWordSpacingThreshold(wordNext.chars);
                                    const charsGap = (charsGap1 + charsGap2) / 2;
                                    const wordsGap = wordNext.rect[0] - word.rect[2];
                                    if (wordsGap + 0.1 < charsGap) {
                                        continue;
                                    }
                                }
                            }
                        }
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

const baseTypes = ["BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "S", "B", "S", "WS", "B", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "B", "B", "B", "S", "WS", "ON", "ON", "ET", "ET", "ET", "ON", "ON", "ON", "ON", "ON", "ES", "CS", "ES", "CS", "CS", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "CS", "ON", "ON", "ON", "ON", "ON", "ON", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "ON", "ON", "ON", "ON", "ON", "ON", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "ON", "ON", "ON", "ON", "BN", "BN", "BN", "BN", "BN", "BN", "B", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "CS", "ON", "ET", "ET", "ET", "ET", "ON", "ON", "ON", "ON", "L", "ON", "ON", "BN", "ON", "ON", "ET", "ET", "EN", "EN", "ON", "L", "ON", "ON", "ON", "EN", "L", "ON", "ON", "ON", "ON", "ON", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "ON", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "ON", "L", "L", "L", "L", "L", "L", "L", "L"];
const arabicTypes = ["AN", "AN", "AN", "AN", "AN", "AN", "ON", "ON", "AL", "ET", "ET", "AL", "CS", "AL", "ON", "ON", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AL", "AL", "", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "ET", "AN", "AN", "AL", "AL", "AL", "NSM", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AN", "ON", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AL", "AL", "NSM", "NSM", "ON", "NSM", "NSM", "NSM", "NSM", "AL", "AL", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "AL", "AL", "AL", "AL", "AL", "AL"];

export function isRTL(char: string) {
    const charCode = char.charCodeAt(0);
    let charType = "L";
    if (charCode <= 0x00ff) {
        charType = baseTypes[charCode];
    }
    else if (0x0590 <= charCode && charCode <= 0x05f4) {
        charType = "R";
    }
    else if (0x0600 <= charCode && charCode <= 0x06ff) {
        charType = arabicTypes[charCode & 0xff];
        if (!charType) {
            console.log("Bidi: invalid Unicode character " + charCode.toString(16));
        }
    }
    else if (0x0700 <= charCode && charCode <= 0x08ac) {
        charType = "AL";
    }
    if (charType === "R" || charType === "AL" || charType === "AN") {
        return true;
    }
    return false;
}

function computeWordSpacingThreshold(chars: any[]) {
    const uniformSpacing = 0.07;
    const wordSpacing = 0.1;
    let char, char2;
    let avgFontSize;
    let minAdjGap: number, maxAdjGap: number, minSpGap: number, maxSpGap: number, minGap: number, maxGap: number, gap: number, gap2: number;
    let i;
    avgFontSize = 0;
    minGap = maxGap = 0;
    minAdjGap = minSpGap = 1;
    maxAdjGap = maxSpGap = 0;
    for (i = 0; i < chars.length; ++i) {
        char = chars[i];
        avgFontSize += char.fontSize;
        if (i < chars.length - 1) {
            char2 = chars[i + 1];
            gap = getSpaceBetweenChars(char, char2) as number;
            if (char.spaceAfter) {
                if (minSpGap > maxSpGap) {
                    minSpGap = maxSpGap = gap;
                }
                else if (gap < minSpGap) {
                    minSpGap = gap;
                }
                else if (gap > maxSpGap) {
                    maxSpGap = gap;
                }
            }
            else if (minAdjGap > maxAdjGap) {
                minAdjGap = maxAdjGap = gap;
            }
            else if (gap < minAdjGap) {
                minAdjGap = gap;
            }
            else if (gap > maxAdjGap) {
                maxAdjGap = gap;
            }
            if (i == 0 || gap < minGap) {
                minGap = gap;
            }
            if (gap > maxGap) {
                maxGap = gap;
            }
        }
    }
    avgFontSize /= chars.length;
    if (minGap < 0) {
        minGap = 0;
    }

    // if spacing is nearly uniform (minGap is close to maxGap), use the
    // SpGap/AdjGap values if available, otherwise assume it's a single
    // word (technically it could be either "ABC" or "A B C", but it's
    // essentially impossible to tell)
    if (maxGap - minGap < uniformSpacing * avgFontSize) {
        if (minAdjGap <= maxAdjGap
            && minSpGap <= maxSpGap
            && minSpGap - maxAdjGap > 0.01) {
            return 0.5 * (maxAdjGap + minSpGap);
        }
        else {
            return maxGap + 1;
        }

        // if there is some variation in spacing, but it's small, assume
        // there are some inter-word spaces
    }
    else if (maxGap - minGap < wordSpacing * avgFontSize) {
        return 0.5 * (minGap + maxGap);

        // if there is a large variation in spacing, use the SpGap/AdjGap
        // values if they look reasonable, otherwise, assume a reasonable
        // threshold for inter-word spacing (we can't use something like
        // 0.5*(minGap+maxGap) here because there can be outliers at the
        // high end)
    }
    else if (minAdjGap <= maxAdjGap
        && minSpGap <= maxSpGap
        && minSpGap - maxAdjGap > uniformSpacing * avgFontSize) {
        gap = wordSpacing * avgFontSize;
        gap2 = 0.5 * (minSpGap - minGap);
        return minGap + (gap < gap2 ? gap : gap2);
    }
    else {
        return minGap + wordSpacing * avgFontSize;
    }
}

function getSpaceBetweenChars(char: any, char2: any) {
    const { rotation } = char;
    return !rotation && char2.rect[0] - char.rect[2]
        || rotation === 90 && char2.rect[1] - char.rect[3]
        || rotation === 180 && char.rect[0] - char2.rect[2]
        || rotation === 270 && char.rect[1] - char2.rect[3];
}