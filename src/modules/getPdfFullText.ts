import { Decimal } from 'decimal.js';
/* eslint-disable no-useless-escape */


declare type Box = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};
const tolerance = 2;
//通过Y判断底边，Y即为行的基线，行的基线和字符的基线是一致的
const isSameBottom = (lineA: PDFLine, lineB: PDFLine) => {
  if (abs(lineA.y - lineB.y) < 0.5) {
    return true;
  } else {
    return false;

  }
};

// 判断lineB是否是上标(确保上标的下边界被左侧字符包裹，不得随意调整)
const isSup = (lineA: PDFLine, lineB: PDFLine) => {
  if (!isSameBottom(lineA, lineB) && lineA.height > lineB.height + tolerance) {
    if (lineA.y + lineA.height > lineB.y + tolerance && lineA.y + tolerance < lineB.y) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};
//判断lineB是否是下标(确保下标的上边界被左侧字符包裹，不得随意调整)
const isSub = (lineA: PDFLine, lineB: PDFLine,) => {
  if (!isSameBottom(lineA, lineB) && lineA.height > lineB.height + tolerance) {
    if ((lineA.y + lineA.height) > lineB.y + lineB.height + tolerance && lineA.y + tolerance < lineB.y + lineB.height) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

// 右侧字符串是上标
// 右侧字符是下标
// 右侧字符串包含左侧的中线
// 反之
const isOverlapping = (lineA: PDFLine, lineB: PDFLine,) => {
  const lineACenterY = lineA.y + lineA.height / 2;
  const lineBCenterY = lineB.y + lineB.height / 2;
  if (isSameBottom(lineA, lineB)) {
    return true;
  } else if (lineA.y < lineBCenterY && lineA.y + lineA.height > lineBCenterY) {
    return true;
  } else if (lineB.y < lineACenterY && lineB.y + lineB.height > lineACenterY) {
    return true;
  } else if (isSub(lineA, lineB) || isSub(lineB, lineA)) {
    return true;
  } else if (isSup(lineA, lineB) || isSup(lineB, lineA)) {
    return true;
  } else if (lineB.height == 0 && abs(lineB.y - lineA.y) < tolerance + 1) {
    return true;
  } else {
    return false;
  }
};


/**
 * 
 * @param item 
 * @returns 
 */
const getMode = (item: number[]) => {
  const num: any = {};
  for (let i = 0; i < item.length; i++) {
    /* num[String(hh[i])] ??= 0 的作用是检查 num 对象中是否存在以
     hh[i] 的值作为属性名的属性。
    如果该属性的值为 null 或 undefined，则将其赋值为 0。
    如果该属性的值已经存在，那么不会进行任何操作。 */
    num[String(item[i])] ??= 0;
    num[String(item[i])] += 1;
  }
  // 以 num 的键作为字符串数组，根据相应键的值为条件，实现高度字符串按众数排序
  const modeArr = Object.keys(num).sort((h1: string, h2: string) => {
    return num[h2] - num[h1];
  });
  return modeArr.map(e => Number(e));
  // 如果排序后众数对应的高（字符串，在首位）的频次与第二位相同，
  // 则有可能未进行排序，返回去重数组
  /*  if (num[modeArr[0]] != num[modeArr[1]]) {
     return Number(modeArr[0]);
   } else {
     return Object.keys(num).map(e => Number(e));
     //return Object.keys(num);
   } */
};

/**
 * 数组元素的值和其频数
 * @param item 
 * @returns 
 */
const frequency = (item: any[]) => {
  if (Array.isArray(item[0])) {
    item = item.flat(Infinity);
  }
  const num: { [key: string]: number; } = {};
  for (let i = 0; i < item.length; i++) {
    /* num[String(hh[i])] ??= 0 的作用是检查 num 对象中是否存在以
     hh[i] 的值作为属性名的属性。
    如果该属性的值为 null 或 undefined，则将其赋值为 0。
    如果该属性的值已经存在，那么不会进行任何操作。 */
    num[String(item[i])] ??= 0;
    num[String(item[i])] += 1;
  }
  return num;
};

/**
 * 如果对象的键为数字型字符，返回数字数组
 * 数字元素是乱序的，其对应的频次是按降序排列的
 * @param item 
 * @returns 
 */
const orderByFrequency = (num: { [key: string]: number; }) => {
  //const num = frequency(item);
  // 以 num 的键作为字符串数组，根据相应键的值为条件，实现高度字符串按众数排序
  const modeArr = Object.keys(num).sort((h1: string, h2: string) =>
    num[h2] - num[h1]
  );
  // 如果排序后众数对应的高（字符串，在首位）的频次与第二位相同，
  // 则有可能未进行排序，不相等则一定做过排序

  //所有键均为数值数字，否则无法运行
  /// if (Object.keys(num).filter(e => e.match(/^[0-9.]+$/g) != null).length == Object.keys(num).length) {
  if (Object.keys(num).filter(e => !isNaN(Number(e))).length == Object.keys(num).length) {
    const modeNumArr: number[] = modeArr.map((e: string) => Number(e));
    return modeNumArr;
  } else {
    return modeArr;
  }


};
const toLine = (item: PDFItem) => {
  const line: PDFLine = {
    x: item.transform[4],
    y: item.transform[5],
    text: item.str || "",
    height: item.height,
    width: item.width,
    url: item?.url,
    //item.height 的值作为数组的唯一元素赋给 _height 属性
    _height: [item.height],
    fontName: item.fontName,
    _fontName: [item.fontName],
    sourceLine: [item],
  };
  if (line.width < 0) {
    line.x = Math.round(line.width + line.x);
    line.width = -Math.round(line.width);
  }
  return line;
};

/**
 * @param items 
 * @returns 
 */

/**
 * 合并整行
 * 设置上下标
 * @param lastLine 上一行
 * @param line 当前行
 * @returns 
 */
const combineLine = (lastLine: PDFLine, line: PDFLine, fontStyle?: string) => {

  let lineTxt = line.text;
  //lineTxt = tipSpecialCharacter(lineTxt, specialCharacters);
  //下标
  if (lastLine.text != "") {
    if (isSub(lastLine, line)) {
      lineTxt = '<sub>' + lineTxt + '</sub>';
    }
    // 上标
    else if (isSup(lastLine, line)) {
      lineTxt = '<sup>' + lineTxt + '</sup>';
    }
    //如果上一行是上下标，则需判断，仅需把两行顺序调换传入即可
    else if (isSup(line, lastLine)) {
      lastLine.text = '<sup>' + lastLine.text + '</sup>';
    }
    else if (isSub(line, lastLine)) {
      lastLine.text = '<sub>' + lastLine.text + '</sub>';
    }
    else {
      // Y相等是避免上下标后面加多余空格，如果没有‘右括号’则上下标后面应该加空格

      /*       const reg = /^ /m;
            const reg2 = / $/m;
       reg2.test(lastLine.text) && !reg.test(line.text) && line.text != "") {
              lineTxt = " " + lineTxt;
            } */
      // 更新行的 Y值，取较低的值
      //在次处理避免判断下标 && !isSub(lastLine, line)
      if (lastLine.y - line.y > tolerance / 10) {
        lastLine.y = line.y;
      }
    }
  }
  if (fontStyle) {
    if (fontStyle == "bold") {
      lineTxt = "<strong>" + lineTxt + "</strong>";
    }
    if (fontStyle == "italic") {
      lineTxt = "<em>" + lineTxt + "</em>";
    }
  }
  //lastLine 已经是 lines 的元素，其 text 变化
  lastLine.text += lineTxt;
  lastLine.width += Math.round(line.width);
  //不再负责更新行的高度，//取较大值
  /*  if (lastLine.height < line.height) {
     lastLine.height = line.height;
   } */
  lastLine.url = lastLine.url || line.url;
  // 记录所有元素的高度,过滤掉0高
  if (line.height) {
    lastLine._height.push(line.height);
    if (!lastLine.height) {
      lastLine.height = line.height;
    }

  }
  lastLine._fontName.push(line.fontName);
  return lastLine;
};
const abs = (x: number) => x > 0 ? x : -x;


const strByFont = (strArr: any[], fontName: string, isRetrunObj: boolean, isSkipWhiteSpace: boolean) => {
  let strByFont;
  if (isSkipWhiteSpace) {
    if ((Object.prototype.hasOwnProperty.call(strArr[0], "text"))) {
      if (isRetrunObj) {
        strByFont = strArr.filter(e => e.text != '' && e.text != " ").filter(e => e.fontName == fontName);
      } else {

        strByFont = strArr.filter(e => e.text != '' && e.text != " ").filter(e => e.fontName == fontName).map(e => e.str);
      }
    } else {
      if (isRetrunObj) {
        strByFont = strArr.filter(e => e.str != '' && e.str != " ").filter(e => e.fontName == fontName);
      } else {

        strByFont = strArr.filter(e => e.str != '' && e.str != " ").filter(e => e.fontName == fontName).map(e => e.str);
      }
    }
  } else {
    if (isRetrunObj) {
      strByFont = strArr.filter(e => e.fontName == fontName);
    } else {
      if ((Object.prototype.hasOwnProperty.call(strArr[0], "text"))) {
        strByFont = strArr.filter(e => e.fontName == fontName).map(e => e.text);
      } else {
        strByFont = strArr.filter(e => e.fontName == fontName).map(e => e.str);
      }
    }
  }
  return strByFont;
};

/**
 * PDFLine,PDFItem类型的任何层次的数组均可
 * @param allItem 
 * @param isSkipClearCharaters 
 * @returns 
 */
const fontInfo = (allItem: any[], isSkipClearCharaters: boolean) => {
  /*   if (!allItem.length) { return; } */
  if (Array.isArray(allItem[0])) {
    allItem = allItem.flat(Infinity);
  }
  const check = allItem;
  let arrTemp;
  if (isSkipClearCharaters) {
    if (Object.prototype.hasOwnProperty.call(allItem[0], 'text')) {
      arrTemp = allItem.filter((e: PDFLine) =>
        e.text != ''
        && e.text.match(/^\s+$/g) == null
        && !e.text.includes("\\u00")
        && e.text.match(/[\u0000-\u001f]/) == null);
    } else {
      arrTemp = allItem.flat(Infinity).filter((e: PDFItem) =>
        e.str != ''
        && e.str.match(/^\s+$/g) == null
        && !e.str.includes("\\u00")
        && e.str.match(/[\u0000-\u001f]/) == null);
    }
  } else {
    arrTemp = allItem;
  }

  const fontArr = arrTemp.map((e: any) => e["fontName"]);
  const fontObj = frequency(fontArr);
  const fontOrder = orderByFrequency(fontObj) as string[];
  /*   const arrTemp = lineArr.flat(Infinity).filter((e: any) => !e.str.includes("\\u000")); */
  const strNoDuplicateByFont: any = {};
  for (let i = 0; i < fontOrder.length; i++) {
    //排除特殊字符,降低字体判断复杂度    
    const strByFontArr = strByFont(arrTemp, fontOrder[i], false, true);
    const newArr = [...new Set(strByFontArr)];
    if (newArr.length) {
      strNoDuplicateByFont[fontOrder[i]] = newArr.length;
    }
  }
  //去重字符串的数量组成数组然后降序排序
  const strNoDuplicateOrderByFont = Object.values(strNoDuplicateByFont).sort((a, b) => (b as number) - (a as number));
  return {
    fontFrequency: fontObj,
    fontOrderByFrequency: fontOrder,
    strNoDuplicateByFont: strNoDuplicateByFont,
    strNoDuplicateOrderByFont: strNoDuplicateOrderByFont,
  };
};


const fontStyle = (item: PDFItem, lineItem: PDFItem[], fontInfoObj: any) => {
  const fontOrder = fontInfoObj.fontOrderByFrequency;
  const strNoDuplicateByFont = fontInfoObj.strNoDuplicateByFont;
  const strNoDuplicateOrderByFont = fontInfoObj.strNoDuplicateOrderByFont;
  const lineFontArr = [...new Set(lineItem.filter(e => !e.str.includes("\\u000")).map(e => e.fontName))];
  let lineFontStyle;
  if (lineFontArr.length <= 1) {
    return {
      lineMainFont: lineFontArr[0],
    };
  }
  //根据本页字体确认该行正文字体，主字体
  //本行字体数组依据在本页字体顺序中的位置排序
  lineFontArr.sort((a, b) => fontOrder.indexOf(a) - fontOrder.indexOf(b));
  const lineMainFont = lineFontArr[0];
  if (item.fontName == lineMainFont) {
    return {
      lineMainFont: lineMainFont,
    };
  }
  if (item.str.includes("\\u000")
    || item.str.match(/[\u0000-\u001f]/) != null
    || item.str.match(/^\s+$/g) != null
    || item.str == ""
  ) {
    return {
      lineMainFont: lineMainFont,
    };
  }

  const strCountsLine = strNoDuplicateByFont[item.fontName];
  const linefontIndex = strNoDuplicateOrderByFont.indexOf(strCountsLine);
  //先一律设为斜体
  if (linefontIndex == 1) {
    lineFontStyle = "italic";
  }
  if (linefontIndex == 2) {
    lineFontStyle = "italic";
  }
  return {
    lineMainFont: lineMainFont,
    lineFontStyle: lineFontStyle,
  };
};

const clearCharactersDisplay = (pdfItem: PDFItem) => {
  if (pdfItem.str.match(/[\u0000-\u001f]/) != null) {
    let temp = '';
    for (let j = 0; j < pdfItem.str.length; j++) {
      if (pdfItem.str[j].match(/[\u0000-\u001f]/) != null) {
        temp += ('❓' + '\\u' + pdfItem.str.charCodeAt(j).toString(16).padStart(4, "0") + '❓');
      } else {
        temp += pdfItem.str[j];
      }
    }
    pdfItem.str = temp;
  }
};

/**
 * 转为一个整行
 * 属性含原信息
 * @param items 
 * @returns 
 */
const mergePDFItemsToPDFLineByHasEOL = (items: PDFItem[]) => {
  if (!items.length) { return; }
  if (!Object.prototype.hasOwnProperty.call(items[0], 'hasEOL')) { return; }
  const lineArr: PDFItem[][] = [];
  let lines: PDFItem[] = [];
  for (let i = 0; i < items.length; i++) {
    //特殊字符转换
    clearCharactersDisplay(items[i]);
    //通过？和 ||false 减低复杂度
    const heightDifferent = abs(items[i].transform[5] - items[i + 1]?.transform[5]) > items[i + 1]?.transform[3] || false;
    const heightDifferentAround = abs(items[i - 1]?.transform[5] - items[i + 1]?.transform[5]) > items[i].transform[3] || false;
    if (heightDifferent) {
      lines.push(items[i]);
      lineArr.push(lines);
      lines = [];
    } else if (items[i].str == '' && heightDifferentAround && items[i].hasEOL) {
      if (lines.length) {
        lineArr.push(lines);
        lines = [];
      }
      lines.push(items[i]);
    } else {
      //即便hasEOL为true，但在一行，也不换行
      //可能是斜体上下标等
      lines.push(items[i]);
    }
  }
  if (lines.length) {
    lineArr.push(lines);
  }
  return lineArr;
};
function mergeSameLineNoHasEOL(items: PDFItem[]) {
  if (!items.length) { return; }
  let j = 0;
  const lines: PDFItem[][] = [];
  clearCharactersDisplay(items[j]);
  lines.push([items[j]]);
  for (j = 1; j < items.length; j++) {
    //将当前文本项转换为文本行对象
    const pdfItem = items[j];
    clearCharactersDisplay(items[j]);
    //获取上一个文本行对象，
    const lastPdfItem = lines.slice(-1)[0][0];
    const lasty = parseFloat(lastPdfItem.transform[5].toFixed(3));
    const itemy = parseFloat(pdfItem.transform[5].toFixed(3));
    const lastHeight = parseFloat(lastPdfItem.transform[3].toFixed(3));
    const itemHeight = parseFloat(pdfItem.transform[3].toFixed(3));

    if (abs(lasty - itemy) > lastHeight + 0.5) {
      lines.push([pdfItem]);
      continue;
    } else {
      lines.slice(-1)[0].push(pdfItem);
    }
  }
  return lines;
}

const makeLine = (lineArr: PDFItem[][]) => {
  // 行数组中的元素合并成行，判断上下标，粗斜体
  const linesCombined = [];
  const fontInfoObj = fontInfo(lineArr, true);
  //for (const lineItem of lineArr) {
  for (let i = 0; i < lineArr.length; i++) {
    const lineItem: PDFItem[] = lineArr[i];
    if (!lineItem.length) { continue; }
    // 行数组的首个元素转换为PDFLine类型，作为行首，即前一行（或上一小行）
    const lastLine = toLine(lineItem[0] as PDFItem);
    //字体
    const fontInfo = fontStyle(lineItem[0], lineItem, fontInfoObj);
    lastLine.fontName = fontInfo?.lineMainFont ? fontInfo?.lineMainFont : lineItem[0].fontName;
    const lastLineFontStyle = fontInfo?.lineFontStyle;
    const lineTxt = lastLine.text;
    if (lastLineFontStyle) {
      if (lastLineFontStyle == "bold") {
        lastLine.text = "<strong>" + lineTxt + "</strong>";
      }
      if (lastLineFontStyle == "italic") {
        lastLine.text = "<em>" + lineTxt + "</em>";
      }
    }
    //增加属性，lineItem 原信息，后续分段落需要
    lastLine.sourceLine = [lineItem[0]];
    lastLine.lineIndex = i;
    // 如果该行为单独一整行，仅有一个元素，无需判断上下标，
    // 如果该行和前后行实际是一行(y相同），则需要判断上下标
    if (lineItem.length > 1) {
      for (let i = 1; i < lineItem.length; i++) {
        const line = toLine(lineItem[i]);
        lastLine.sourceLine.push(lineItem[i]);
        const lineFontStyle = fontStyle(lineItem[i], lineItem, fontInfoObj)?.lineFontStyle;
        //上一行的在合并中属性不断变化，最后成为一整行
        //是空字串也需要合并属性
        combineLine(lastLine, line, lineFontStyle);
      }
      //获取宽度最长的高
      if (lastLine.sourceLine.length > 1) {
        const heightFrequency = frequency(lastLine.sourceLine.map(e => e.height));
        let widthLong = 0;
        let widthShort = 0;
        const heightFrequencyArr = Object.keys(heightFrequency).filter(e => e != "0");


        let widthLongHeight = Number(heightFrequencyArr[0]);
        if (heightFrequencyArr.length > 1) {
          for (let i = 0; i < heightFrequencyArr.length; i++) {
            const temp = lastLine.sourceLine.filter(e => e.height == Number(heightFrequencyArr[i])).map(e => e.width);
            widthShort = temp.reduce((acc, cur) => acc + cur, 0);
            if (widthShort > widthLong) {
              widthLong = widthShort;
              widthLongHeight = Number(heightFrequencyArr[i]);
            }
          }
          //lastLine.height = getMode(lastLine._height.filter(e => e))[0];
          lastLine.height = widthLongHeight;
        } else {
          lastLine.height = Number(heightFrequencyArr[0]);
        }
      } else {
        lastLine.height = lastLine.sourceLine[0].height;
      }
    }
    linesCombined.push(lastLine);
  }
  return linesCombined;

};
/**
 * 判断A和B两个矩形是否几何相交
 * @param A 
 * @param B 
 * @returns 
 */
function isIntersect(A: Box, B: Box): boolean {
  if (
    B.right < A.left ||
    B.left > A.right ||
    B.bottom > A.top ||
    B.top < A.bottom
  ) {
    return false;
  } else {
    return true;
  }
}



/**
 * 判断两行是否是跨页同位置行
 * @param lineA 
 * @param lineB 
 * @param maxWidth 
 * @param maxHeight 
 * @returns 
 */
function isIntersectLines(lineA: any, lineB: any, maxWidth: number, maxHeight: number) {
  const rectA = {
    left: lineA.x / maxWidth,
    right: (lineA.x + lineA.width) / maxWidth,
    bottom: lineA.y / maxHeight,
    top: (lineA.y + lineA.height) / maxHeight
  };
  const rectB = {
    left: lineB.x / maxWidth,
    right: (lineB.x + lineB.width) / maxWidth,
    bottom: lineB.y / maxHeight,
    top: (lineB.y + lineB.height) / maxHeight
  };
  return isIntersect(rectA, rectB);
}


const splitPara = (lines: PDFLine[], lastLine: PDFLine, currentLine: PDFLine, i: number, nextLine?: PDFLine, infoParas?: any) => {
  let isNewParagraph = false;
  const paraCondition: any = {
    condition: '',
    currentLine: currentLine,
    lastLine: lastLine,
    nextLine: nextLine,
  };
  if (longSpaceCounts(currentLine) == 1) {
    isNewParagraph = true;
    paraCondition["condition"] += `悬挂缩进 if(currentLine.fontName != lastLine.fontName)`;
  }
  if (currentLine.fontName != lastLine.fontName) {
    isNewParagraph = true;
    paraCondition["condition"] += `主字体不同 if(currentLine.fontName != lastLine.fontName)`;
  }
  if (currentLine._height.filter(e => e).some((h2: number) => lastLine._height.filter(e2 => e2).every(e3 => h2 / e3 > 1.5))) {
    isNewParagraph = true;
    //当前行如果有很大的字，可能是新段落
    //但下一行和该行可以是一段 && currentLine._height.some((h2: number) => h2 / nextLine.height > 1.5)
    paraCondition["condition"] += `(currentLine._height.some((h2: number) => h2 / lastLine.height > 1.5)`;
  }
  if (/^(<[^<>]+?>)*abstract(<\/[^<>]+?>)*/im.test(currentLine.text)
    || /^\W*(<[^<>]+?>)*references(<\/[^<>]+?>)*\W*$/im.test(currentLine.text)) {
    isNewParagraph = true;
    paraCondition["condition"] += `if (/^abstract/im.test(currentLine.text) || /^\W+references\W+$/im.test(currentLine.text))`;
  }
  if (currentLine.height / lastLine.height > 1.1 || currentLine.height / lastLine.height < 0.9) {
    isNewParagraph = true;
  }

  if (!nextLine) {
    if (lastLine.lineSpace && currentLine.lineSpace) {
      paraCondition["condition"] += ` if (lastLine.lineSpace && currentLine.lineSpace)`;
      //行间距大于上两行，但小于2倍上一行的高，可不分但不错分
      if (currentLine.lineSpace - lastLine.lineSpace > 0.5
        && currentLine.lineSpace - lastLine.lineSpace > 1.5 * lastLine.height) {
        paraCondition["condition"] += ` && (currentLine.lineSpace - lastLine.lineSpace > 0.5
            && currentLine.lineSpace - lastLine.lineSpace < 2 * lastLine.height)`;
        if (abs(lastLine.lineSpace - lines[i - 2].lineSpace!) < 0.5) {
          isNewParagraph = true;
          paraCondition["condition"] += `&& 上两行间距相等 (abs(lastLine.lineSpace - lines[i - 2].lineSpace!) < 0.5)`;
        } else if (currentLine.y == infoParas.yOrder[0]) {
          isNewParagraph = true;
          paraCondition["condition"] += `&& 最低位，中间无图那种情况 (currentLine.y == infoParas.yOrder[0] )`;
        }
      }
    } else if (currentLine.x > lastLine.x + 16 && !longSpaceCounts(currentLine)) {
      //非悬挂，确认缩进就换行，
      isNewParagraph = true;
    }

  } else {
    // 当前行较上下行明显缩进，避免悬挂分段时错误分段
    if ((currentLine.x > lastLine.x + tolerance && currentLine.x > nextLine.x + tolerance)
      && !longSpaceCounts(lastLine) && !longSpaceCounts(nextLine) && currentLine.fontName == lastLine.fontName) {
      isNewParagraph = true;
      paraCondition["condition"] += `if ((currentLine.x > lastLine.x + tolerance && currentLine.x > nextLine.x + tolerance)
      && !hasLongSpace(lastLine)&& !hasLongSpace(nextLine)&&currentLine.fontName==lastLine.fontName)`;
    }
    //右侧明显比上一行更靠右
    else if (currentLine.x > lastLine.x + 16 && !longSpaceCounts(currentLine)) {
      isNewParagraph = true;
      paraCondition["condition"] += `i(currentLine.x > lastLine.x + 16 && !hasLongSpace(currentLine))`;
    } else if (nextLine.lineSpace && lastLine.lineSpace && currentLine.lineSpace) {
      //该行行间距大于上下两行的行间距
      paraCondition["condition"] += ` (nextLine.lineSpace&&lastLine.lineSpace && currentLine.lineSpace)`;
      if (currentLine.lineSpace - lastLine.lineSpace > 1.5 * lastLine.height
        && currentLine.lineSpace - nextLine.lineSpace > 1.5 * nextLine.height
        && lastLine.y > currentLine.y && currentLine.y > nextLine.y) {
        isNewParagraph = true;
        paraCondition["condition"] += `&&  (currentLine.lineSpace - lastLine.lineSpace > 1.5 * lastLine.height
        &&currentLine.lineSpace - nextLine.lineSpace > 1.5 * nextLine.height)`;
      }
    }
  }
  const text1 = currentLine.text;
  const text2 = lastLine.text;
  if (nextLine !== undefined) {
    const text3 = (nextLine as PDFLine).text;
  }
  const test2 = isNewParagraph;
  const test3 = paraCondition.condition;
  const check = infoParas;
  return {
    isNewParagraph: isNewParagraph,
    paraCondition: paraCondition
  };
};


const removeNumber = (text: string) => {
  // 删除英文页码
  //整行只有 1-3 个大写英文字母
  if (/^[A-Z]{1,3}$/.test(text)) {
    text = "";
  }
  // 删除空格、页码部分、清楚后末尾的非单词字符
  text = text.replace(/\x20+/g, "").replace(/<\/?su[bp]>/g, "").replace(/<\/?em>/g, "").replace(/<\/?strong>/g, "").replace(/[\dⅠ-Ⅻⅰ-ⅹ]+([\w]{1,3})?([\dⅠ-Ⅻⅰ-ⅹ]+)?$/g, "").replace(/\d+/g, "").replace(/\W+$/g, "");
  return text;
};


/**
 * 删除页眉页脚
 * @param lines 
 * @param headerY 
 * @param footerY 
 * @returns 
 */
const cleanHeadFooter = (lines: PDFLine[], totalPageNum: number, headFooderTextArr: string[], headerY?: number, footerY?: number) => {
  // 左下角坐标的 y 加上行高加上容差如果超过页眉下边界限认为是页眉
  // 左下角坐标的 y 加上容差如果超过页脚下边界限认为是页脚
  //只有当所有条件都为 true 时，当前元素 e 才会被过滤掉

  const linesClean = lines.filter((e: any) =>
    !(e.forward || e.backward || (e.repeat && e.repeat > totalPageNum * 0.5)
      || (headerY && (e.y + e.height + 6) > headerY) || (footerY && (e.y < footerY + 6))));
  // 如果是首尾行并且和页眉页脚内容雷同（除外非单词内容）则舍弃，
  //比较 y 避免多次移除
  //以防该页与总体页眉页脚不一致的情况

  const lineText = removeNumber(linesClean[0].text);
  const lineTextEnd = removeNumber(linesClean.slice(-1)[0].text);
  headFooderTextArr.filter(e2 => {
    if ((lineText.includes(e2) || e2.includes(lineText))
      && linesClean[0].y == lines[0].y) {
      linesClean.splice(0, 1);
    };
    if ((lineTextEnd.includes(e2) || e2.includes(lineTextEnd))
      && linesClean.slice(-1)[0].y == lines.slice(-1)[0].y) {
      linesClean.splice(-1);
    };
  });
  return linesClean;
};

/**
 *  确认标题，可能不在第一页
 * @param title 
 * @param _pagePara 
 * @returns 
 */
const titleIdentify = (title: string, _pagePara: object) => {
  const pdfTitle = {
    "title": '',
    "para": {} as PDFParagraph,
  };

  const totalPageNum = Object.keys(_pagePara).length;
  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
    const _para: PDFParagraph[] = _pagePara[String(pageNum) as keyof typeof _pagePara];
    frequency((Object.values(_para).map(e => e.lineHeight)));
    const lineHeightArr = orderByFrequency(frequency(Object.values(_para).map(e => e.lineHeight))) as number[];
    const widthArr = orderByFrequency(frequency(Object.values(_para).map(e => e.width.toFixed(3)))) as number[];
    const lineHeightArrByV = lineHeightArr.sort((a, b) => b - a);
    const widthArrByV = widthArr.sort((a, b) => b - a);
    let skip = false;
    for (const p of _para) {
      const pwords = [...new Set(p.text.toLowerCase().split(' '))];
      const twords = [...new Set(title.toLowerCase().split(' '))];
      let combineNoduplicate = [...new Set(pwords.concat(twords as string[]))];
      combineNoduplicate = combineNoduplicate.filter(e => e.match(/<[^<>]+>/g) == null);
      const counts = (pwords.length + twords.length) / 2;
      const factor = counts / combineNoduplicate.length;
      let isHasTitle = false;
      if ((
        //和标题吻合
        p.text.toLowerCase() == title.toLowerCase()
        || (factor > 0.8 && abs(pwords.length - twords.length) < counts * 0.5)
      )) {
        //又高又长且非高的众数
        isHasTitle = true;
      } else if ((
        lineHeightArrByV.indexOf(p.lineHeight) == 0
        && widthArrByV.indexOf(p.width) == 0
        && lineHeightArr.indexOf(p.lineHeight) != 0
      )) {
        isHasTitle = true;
      } else if (
        //最高或最长
        ((lineHeightArrByV.indexOf(p.lineHeight) == 0
          && widthArrByV.indexOf(p.width) == 1)
          || (lineHeightArrByV.indexOf(p.lineHeight) == 1
            && widthArrByV.indexOf(p.width) == 0))
        && lineHeightArr.indexOf(p.lineHeight) != 0
      ) {
        isHasTitle = true;
      }
      if (isHasTitle) {
        pdfTitle.title = p.text;
        pdfTitle.para = p;
        p.type = "title";
        skip = true;
        break;
      }
    }
    if (skip) { break; }
  }
  if (pdfTitle.title != '') {
    return pdfTitle;
  };
};

//计算行间距

const lineSpace = (pdfLines: PDFLine[]) => {
  const lineSpaceArr = [];
  for (let i = 1; i < pdfLines.length; i++) {
    if (pdfLines[i - 1].y - pdfLines[i].y > 0) {
      let lineSpace = pdfLines[i - 1].y - (pdfLines[i].y + pdfLines[i].height);
      lineSpace = parseFloat(lineSpace.toFixed(1));
      pdfLines[i].lineSpace = lineSpace;
      lineSpaceArr.push(lineSpace);
    }
  }
  return lineSpaceArr;
};
const linesWidth = (pdfLines: PDFLine[]) => {
  const Arr = [];
  for (let i = 1; i < pdfLines.length; i++) {
    let width = pdfLines[i].width;
    width = Math.round(width);
    Arr.push(width);
  }
  return Arr;
};
const linesX = (pdfLines: PDFLine[]) => {
  const Arr = [];
  for (let i = 1; i < pdfLines.length; i++) {
    Arr.push(pdfLines[i].x);
  }
  return Arr;
};
const linesY = (pdfLines: PDFLine[]) => {
  const Arr = [];
  for (let i = 1; i < pdfLines.length; i++) {
    Arr.push(pdfLines[i].y);
  }
  return Arr;
};
const linesHeight = (pdfLines: PDFLine[]) => {
  const Arr = [];
  for (let i = 1; i < pdfLines.length; i++) {
    Arr.push(pdfLines[i].height);
  }
  return Arr;
};



/**
 * 获取某一属性的所有值
 * 数组
 * @param arr 
 * @param property 
 * @returns 
 */
const propertyArr = (arr: any[], property: string) => {
  if (Array.isArray(arr[0])) {
    arr = arr.flat(Infinity);
  }
  let Arr;
  if (Object.prototype.hasOwnProperty.call(arr[0], 'str')) {
    Arr = arr.filter(e => e.str != '' && e.str != " ").map((e: any) => e[property]);
  } else {
    Arr = arr.map((e: any) => e[property]);
  }
  return Arr;
};


//计算缩进
const getIndentation = (lines: PDFLine[], widthOrder: any[]) => {
  const indentationOrder = [];
  const indentationArr = [];
  for (let i = 0; i < lines.length; i++) {
    const indentationIndex = widthOrder.indexOf(Math.round(lines[i].width));
    if (indentationIndex != -1) {
      if (lines[i].width != lines[i + 1].width) {
        if (lines[i].fontName == lines[i + 1].fontName
          && abs(lines[i].height - lines[i + 1].height) < 0.02
          && lines[i].isReference == lines[i + 1].isReference
          && lines[i].pageIndex == lines[i + 1].pageIndex
          && lines[i].x > lines[i + 1].x
          //因为从频次排序表确定行宽，因此应当大于等于下一行的宽
          && lines[i].x + lines[i].width >= lines[i + 1].x + lines[i + 1].width
          && lines[i].y - lines[i + 1].y >= 0
          && lines[i].y - lines[i + 1].y <= 5 * lines[i].height) {
          const indentation = abs(lines[i].x - lines[i + 1].x);
          indentationArr.push({
            indentationIndex: indentation,
          });
        }
      }
    }
  }
  //依据频次排序筛选出缩进，然后取众数，之前条件应当已经除外了极端值
  for (let i = 0; i < widthOrder.length; i++) {
    const indentaionIArr = indentationArr.filter(e => e.indentationIndex === i).map(e => Object.values(e)[0]);
    const indentation = getMode(indentaionIArr)[0];
    //最终返回的数组按照频次排列行宽和缩进信息
    indentationOrder.push({
      width: widthOrder[i],
      indentation: indentation,
    });
  }
  return indentationOrder;
};
const getModeHigh = (lineHighArr: number[]) => {
  //众数可能不止一个，找到众数中较大的一个行高
  const hieghtFrequency = frequency(lineHighArr);
  const highOrder = orderByFrequency(hieghtFrequency) as number[];
  let modeHigh = 0;
  let highArr;
  for (let i = 1; i < highOrder.length; i++) {
    //查询出频次，如果相邻频次数相差悬殊时终止
    if (hieghtFrequency[highOrder[i - 1]] > 2 * hieghtFrequency[highOrder[i]] && hieghtFrequency[highOrder[i]] > 10) {
      highArr = highOrder.slice(0, i - 1) as number[];
      break;
    }
  }
  if (highArr && highArr.length > 2) {
    modeHigh = Math.max(...highArr);
  } else {
    modeHigh = highOrder[0];
  }
  return {
    hieghtFrequency: hieghtFrequency,
    highOrder: highOrder,
    modeHigh: modeHigh,
  };
};

const longSpaceCounts = (pdfLine: PDFLine) => {
  let spaceCounts = 0;
  if (pdfLine.sourceLine.length > 1) {
    let widthChara = 0;
    let counts = 0;
    pdfLine.sourceLine.filter(e => {
      if (e.str != " " && e.str != "") {
        widthChara += e.width;
        counts += e.chars.length;
      }
    });
    if (counts) {
      widthChara = widthChara / counts;
    }
    pdfLine.sourceLine.filter(e => {
      if (e.str == " " && e.width > 1.5 * widthChara) {
        spaceCounts += 1;
      }
    });
  } else {
    if (pdfLine.sourceLine[0].str == " " && pdfLine.sourceLine[0].width > 6)
      spaceCounts = 1;
  }
  return spaceCounts;
};

export async function pdf2documents(itmeID: number) {
  /* Zotero_Tabs.selectedID;
  Zotero.Reader.getByTabID; */
  await Zotero.Reader.open(itmeID, undefined, { allowDuplicate: false });
  const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance;
  const tabID = reader.tabID;
  const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
  await PDFViewerApplication.pdfLoadingTask.promise;
  await PDFViewerApplication.pdfViewer.pagesPromise;
  const pages = PDFViewerApplication.pdfViewer._pages;
  let totalPageNum = pages.length;
  const title = PDFViewerApplication._title.replace(" - PDF.js viewer", '');
  // 读取所有页面lines
  //函数内全局变量
  const pageLines: any = {};
  const pageParas: any = {};
  const _paraArr = [];
  const docs: string[] = [];

  //文本元素合并为行，组成行数组
  //每页的行数组作为元素再组成页面的数组
  //字符 ""单独为一行，帮助判断段落

  const itemsArr: PDFItem[][] = [];
  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
    const pdfPage = pages[pageNum].pdfPage;
    const textContent = await pdfPage.getTextContent();
    const items: PDFItem[] = textContent.items;
    /*     items.filter(e => {
          e.transform[5] = Math.round(e.transform[5] * 100) / 100;
          e.transform[4] = Math.round(e.transform[4] * 100) / 100;
          e.transform[3] = Math.round(e.transform[3] * 100) / 100;
          e.transform[0] = Math.round(e.transform[0] * 100) / 100;
          e.height = Math.round(e.height * 100) / 100;
          e.width = Math.round(e.width * 100) / 100;
        });*/
    itemsArr.push(items);

  }


  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {

    const pdfPage = pages[pageNum].pdfPage;
    const maxWidth = pdfPage._pageInfo.view[2];
    const maxHeight = pdfPage._pageInfo.view[3];
    const items = itemsArr[pageNum];
    const makeTable = (items: PDFItem[], maxWidth: number, maxHeight: number) => {
      //首先聚类判断是否有表格
      const spaceArr: PDFItem[] = [];
      const noneSpace: PDFItem[] = [];
      const xArr: number[] = [];
      const yArr: number[] = [];
      items.filter(e => {
        if (e.str == " " && e.width > 6) {
          spaceArr.push(e);
        }
        if (e.str != " ") {
          noneSpace.push(e);
          xArr.push(Number(new Decimal(e.transform[4]).toFixed(1, Decimal.ROUND_HALF_UP)));
          yArr.push(Number(new Decimal(e.transform[5]).toFixed(1, Decimal.ROUND_HALF_UP)));
        }
      });

      xArr.sort((a, b) => b - a);
      //const xArr = noneSpace.map(e => e.transform[4]).sort((a, b) => b - a);
      const xfrequency = frequency(xArr);
      const xfrequencyOrder = orderByFrequency(xfrequency) as number[];
      yArr.sort((a, b) => b - a);
      //const yArr = noneSpace.map(e => e.transform[5]).sort((a, b) => b - a);
      const yfrequency = frequency(yArr);
      const yfrequencyOrder = orderByFrequency(yfrequency);
      //必须使用Decimal，否则还会出现很长的小数
      //将y值等于本页最大最小y值的长空格排除掉？
      const spaceRightXs = spaceArr.map(e => {
        if (Math.round(e.transform[5] * 10) / 10 != yArr[0] && Math.round(e.transform[5] * 10) / 10 != yArr.slice(-1)[0]) {
          const num1 = new Decimal(e.width);
          const num2 = new Decimal(e.transform[4]);
          const num3 = (num1.add(num2)).toFixed(1, Decimal.ROUND_HALF_UP);
          return num3;
        }
      }).filter(e => e !== undefined);
      //const spaceRightXs = spaceArr.map(e => e.width + e.transform[4]);
      const spaceRightXsfrequency = frequency(spaceRightXs);
      const spaceRightXsOrder = orderByFrequency(spaceRightXsfrequency) as number[];
      const spaceRightXsOrderByValue = spaceRightXsOrder.map(e => e as number).sort((a, b) => b - a);

      //过滤单元格内容
      //定位列的位置，即长空格x+width，
      const tableXPdfItem: PDFItem[] = [];
      const noneCell: PDFItem[] = [];
      const tableXExcluded: any = [];

      //各列的长空格数目不一定相等
      //某一个单元格的定位长空格可能不止一个，也可能该单元无内容也就没有长空格      
      //长空格x加width定位的待验证单元格x
      items.filter(e => {
        const valid = [];
        const discard = [];
        for (let i = 0; i < spaceRightXsOrder.length; i++) {
          const tableX = Number(spaceRightXsOrder[i]);
          if (e.str == " "
            && e.width > 6
            //除外表格内的长空格
            && spaceRightXsOrder.includes(Math.round((e.transform[4] + e.width) * 10) / 10)) {
            //valid = [];
            valid.push(e);
          } else if
            ((e.transform[4] > tableX - 1
              || (e.transform[4] + e.width) < tableX + 0.5)
            && !tableXExcluded.includes(tableX)) {
            //tableX 不穿透 PdfItem
            //valid = [];
            valid.push(e);
          }
          else if ((e.transform[4] + e.width) > tableX + 1
            && e.transform[4] < tableX - 1
            && !tableXExcluded.includes(tableX)
          ) {
            //tableX 穿透 PdfItem,应当舍弃
            //如果单元格不齐呢？
            discard.push(e);
          }
        }
        if (valid.length && !discard.length) {
          tableXPdfItem.push(valid[0]);
        }
        if (discard.length) {
          noneCell.push(discard[0]);
        }
      });

      //查找列x，该x不穿透任何单元格，排除空格和空字符
      const findColumnX = (items: PDFItem[]) => {
        const xfrequency = frequency(items.map(e => Math.round(e.transform[4] * 10) / 10));
        const xorderByFrequency = orderByFrequency(xfrequency);
        const valid: number[] = [];
        const invalid: number[] = [];
        const invalide: any[] = [];
        for (let i = 0; i < xorderByFrequency.length; i++) {
          const tableX = Number(xorderByFrequency[i]);
          //some不支持continue和break，false结束本次循环

          if (items.some((e, i) => {
            if (e.str == " " || e.str == "") { return false; }
            if (((e.transform[4] + e.width) > tableX + 1 && e.transform[4] < tableX - 1)) {
              invalide.push(e);
              const rx = e.transform[4] + e.width;
              const lookk = 1;
              return true;
            } else {
              //如果前面有内容，则 x失效
              if (i != 0 && items[i - 1].hasEOL == false && items[i - 1].str != " " && items[i - 1].width
                && Math.round(items[i - 1].transform[5] * 10) / 10 == Math.round(e.transform[5] * 10) / 10) {
                invalide.push(e);
                const rx = e.transform[4] + e.width;
                const lookk = 1;
                return true;
              }


            }
          })) {
            invalid.push(tableX);
            continue;
          } else {
            valid.push(tableX);
          }
        };
        return valid;
      };


      const validCell = tableXPdfItem.filter(e =>
        !noneCell.some(e2 => Math.round(e2.transform[5] * 10) / 10 == Math.round(e.transform[5] * 10) / 10));
      const ColumnX = findColumnX(validCell);
      const look = 1;

      /*  const tableArr: any[] = [];
       let lastSpaceCount = 0;
       let currentSpaceCount = 0;
       let lastIndex = 0;
       lines.filter((e, i) => {
         currentSpaceCount = longSpaceCounts(e);
         if (currentSpaceCount >= 1) {
           if (!tableArr.length) {
             tableArr.push([e]);
           } else {
             if (lastIndex + 1 == i) {
               tableArr.slice(-1).push(e);
             } else {
               //如果序号不连续，最后元素进一个元素，可能为有序或无需列表
               if (tableArr.slice(-1).length <= 1)
                 tableArr.splice(-1);
               tableArr.push([e]);
             }
           }
           lastSpaceCount = currentSpaceCount;
           lastIndex = i;
         }
       });
       const check = tableArr; */

    };
    makeTable(items, maxWidth, maxHeight);
  }
  //测试
  //return;






  const linesArr: PDFLine[][] = [];
  //给行添加 pageLines和 isReference 属性
  let refMarker = 0;
  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
    const lines1 = mergePDFItemsToPDFLineByHasEOL(itemsArr[pageNum])!;
    const lines = makeLine(lines1);
    linesArr.push(lines);
    lineSpace(lines);
    pageLines[pageNum] = lines.map((e: PDFLine) => {
      e.pageIndex = pageNum;
      if (refMarker == 0) {
        if ((/^\W*(<[^>]+>)*references(<\/[^>]+>)*\W*$/img.test(e.text))) {
          refMarker = 1;
        }
      } else {
        e.isReference = true;
      }
      return e;
    });
  }
  //按参考文献分成两部分
  const tempAllLines = linesArr.flat(Infinity) as PDFLine[];
  let refIndex = 0;
  let skip = 0;
  const contentLineHighArr: number[] = [];
  const refLineHighArr: number[] = [];
  const contentLines = [];
  const referencesLines = [];
  for (let i = 0; i < tempAllLines.length; i++) {
    if (skip == 0 && (/^\W*(<[^>]+>)*references(<\/[^>]+>)*\W*$/img.test(tempAllLines[i].text))) {
      refIndex = i;
      skip = 1;
    }
    if (refIndex == 0 || i < refIndex) {
      contentLines.push(tempAllLines[i]);
      contentLineHighArr.push(tempAllLines[i].height);

    } else {
      referencesLines.push(tempAllLines[i]);
      refLineHighArr.push(tempAllLines[i].height);
    }
  }
  const contentFontInfo = fontInfo(contentLines, true);

  // 获取页眉页脚信息，将信息作为行属性添加到相应行
  totalPageNum = Object.keys(pageLines).length;
  const headerY0: number = pages[1].pdfPage._pageInfo.view[3] + 10;
  const footerY0 = 0;
  const headFooterY: number[] = [];
  const removeLines = new Set();
  //判断并标记每一行是否属于页眉页脚
  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
    const pdfPage = pages[pageNum].pdfPage;
    const maxWidth = pdfPage._pageInfo.view[2];
    const maxHeight = pdfPage._pageInfo.view[3];
    //当前页的行对象数组
    const lines = [...pageLines[pageNum]];
    // 是否为重复
    const isRepeat = (line: PDFLine, _line: PDFLine) => {
      const text = removeNumber(line.text);
      const _text = removeNumber(_line.text);
      //比较两行文本是否相同，以及 位置是否相同
      return text == _text && isIntersectLines(line, _line, maxWidth, maxHeight);
    };
    // 存在于数据起始结尾的无效行
    for (const i of Object.keys(pageLines)) {
      //不比较同一页面
      if (Number(i) == pageNum) { continue; }
      // 两个不同页，开始对比
      // 未使用...解构则会出错
      const _lines = [...pageLines[i]];
      /* 定义前后方向是为了比较当前页和其他页之间的行是否重复。
        通过比较两个不同页的行，可以找出重复的行并进行处理。
        通过 factor 计算可以定位到页面的第一行或最后一行 */
      const directions = {
        forward: {
          factor: 1,
          done: false
        },
        backward: {
          factor: -1,
          done: false
        }
      };
      // 如果不同页面的第一句或最后一句判断不是重复的，则标记为本页前向或后向已完成
      for (let offset = 0; offset < lines.length && offset < _lines.length; offset++) {
        ["forward", "backward"].forEach((direction: string) => {
          if (directions[direction as keyof typeof directions].done) { return; }
          const factor = directions[direction as keyof typeof directions].factor;
          const index = factor * offset + (factor > 0 ? 0 : -1);
          const line = lines.slice(index)[0];
          const _line = _lines.slice(index)[0];
          const sss = line.text;
          const ssss = _line.text;
          if (isRepeat(line, _line)) {
            // 认为是相同的
            line[direction] = true;
            removeLines.add(line);
          } else {
            directions[direction as keyof typeof directions].done = true;
          }
        });
      }
      // 内部的
      // 设定一个百分百正文区域防止误杀
      const content = { x: 0.2 * maxWidth, width: .6 * maxWidth, y: .2 * maxHeight, height: .6 * maxHeight };
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        if (isIntersectLines(content, line, maxWidth, maxHeight)) { continue; }
        for (let k = 0; k < _lines.length; k++) {
          const _line = _lines[k];
          if (isRepeat(line, _line)) {
            line.repeat = line.repeat == undefined ? 1 : (line.repeat + 1);
            line.repateWith = _line;
            removeLines.add(line);
          }
        }
      }
    }
  }
  //获取页眉页脚的 Y
  let headFooderTextArr: string[] = [];
  for (const line of removeLines as Set<{ y: number; text: string; }>) {
    const y = line.y as number;
    headFooterY.push(y);
    headFooderTextArr.push(removeNumber(line.text));
  }
  headFooderTextArr = [...new Set(headFooderTextArr)];
  headFooderTextArr = headFooderTextArr.filter((e: any) => e != undefined && e != null && e != "");

  // 统计数组重复元素及其出现的次数
  const resultY = headFooterY.reduce((acc: { [key: number]: number; }, el) => {
    acc[el] = (acc[el] + 1) || 1;
    return acc;
  }, {});
  //Y去重
  let headerY: number = 0;
  let footerY: number = 0;
  const Yclean = Object.keys(resultY).sort((a: string, b: string) => Number(a) - Number(b));
  if (Yclean.length > 1) {
    headerY = Number(Yclean.slice(-1)[0]);
    footerY = Number(Yclean[0]);
  } else {
    Number(Yclean[0]) >= 300 ? headerY = Number(Yclean[0]) : footerY = Number(Yclean[0]);
  }
  //如果页眉或页脚出现的次数小于总页数的一半，则认为没有页眉或页脚
  if (resultY[Number(Yclean.slice(-1)[0])] < totalPageNum * 0.5) {
    headerY = headerY0;
  }
  if (resultY[Number(Yclean[0])] < totalPageNum * 0.5) {
    footerY = footerY0;
  }


  //recordCombine记录需要跨页合并的行，跨越多行合并，行顺序颠倒合并
  const recordCombine: any = {};
  //pagePara对象，键为页码，值为段落组成的数组
  const pagePara: { [key: string]: PDFLine[][]; } = {};
  //记录分段的判断条件
  const paraCondition: any = {};

  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
    //paragraphs数组,每页都初始化为空
    const paragraphs = [];
    pagePara[pageNum] = [] as PDFLine[][];
    //先定义空数组，如何没有数据 push 进来，则该页数组长度为 0
    recordCombine[pageNum] = [];
    paraCondition[pageNum] = [];
    //当前页的行对象数组
    let linesTemp: PDFLine[] = [...pageLines[pageNum]];
    //删除当前页的页眉页脚，返回当前页的行
    const lines = cleanHeadFooter(linesTemp, totalPageNum, headFooderTextArr, headerY, footerY);
    //防止空行中断
    if (!lines.length) { continue; }
    //释放内存
    //linesTemp.length =0 有可能影响引用的数组
    linesTemp = [];



    // 段落聚类; 原则：字体从大到小，合并；从小变大，断开
    //定义段落数组，将本页第一行转为数组放入段落数组内
    const linesYArr = lines.map((e) => e.y);
    const Ymin = Math.min(...linesYArr);
    paragraphs.push([lines[0]]);
    pagePara[pageNum].push([lines[0]]);
    //如果本页行中元素大于1，否则跳过该步骤
    if (lines.length > 1) {

      //整篇文章差异很大，单页获取
      const xFrequency = frequency(linesX(lines));
      const xOrder = orderByFrequency(xFrequency);
      const yFrequency = frequency(linesY(lines));
      const yOrder = orderByFrequency(yFrequency);
      const hFrequency = frequency(linesHeight(lines));
      const hOrder = orderByFrequency(hFrequency);
      const widthFrequency = frequency(linesWidth(lines));
      const widthOrder = orderByFrequency(widthFrequency);
      const spaceFrequency = frequency(lineSpace(lines));
      const spaceOrder = orderByFrequency(spaceFrequency);
      const indentation = getIndentation(lines, widthOrder);
      const font = fontInfo(lines, true);
      const infoParas = {
        xFrequency: xFrequency,
        xOrder: xOrder,
        yFrequency: yFrequency,
        yOrder: yOrder,
        hFrequency: hFrequency,
        hOrder: hOrder,
        widthFrequency: widthFrequency,
        widthOrder: widthOrder,
        spaceFrequency: spaceFrequency,
        spaceOrder: spaceOrder,
        indentation: indentation,
        font: font,
      };


      // 本页行按段落分组，每行仅一个元素
      const paraCondArr = [];
      for (let i = 1; i < lines.length; i++) {
        const lastLine: PDFLine = paragraphs.slice(-1)[0].slice(-1)[0];
        const currentLine: PDFLine = lines[i];
        const nextLine: PDFLine | undefined = lines[i + 1] || undefined;
        const tempObj = splitPara(lines, lastLine, currentLine, i, nextLine, infoParas);
        const paraCond = tempObj.paraCondition;
        const condition = tempObj.isNewParagraph;
        if (condition) {
          paraCondArr.push(paraCond);
        }
        if (condition) {
          paragraphs.push([currentLine]);
          pagePara[pageNum].push([currentLine]);
        }
        // 否则纳入当前段落
        else {
          paragraphs.slice(-1)[0].push(currentLine);
          pagePara[pageNum].slice(-1)[0].push(currentLine);
        }
        //记录字体位于前三
        if (infoParas && infoParas.font.fontOrderByFrequency.indexOf(currentLine.fontName) < 3) {
          if (currentLine.width > lastLine.width * 0.9
            && currentLine.x - lastLine.x < 2
            //跳过整句，句子完整不影响翻译。
            && currentLine.text.match(/[^ 0-9][.?!"。？！]((<su[pb]>)?([\(\[]{0,2}[0-9]([0-9-,\[\]]*[^\]\[])?[\)\]]{0,2})?(<\/su[pb]>)?)?$/gm) == null
          ) {
            if (i == lines.length - 1
              && currentLine.y == Ymin
            ) {
              recordCombine[pageNum].push(currentLine);
            }
            if (nextLine && i < lines.length - 1 && i != 0
              && currentLine.y < nextLine.y && abs(currentLine.y - Ymin) < 0.1
            ) {
              recordCombine[pageNum].push(currentLine);
            }
          }
        }
      }
      paraCondition[pageNum] = paraCondArr;
    }
  }

  //高度从大到小
  const heightOrder = [...new Set(contentLineHighArr)];
  if (heightOrder.length >= 2) {
    heightOrder.sort((a, b) => b - a);
  }
  //众数可能不止一个，找到众数中较大的一个行高
  const modeHigh = getModeHigh(contentLineHighArr).modeHigh;

  //找页中顺序要调整的到段落
  //找到页间需要合并的段落
  for (const pageNum of Object.keys(recordCombine)) {
    const lines: PDFLine[] = recordCombine[pageNum];
    //每页颠倒顺序的段落可能为多处
    if (!lines || !lines.length) { continue; }
    for (const line of lines) {
      //line是定位行，通过行序号索引所在段落，跳过下一个段落，定位间隔后的段落是否需要合并
      /*       const lineIndex = line.lineIndex! + 1;
            const pageIndex = line.pageIndex; */
      const pageParaArr = pagePara[pageNum] as PDFLine[][];

      for (let i = 0; i < pageParaArr.length; i++) {
        let find = 0;
        for (let j = 0; j < pageParaArr[i].length; j++) {
          if (pageParaArr[i][j].lineIndex == line.lineIndex) {
            //先找到定位行所在段落，即 pageParaArr[i]         
            //如果为最后一行，则为正常换页，需和后面多页比较，因为可能中间还间隔其他内容
            if (i == pageParaArr.length - 1 && j == pageParaArr[pageParaArr.length - 1].length - 1) {
              for (let pageNum2 = Number(pageNum) + 1; pageNum2 < totalPageNum; pageNum2++) {
                let skip = 0;
                for (let m = 0; m < pagePara[pageNum2].length; m++) {
                  //页、段、段的第一行
                  const targetLine = pagePara[pageNum2][m][0];
                  if (longSpaceCounts(targetLine) == 1) {
                    //如果为悬挂缩进则无需合并
                    skip = 1;
                    break;
                  }
                  //字体相同行高相同认为需合并
                  if (line.fontName == targetLine.fontName
                    && abs(line.height - targetLine.height) < 0.1) {
                    //不得调整顺序，只能合并数组，最后过滤掉空数组
                    //用push不要用concat，后者不改变原数组
                    pageParaArr[i].push(...pagePara[pageNum2][m]);
                    pagePara[pageNum2][m] = [];
                    skip = 1;
                    break;
                  }
                }
                if (skip) {
                  break;
                }
              }
            } else {
              //页面有图片等内容导致正文位置在下但序号在前
              //跳过本页中位置高于定位行序号在其后的段落，如果本页还有内容则判断是否合并，否则需要换页判断
              //比较 y 值  
              let nextPage = 1;
              for (let t = i + 1; t < pageParaArr.length; t++) {
                if (pageParaArr[i][j].y > pageParaArr[t][0].y) {
                  //找到后判断是否需要合并
                  if (line.fontName == pageParaArr[t][0].fontName
                    && abs(line.height - pageParaArr[t][0].height) < 0.1) {
                    pageParaArr[i].push(...pageParaArr[t]);
                    pageParaArr[t] = [];
                  }
                  nextPage = 0;
                  break;
                }
                if (nextPage) {
                  //如果没有则跨页比对
                  for (let pageNum2 = Number(pageNum) + 1; pageNum2 < totalPageNum; pageNum2++) {
                    let skip = 0;
                    for (let m = 0; m < pagePara[pageNum2].length; m++) {
                      const targetLine = pagePara[pageNum2][m][0];
                      if (line.fontName == targetLine.fontName
                        && abs(line.height - targetLine.height) < 0.1) {
                        pageParaArr[i].push(...pagePara[pageNum2][m]);
                        pagePara[pageNum2][m] = [];
                        skip = 1;
                        break;

                      } else {
                        //找不到一直找吗？
                        if (targetLine.height > modeHigh || targetLine.isReference) {
                          skip = 1;
                          break;
                        }
                      }
                    }
                    if (skip) {
                      break;
                    }
                  }
                }
                find = 1;
                break;
              }
            }
            if (find) {
              break;
            }
          }
        }
        if (find) {
          break;
        }
      }
    }
  }

  // 合并成段落文本
  //有个问题，表格跨页怎么办？需要先调整表格，页和页之间段落调整所以要分开处理
  //paragraphs数组为本页段落组成的数组
  // _pagePara[pageNum]页码作为对象的属性，其值初始化为空数组
  //_pagePara同pagePara
  const _pagePara: any = {};
  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
    _pagePara[pageNum] = [];
    for (let i = 0; i < pagePara[pageNum].length; i++) {
      //合并所有属于一个段落的 line
      if (!pagePara[pageNum][i].length) { continue; }
      let _paraText = "";
      let line: PDFLine;
      let nextLine: PDFLine;
      const _para: PDFParagraph = {
        lineHeight: 0,
        text: '',
        _height: [],
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        pageIndex: 0,
        width: 0,
        sourceLines: [],
        lines: [],
        isReference: false,
        lineSpace: 0,
      };
      for (let j = 0; j < pagePara[pageNum].length; j++) {

        line = pagePara[pageNum][i][j];
        //定义上一行和下一行，考虑跨越现有段落，段落为之前定义的数组     
        if (!line) { continue; }
        nextLine = pagePara[pageNum]?.[i][j + 1];
        if (nextLine) {
          const reg1 = /[ -]$/m;
          const reg2 = /^ /m;
          const reg3 = /-$/m;
          if (!reg1.test(line.text) && !reg2.test(nextLine.text)) {
            //本行和下一行比较，决定本行末尾是否加空格，当没有下一行，就不比较
            //下一行只用于比较，不添加它的文本
            _paraText += line.text + ' ';
            //删除末尾连字符
          } else if (reg3.test(line.text)) {
            _paraText += line.text.replace(reg3, '');

          }
          else {
            _paraText += line.text;
          }
        } else {
          _paraText += line.text;
        }
        _para._height.push(line.height);
        _para.sourceLines.push(line.sourceLine);
        if (!_para.lines) {
          _para.lines = [line];
        } else {
          _para.lines.push(line);
        }

        _para.isReference = line.isReference;
        //赋值段落参数
        if (_para.width == 0 || _para.width! < (line.width as number)) {
          _para.width = line.width;
        }
        if (_para.left == 0 || _para.left! > line.x) {
          _para.left = line.x;
        }
        if (_para.right == 0 || _para.right! < line.x + line.width) {
          _para.right = line.x + line.width;
        }
        if (_para.top == 0 || _para.top! < line.y + line.height) {
          _para.top = line.y + line.height;
        }

        if (_para.bottom == 0 || _para.bottom! > line.y) {
          _para.bottom = line.y;
        }
        if (_para.pageIndex == 0 || _para.pageIndex! < (line.pageIndex as number)) {
          _para.pageIndex = line.pageIndex ? line.pageIndex : 0;
        }

      }
      _paraText = _paraText.replace(/\x20+/g, " ").replace(/^\x20*\n+/g, "").replace(/\x20*\n+/g, "");
      _para.text = _paraText;
      const temp = getMode((_para._height as number[]));
      _para.lineHeight = typeof temp == "number" ? temp : Math.max(...temp);
      _para.fontName = fontInfo(_para.sourceLines, true)!.fontOrderByFrequency[0];
      if (_para.lines) {
        const para_lineSpace = _para.lines.map(e => e.lineSpace).filter(e => e !== undefined) as number[];
        if (para_lineSpace !== undefined && para_lineSpace.length) {
          _para.lineSpace = getMode(para_lineSpace)[0];
        }
      }
      _paraArr.push(_para);
      _pagePara[pageNum].push(_para);
    }
  }

  //确认标题，并剔除标题前无关内容。保存到变量 TitlBefore
  let TitlBefore;
  const pdfTitle = titleIdentify(title, _pagePara);
  if (pdfTitle) {
    const pdfPage = pages[pdfTitle.para.pageIndex].pdfPage;
    const maxHeight = pdfPage._pageInfo.view[3];
    const pagePara: PDFParagraph[] = _pagePara[pdfTitle.para.pageIndex];
    for (let i = 0; i < pagePara.length; i++) {
      if (pagePara[i].text == pdfTitle.title) {
        //pdf 排版不一定标题就在最前面，但高度是可以参照的
        // i>0代表标题前面有内容，可能非本篇文章的正文
        if (pagePara[i].top > 0.6 * maxHeight && i > 0) {
          TitlBefore = pagePara.splice(0, i);
        }
        break;
      }
    }
  }
  if (TitlBefore) {
    _pagePara[totalPageNum - 1].push(...TitlBefore);
  }


  const tagWrap = (titleIndex: number, item: string) => {
    if (titleIndex < 1 || titleIndex > 6) {
      return;
    }
    const tagBegin = '<h' + titleIndex + '>';
    const tagClose = '</h' + titleIndex + '>\n';
    item = tagBegin + item + tagClose;
    return item;
  };
  const spaceFrequency = frequency(lineSpace(contentLines));
  const spaceOrder = orderByFrequency(spaceFrequency);

  for (let p = 0; p < Object.keys(_pagePara).length; p++) {
    let findedTitle = 0;

    for (let i = 0; i < _pagePara[p].length; i++) {
      let skip;
      const para = _pagePara[p][i] as PDFParagraph;
      if (skip) {
        _pagePara[p][i].text = "<p>" + _pagePara[p][i].text + "</p>\n";
        docs.push(_pagePara[p][i].text);
      }
      if (para.isReference) {
        //发现 references 后 执行完此次循环，后续不在做标题判断，
        skip = 1;
      }
      const h = para.lineHeight as number;
      //行高索引号
      let titleIndex: number = heightOrder.indexOf(h) + 1;

      if (para.fontName && para.lineSpace) {
        if (
          !contentFontInfo.fontOrderByFrequency.slice(0, 2).includes(para.fontName)
          && para.lines?.length == 1
          && para.lineSpace! > 5 * Number(spaceOrder[0])
          && para.lineHeight >= modeHigh
        ) {
          if (titleIndex > 3) {
            titleIndex = 3;
          } else {
            titleIndex = 2;
          }
        }
      }

      //如果是标题，设为1,顺序不能错
      if (!findedTitle && pdfTitle) {
        if (pdfTitle.title == para.text) {
          titleIndex = 1;
          findedTitle = 1;
        }
      }

      if (titleIndex <= 3) {
        _pagePara[p][i].text = tagWrap(titleIndex, _pagePara[p][i].text) as string;
      } else {
        _pagePara[p][i].text = "<p>" + _pagePara[p][i].text + "</p>\n";
      }
      docs.push(_pagePara[p][i].text);
    }
  }
  if (pdfTitle == undefined) {
    const pdfTitle = "<h1>" + title + "</h1>" + "\n";
    docs.unshift(pdfTitle);
  }
  //任务完成关闭 pdf
  while (Zotero_Tabs.selectedID == tabID) {
    Zotero_Tabs.close(tabID);
    await Zotero.Promise.delay(1000);
  }
  return docs;
}
