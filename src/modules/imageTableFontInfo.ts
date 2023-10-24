import { frequency } from "./getPdfFullText";
import { applyTransform, expandBoundingBox, getPosition, quickIntersectRect, adjacentRect } from "./tools";
import { OPS } from "../utils/config";
import { invertKeyValues } from "./tools";

const OPS_VK = invertKeyValues(OPS);
export async function getOpsInfo(page: any) {
    const imgDataArr: any[] = [];
    const pathDataArr: any[] = [];
    const tableDataArr: any[] = [];

    const fontInfo: any = {};
    const fontInfoObj: any = {};
    //todo 通过选项选择是否提取高清大图
    const isExtractOringImg = false;
    const ops = await page.pdfPage.getOperatorList();
    const fnArray: number[] = ops.fnArray;
    const argsArray: any = ops.argsArray;

    const state: any = {
        paintFormXObject: {
            transform: [],
            rect: [],
        },
        text: false,
        savedNumber: 0,
        restore: 0,
        transform: {
            oringin: [],
            constructPath: [],
            saved: [],

        }

    };
    if (fnArray.filter((e: any) => e == 85).length > 100) {
        ztoolkit.log("本页图片太多，可能为矢量图，或者大量小图形，跳过提取");
        //return;
    }
    //stroke: 20, fill: 22, endText: 32, restore 11,
    const endMarkersBackward = [20, 21, 22, 23, 24, 25, 26, 27, 32, 44, 91];
    const endMarkersForward = [11, 20, 21, 22, 23, 24, 25, 26, 27, 32, 44, 91];











    /*     const printLog = () => {
            ztoolkit.log("调用成功");
        };
        const action: any = {
            91: printLog,
            printLog: () => {
                ztoolkit.log("调用成功");
            },
        }; */

    for (let i = 0; i < fnArray.length; i++) {
        /*         const fnId = fnArray[i];
                if (fnId == OPS.dependency) {
                    continue;
                }
                if (action[fnId]) {
                    action[fnId]();
                }
                continue; */
        //图片
        if (fnArray[i] == 85 || fnArray[i] == 86) {
            const imgObj: any = {
                //originTransform: transform,
                pageId: page.id,
                pageLabel: page.pageLabel,
                fnId: fnArray[i],
                fnArrayIndex: i,
            };
            if (isExtractOringImg) {
                const name = argsArray[i][0];
                const hasImgData = await page.pdfPage.objs.has(name);
                if (hasImgData) {
                    const imgData = await page.pdfPage.objs.get(name);
                    //const imgData = this.getObject(objId);  class CanvasGraphics 
                    imgObj.imgName = name;
                    imgObj.imgData = imgData;
                }
            }
            const transform: number[][] = [];
            for (let j = i - 1; j > i - 12 && j >= 0; j--) {
                //绘制img之前可能不止一个transform
                //多个transform好比pdf套着作为图片的pdf
                if (fnArray[j] == 12) {
                    transform.push([...argsArray[j]] as number[]);
                }
                if (endMarkersBackward.includes(fnArray[j])) {
                    //如果该路径前无transform，则使用默认transform
                    break;
                }
            }
            //图片自身有transform，宽高，transform决定了图片在pdf页面上的位置。此处无需过滤。
            //每个对象均为单位大小，即[0,0,1,1],左下角【0,0】，右上角【1,1】
            //例如 transform  [ 245.952, 0, 0, 184.608, 0, 0 ]意思是x轴缩放245.952倍，y轴缩放184.608倍，没有旋转，没有位移
            //
            /* if (imgObj.transform[4] <= view[2] * 0.05 || imgObj.transform[4] >= view[2] * 0.95
                || imgObj.transform[5] <= view[3] * 0.05 || imgObj.transform[5] >= view[3] * 0.95) {
                continue;
            } */
            imgObj.transform = transform;
            imgDataArr.push(imgObj);
        }
        //字体
        if (fnArray[i] == 37) {
            const loadedName = argsArray[i][0];
            const common = await page.pdfPage.commonObjs.has(loadedName);
            if (common) {
                const font: any = await page.pdfPage.commonObjs.get(loadedName);
                fontInfo[font.loadedName] = font.name;
                //测试，font.loadedName是否对应多个 font.name
                const tempObj: any = {};
                tempObj[font.name] = 1;
                tempObj.pageId = page.id;
                tempObj.pageLabel = page.pageLabel;
                tempObj.fnId = fnArray[i];
                tempObj.fnArrayIndex = i;

                fontInfoObj[font.loadedName] ?
                    (fontInfoObj[font.loadedName][font.name] ?
                        fontInfoObj[font.loadedName][font.name] = fontInfoObj[font.loadedName][font.name] + 1
                        : fontInfoObj[font.loadedName][font.name] = 1)
                    : fontInfoObj[font.loadedName] = tempObj;
            }
        }
        //表格
        /* if (fnArray[i] == OPS.paintFormXObjectBegin) {

            state.paintFormXObject.transform = argsArray[i][0];
            state.paintFormXObject.rect = argsArray[i][1];

            const OPS_K = OPS_VK[fnArray[i] as keyof typeof OPS_VK];
            state[OPS_K] = true;




            



            for (let j = i + 1; j < fnArray.length; j++) {
                if (fnArray[j] == OPS.paintFormXObjectEnd) {
                    delete state.paintFormXObject;
                    delete state[OPS_K];
                    i = j + 1;
                    break;
                }
            }

        } */

        if (fnArray[i] == OPS.save) {
            state.savedNumber += 1;

        }
        if (fnArray[i] == OPS.restore) {
            state.savedNumber -= 1;
        }

        if (fnArray[i] == 91) {
            const args: any = argsArray[i];
            const fn: number[] = args[0];
            const fnArgs: number[] = args[1];
            const minMax: number[] = args[2];
            //路径类型 曲线、矩形、直线
            const isCurve = fn.filter((e: any) => [15, 16, 17].includes(e)).length ? true : false;
            const isRectangle = fn.includes(19) && !fn.includes(14) && !isCurve ? true : false;
            const isLine = !fn.includes(19) && fn.includes(14) && !isCurve ? true : false;

            //fnArgs数组元素依次为 x，y，width，height
            //第二点坐标 const xw = x + width;  const yh = y + height;
            // const minMaxForBezier = isScalingMatrix ? minMax.slice(0) : null;
            const pathObj: any = {
                constructPathArgs: {
                    ops: fn,
                    args: fnArgs,
                    minMax: minMax,
                },
                pageId: page.id,
                pageLabel: page.pageLabel,
                fnId: fnArray[i],
                fnArrayIndex: i,
            };
            const transform: number[][] = [];
            for (let j = i - 1; j >= 0; j--) {
                if (fnArray[j] == 12) {
                    transform.push([...argsArray[j]]);
                }
                //剪切可以有transform
                if (endMarkersBackward.includes(fnArray[j])) {
                    break;
                }
            }
            //向前查看是否为 clip 剪切
            for (let j = i + 1; j < fnArray.length; j++) {
                if (fnArray[j] == 29) {
                    pathObj.isClip = true;
                    break;
                }
                if (endMarkersForward.includes(fnArray[j])) {
                    break;
                }
            }
            pathObj.transform = transform;
            if (isCurve) {
                pathObj.type = "curve";
                if (pathDataArr.length && pathDataArr.slice(-1)[0].type != "curve") {
                    tableDataArr.push([...pathDataArr]);
                    pathDataArr.length = 0;
                }
                //continue;
            }
            if (isLine) {
                pathObj.type = "line";
                //如果数组中最后一个对象的类型不是线条，则将数组push到表格中，暂时认为一个表格绘制完毕
                //但表格可能绘制底纹，绘制矩形，近乎零高矩形方式绘制线段，线段
                //最后通过是否重叠，相交来处理
                if (pathDataArr.length && pathDataArr.slice(-1)[0].type != "line") {
                    tableDataArr.push([...pathDataArr]);
                    pathDataArr.length = 0;
                }
            }
            if (isRectangle) {
                pathObj.type = "rectangle";
                //矩形宽高
                /* pathObj.width = fnArgs[2];
                pathObj.height = fnArgs[3]; */
                if (pathDataArr.length && pathDataArr.slice(-1)[0].type != "rectangle") {
                    tableDataArr.push([...pathDataArr]);
                    pathDataArr.length = 0;
                }
            }
            pathDataArr.push(pathObj);
        }
        /* 向后遇到路径绘制结束标志后，之后还可能有同类型绘制，
        因此，将路径信息对象标记为已绘制，暂存入pathDataArr中，
        等待给类存入tableDataArr表格数组中 */
        if ([20, 21, 22, 23, 24, 25, 26, 27].includes(fnArray[i])) {
            if (pathDataArr.length) {
                pathDataArr.slice(-1)[0].isPaint = true;
            }
        }
        /* 向后遇到非路径绘制的其他结束标志后，认为本次表格绘制结束，但可能是剪切
        28,29,30是剪切
        31, 44, 32, 绘制文字，路径绘制过程中可以绘制文字
        , 63, 65 行内图片
        69, 71 标记内容
        74, 75 绘制表单内容
        76,77 成组
        78, 79, 80, 81 注释 */
        if ([63, 65, 74, 75, 76, 77, 78, 79, 80, 81, 85].includes(fnArray[i])) {
            if (pathDataArr.length) {
                tableDataArr.push([...pathDataArr]);
                pathDataArr.length = 0;
            }

        }
        if (i == fnArray.length - 1) {
            if (pathDataArr.length) {
                tableDataArr.push([...pathDataArr]);
                pathDataArr.length = 0;
            }
        }
    }

    //makeTable
    const tableArrTemp: any[] = [];
    tableDataArr.forEach((tablePathData: any[]) => {
        const view = page.pdfPage.view;
        const type = tablePathData[0].type;
        //先跳过曲线
        if (type == "curve") { return; }
        const p1sx: number[] = [];
        const p1sy: number[] = [];
        const p2sx: number[] = [];
        const p2sy: number[] = [];
        const tablePathObj: any = {

            pageId: page.id,
            pageLabel: page.pageLabel,
            fnIds: [],
            fnArrayIndexs: [],

        };
        tablePathData.forEach((pathData: any) => {
            tablePathObj.fnIds.push(pathData.fnId);
            tablePathObj.fnArrayIndexs.push(pathData.fnArrayIndex);
            //每个路径可能都有自己的transform
            //如果多个路径共用一个transform，todo
            const transform: number[][] = JSON.parse(JSON.stringify(pathData.transform));;
            if (!transform.length) {
                transform.push([1, 0, 0, 1, 0, 0]);//单位矩阵，坐标保持不变
            }
            const args = pathData.constructPathArgs.args;
            //表格线可以是矩形，参数是起点和宽高,可能不止4个参数
            if (pathData.type == "rectangle") {
                for (let i = 0; i < args.length;) {
                    const x1 = args[i++];
                    const y1 = args[i++];
                    const x2 = x1 + args[i++];
                    const y2 = y1 + args[i++];
                    let rect: number[] = [x1, y1, x2, y2];
                    transform.filter((e: any) => { rect = getPosition(rect, e); });
                    p1sx.push(rect[0]);
                    p1sy.push(rect[1]);
                    p2sx.push(rect[2]);
                    p2sy.push(rect[3]);
                }
            }
            //直线坐标是两个点
            if (pathData.type == "line") {
                for (let i = 0; i < args.length;) {
                    const x1 = args[i++];
                    const y1 = args[i++];
                    let p: number[] = [x1, y1];
                    transform.filter((e: any) => { p = applyTransform(p, e); });
                    p1sx.push(p[0]);
                    p1sy.push(p[1]);
                }
            }
        });
        //同类型路径，各点矩阵变换后的集合，取最大图形
        const rect: number[] = [];
        if (type == "rectangle") {
            rect.push(Math.min(...p1sx));
            rect.push(Math.min(...p1sy));
            rect.push(Math.max(...p2sx));
            rect.push(Math.max(...p2sy));
        }
        if (type == "line") {
            rect.push(Math.min(...p1sx));
            rect.push(Math.min(...p1sy));
            rect.push(Math.max(...p1sx));
            rect.push(Math.max(...p1sy));
        }
        //接近边界者认为非正文

        if (rect[0] < view[2] * 0.05 || rect[0] > view[2] * 0.95
            || rect[1] < view[3] * 0.05 || rect[1] > view[3] * 0.95
            || rect[2] < view[2] * 0.05 || rect[2] > view[2] * 0.95
            || rect[3] < view[3] * 0.05 || rect[3] > view[3] * 0.95) {
            return;
        }

        tablePathObj.rect_pdf = rect;
        tableArrTemp.push(tablePathObj);
    });
    //递归合并 rect
    const tableArr = combineRect(tableArrTemp);
    function combineRect(obj: any[]) {
        obj.forEach((e: any) => {
            const r1 = e.rect_pdf;
            for (let i = 0; i < obj.length; i++) {
                if (e == obj[i] || obj[i].rect_pdf.length == 0) {
                    i++;
                    continue;
                }
                const r2 = obj[i].rect_pdf;
                if (quickIntersectRect(r1, r2) || adjacentRect(r1, r2)) {
                    e.rect_pdf = expandBoundingBox(r1, r2, page.viewBox) || r2;
                    obj[i].rect_pdf.length = 0;
                }
            }
        });

        const over = obj.filter((e: any) => e.rect_pdf.length == 0);
        const newObj = obj.filter((e: any) => e.rect_pdf.length);
        if (!over.length) {
            return newObj;
        } else {
            return combineRect(newObj);
        }



    }




    return {
        imgDataArr: imgDataArr,
        fontInfo: fontInfo,
        fontInfoObj: fontInfoObj,
        tableArr: tableArr
    };
}
/**
 * 
 * @param arr 
 * @param oddOrEven 1=odd 奇数 一般是坐标 y, 0=Even 偶数，一般是坐标 x
 * @returns 
 */
export function splitArrByOddEvenIndex(arr: any[], oddOrEven: 0 | 1) {
    return arr.filter((e: any, i: number) => i % 2 == oddOrEven);
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