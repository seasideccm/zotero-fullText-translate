/* import { Decimal } from 'decimal.js';
import { ColumnOptions } from 'zotero-plugin-toolkit/dist/helpers/virtualizedTable';
import { langCode_franVsZotero } from '../utils/config'; */
import { kMaxLength } from 'buffer';
import { getPref } from '../utils/prefs';

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



// 判断lineB是否是上标(确保上标的下边界被左侧字符包裹，不得随意调整
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


//众数，如果相同则按给定方式排序
const getMode = (item: number[], order: "ascending" | "descending") => {
  if (item.length == 1) {
    return item;
  }
  if (item.length == 2) {
    if (order == "ascending") {
      item.sort((a, b) => a - b);
    } else if (order == "descending") {
      item.sort((a, b) => b - a);
    }
    return item;
  }
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
  //所有元素各不相同
  if (modeArr.length == item.length) {
    if (order == "ascending") {
      item.sort((a, b) => a - b);
    } else if (order == "descending") {
      item.sort((a, b) => b - a);
    }
    return item;
  } else if (modeArr.length == 1) {
    return [Number(modeArr[0])];
  } else {
    const modeArrNum = modeArr.map(e => Number(e));
    //前两个频数相等时根据排序规则排序前两个元素
    if (num[modeArr[0]] == num[modeArr[1]]) {
      if (order == "ascending") {
        if (modeArrNum[0] > modeArrNum[1]) {
          modeArrNum[0] = modeArrNum.splice(1, 1, modeArrNum[0])[0];
        }
      } else if (order == "descending") {
        if (modeArrNum[0] < modeArrNum[1]) {
          modeArrNum[0] = modeArrNum.splice(1, 1, modeArrNum[0])[0];
        }
      }
    }
    return modeArrNum;
  }
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
  //
  //对象属性不按顺序排列
  //以去重的值为键，频次为值，转为按频次排列的对象数组
  const tempArr = Object.keys(num).sort((h1: string, h2: string) =>
    num[h2] - num[h1]
  );
  const objArrOrderByFrequency: { [key: string]: number; }[] = [];
  tempArr.filter(e => {
    const obj: any = {};
    obj[e] = num[e];
    objArrOrderByFrequency.push(obj);
  });
  const OrderByFrequency = numberKVObjOrderByFrequency(num);

  const test22 = objArrOrder(objArrOrderByFrequency, false);
  const test23 = objArrOrder(objArrOrderByFrequency);
  //return num;
  return {
    objFrequency: num,
    objArrOrderByFrequency: objArrOrderByFrequency,
    itemOrderByFrequency: OrderByFrequency
  };

};

//数组中对象的属性仅有一个
//数组中对象的属性不止一个，每个对象都有相同的属性
//数组中对象的属性不止一个，且无相同属性
const objArrOrder = (objArr: object | object[], reverse?: boolean, orderBy?: ["key" | "value"]) => {
  if (Array.isArray(objArr)) {
    const sortArr: any[] = [];
    const sortArrReverse: any[] = [];
    /* 遍历第一个对象元素的所有属性  */
    let objSameAttributes = [];
    if (objArr.filter(e => Object.keys(e).length > 1).length) {
      objSameAttributes = Object.keys(objArr[0]).filter(e => {
        let marker = true;
        /* 
        遍历对象，查询有无给定属性，
        若无，则退出循环，
        如果有一个对象没有该属性则认为该属性不同
        */
        for (let i = 1; i < objArr.length; i++) {
          if (!Object.prototype.hasOwnProperty.call(objArr[i], e)) {
            marker = false;
            break;
          }
        }
        return marker;
      });
      //正反排序均组成数组，保存到数组中，先解构再排序
      //非数值的值，不排序
      objSameAttributes.filter(e => {
        sortArr.push([...objArr].sort((a: any, b: any) => a.e - b.e));
        sortArrReverse.push([...objArr].sort((a: any, b: any) => b.e - a.e));
      });
    } else {
      /* 
      值均为数字
      对象仅有一个属性，但数组中对象属性可能各不相同，按值排序
      先将值构成数组，排序后再排对象
      sort()按照字符串排序，数字排序结果形如 Array(37) [ 1, 1, 10, 1129, 113, 12, 120, 142, 2, 2, … ]
      要想按照数值排序，则需要传入回调函数
      重复值会导致键重复，需要先去重
  
      值不全为数字 
      先将数字补齐零，需要找到最大的数字
  
      后缀为数字
      */


      const valuesArr = [...new Set(objArr.map(e => Object.values(e)[0]))].sort((a, b) => Number(a) - Number(b));
      valuesArr.filter(e => {
        objArr.filter(o => {
          if (Object.values(o) == e) {
            sortArr.push(o);
          }
        });
      });
      const valuesArr2 = valuesArr.sort((a, b) => Number(b) - Number(a));
      valuesArr2.filter(e => {
        objArr.filter(o => {
          if (Object.values(o) == e) {
            sortArrReverse.push(o);
          }
        });
      });
    }
    if (reverse === undefined) {
      return {
        sortArr: sortArr,
        sortArrReverse: sortArrReverse,
      };
    } else if (reverse) {
      return sortArrReverse;
    } else {
      return sortArr;
    }
  } else if (objArr.constructor === Object) {
    //如果是对象，将对象拆散为对象数组，按值排序或按属性排序
    //按值排序

    return;
  }

};

const objTempOrder = (obj: { [key: string]: string | number; }, isPad?: boolean) => {
  const objOrdered: any = {
    objArrOrderByKey: [],
    objArrOrderByKeyReverse: [],
    objArrOrderByValue: [],
    objArrOrderByValueReverse: [],
  };

  /* 按字符串排序;
  字符串中有数字，补齐后排序;
  按键排序;
  按值排序; */
  // 以 obj 的键作为字符串数组，根据相应键的值为条件排序

  const keys = Object.keys(obj);
  const values = Object.values(obj);
  const vv: any = {};
  if (isPad) {
    const reg = [];
    reg.push(/^(\d+)$/m);
    reg.push(/^(\d+)[^\d]+$/m);
    reg.push(/^[^\d]+(\d+)$/m);
    reg.push(/^[^\d]+(\d+)[^\d]+$/m);
    for (const reg0 of reg) {
      //提取reg匹配的内容
      let numbers: any = [];
      keys.map(k => {
        const contition = k.match(reg0);
        if (contition == null) {
          return false;
        } else {
          numbers.push(contition[1]);
          return;
        }
      });
      numbers = numbers.filter((e: any) => e && e);
      //确定最长数字串的长度
      const numLength = numbers.reduce((maxLength: number, num: any) => {
        if (num.length > maxLength) {
          maxLength = num.length;
          return maxLength;
        }
      }, 0);
      numbers.filter((e: any) => {
        vv[e] = e.padStart(numLength, '0');
      });
      keys.filter((k: any) => {
        const condition = k.match(reg0);
        if (condition) {
          const s1 = condition[1];
          const s2 = s1.padStart(numLength, '0');
          k = k.replace(s1, s2);
        }
      });
    }
    for (const reg0 of reg) {
      //提取reg匹配的内容
      let numbers: any = [];
      values.map(k => {
        k = k.toString();
        const contition = k.match(reg0);
        if (contition == null) {
          return false;
        } else {
          numbers.push(contition[1]);
          return;
        }
      });
      numbers = numbers.filter((e: any) => e && e);
      //确定最长数字串的长度
      const numLength = numbers.reduce((maxLength: number, num: any) => {
        if (num.length > maxLength) {
          maxLength = num.length;
          return maxLength;
        }
      }, 0);
      numbers.filter((e: any) => {
        vv[e] = e.padStart(numLength, '0');
      });
      values.filter((k: any) => {
        const condition = k.match(reg0);
        if (condition) {
          const s1 = condition[1];
          const s2 = s1.padStart(numLength, '0');
          k = k.replace(s1, s2);
        }
      });
    }

  }
  //按键排序


  keys.sort().filter(e => {
    const objTemp: any = {};
    objTemp[e] = obj[e];
    objOrdered.objArrOrderByKey.push(objTemp);
  });
  keys.sort().reverse().filter(e => {
    const objTemp: any = {};
    objTemp[e] = obj[e];
    objOrdered.objArrOrderByKeyReverse.push(objTemp);
  });

  [...new Set(values)].sort().filter(e => {
    Object.keys(obj).filter(k => {
      if (obj[k] == e) {
        const objTemp: any = {};
        objTemp[k] = e;
        objOrdered.objArrOrderByValue.push(objTemp);
      }
    });
  });
  [...new Set(values)].sort().reverse().filter(e => {
    Object.keys(obj).filter(k => {
      if (obj[k] == e) {
        const objTemp: any = {};
        objTemp[k] = e;
        objOrdered.objArrOrderByValueReverse.push(objTemp);
      }
    });
  });

  // 如果排序后众数对应的高（字符串，在首位）的频次与第二位相同，
  // 则有可能未进行排序，不相等则一定做过排序
  //所有键均为数值数字，否则无法运行
  /// if (Object.keys(num).filter(e => e.match(/^[0-9.]+$/g) != null).length == Object.keys(num).length) {

  return objOrdered;
};

/**
 * 对象的键值均为数字
 * 返回的数组元素为乱序，其对应的频次降序排列
 * @param item 
 * @returns 
 */
const numberKVObjOrderByFrequency = (num: { [key: string]: number; }) => {
  //const num = frequency(item);
  // 以 num 的键作为字符串数组，根据相应键的值为条件，实现高度字符串按众数排序
  const modeArr = Object.keys(num).sort((h1: string, h2: string) =>
    num[h2] - num[h1]
  );
  // 如果排序后众数对应的高（字符串，在首位）的频次与第二位相同，
  // 则有可能未进行排序，不相等则一定做过排序
  //所有键均为数值数字，否则无法运行
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
    //item.height 的值作为数组的唯一元素赋给 _height 属性
    _height: [item.height],
    fontName: item.fontName,
    _fontName: [item.fontName],
    sourceLine: [item],
    isReference: false,
    lineSpaceTop: 0,
    lineSpaceBottom: 0,
  };
  if (line.width < 0) {
    line.x = Math.round(line.width + line.x);
    line.width = -Math.round(line.width);
  }
  return line;
};


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

/**
 * 通过字体筛选文本
 * isRetrunObj为true时返回pdfItem数组，否则返回字符串数组
 * @param strArr 
 * @param fontName 
 * @param isRetrunObj 
 * @param isSkipWhiteSpace 
 * @returns 
 */
const strByFont = (strArr: any[], fontName: string, isRetrunObj: boolean, isSkipWhiteSpace: boolean) => {
  let strByFontArr;
  if (isSkipWhiteSpace) {
    //判断属性是text还是str
    if ((Object.prototype.hasOwnProperty.call(strArr[0], "text"))) {
      if (isRetrunObj) {
        strByFontArr = strArr.filter(e => e.text != '' && e.text != " ").filter(e => e.fontName == fontName);
      } else {
        strByFontArr = strArr.filter(e => e.text != '' && e.text != " ").filter(e => e.fontName == fontName).map(e => e.str);
      }
    } else {
      if (isRetrunObj) {
        strByFontArr = strArr.filter(e => e.str != '' && e.str != " ").filter(e => e.fontName == fontName);
      } else {

        strByFontArr = strArr.filter(e => e.str != '' && e.str != " ").filter(e => e.fontName == fontName).map(e => e.str);
      }
    }
  } else {
    if (isRetrunObj) {
      strByFontArr = strArr.filter(e => e.fontName == fontName);
    } else {
      if ((Object.prototype.hasOwnProperty.call(strArr[0], "text"))) {
        strByFontArr = strArr.filter(e => e.fontName == fontName).map(e => e.text);
      } else {
        strByFontArr = strArr.filter(e => e.fontName == fontName).map(e => e.str);
      }
    }
  }
  return strByFontArr;
};

/**
 * PDFLine,PDFItem类型的任何层次的数组均可
 * @param allItem 
 * @param isSkipClearCharaters 
 * @returns 
 */
const fontInfo = (allItem: any[], isSkipClearCharaters: boolean) => {
  if (Array.isArray(allItem[0])) {
    allItem = allItem.flat(Infinity);
  }
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
  const tempObj = frequency(fontArr);
  const fontObj = tempObj.objFrequency;
  const fontOrder = tempObj.itemOrderByFrequency as string[];
  const fontObjArrOrderByFrequency = tempObj.objArrOrderByFrequency;
  //const fontOrder = fontObj.map(e => Object.keys(e)[0]) as string[];
  //字体为字符串，末尾是序号，但个位的字符数少于十位的
  //截取末尾数字转为数字然后用来排序
  const reg = /.+?(\d+)$/m;
  const test1 = Number(Object.keys(fontObjArrOrderByFrequency[0])[0].replace(reg, "$1"));
  const test2 = Number(Object.keys(fontObjArrOrderByFrequency[1])[0].replace(reg, "$1"));
  const fontPresentOrder = [...fontOrder].sort((a, b) => Number(b.replace(reg, "$1")) - Number(a.replace(reg, "$1")));

  const lineHeightArr = arrTemp.map((e: PDFItem) => e.height);
  const lineHeightMode = getMode(lineHeightArr, "descending");
  const lineHeightOrderByValue = [...lineHeightMode].sort((a, b) => b - a);

  let titleFont;
  const maxLineHeight = lineHeightOrderByValue[0];
  const yArr: number[] = [];
  const xArr: number[] = [];
  allItem.filter(e => {
    yArr.push(e.transform[5]);
    xArr.push(e.transform[4]);
    xArr.push(e.transform[4] + e.width);
  });
  const maxY = Math.max(...yArr);
  const minY = Math.min(...yArr);
  const maxX = Math.max(...xArr);
  const minX = Math.min(...xArr);
  const pdfItemsMaxHeight = allItem.filter(e => e.height == maxLineHeight);

  const tempFont = pdfItemsMaxHeight[0].fontName;
  if (pdfItemsMaxHeight.length == 1) {
    if (pdfItemsMaxHeight[0].transform[5] < maxY
      && pdfItemsMaxHeight[0].transform[5] > minY
      && pdfItemsMaxHeight[0].str.splic(" ").length > 1
      && fontPresentOrder.indexOf(tempFont) < fontPresentOrder.length / 2
      && Number(tempFont.match(/\d+$/m)[0])) {
      titleFont = tempFont;
    }
  } else if (pdfItemsMaxHeight.length == 2) {
    if (pdfItemsMaxHeight[0].fontName == pdfItemsMaxHeight[1].fontName) {
      titleFont = tempFont;
    } else {
      titleFont = pdfItemsMaxHeight[0].width >= pdfItemsMaxHeight[1].width ? pdfItemsMaxHeight[0].fontName : pdfItemsMaxHeight[1].fontName;
    }
  } else if (pdfItemsMaxHeight.length > 2) {
    titleFont = frequency(pdfItemsMaxHeight.map(e => e.fontName)).itemOrderByFrequency[0];
  }



  //const arrTemp = lineArr.flat(Infinity).filter((e: any) => !e.str.includes("\\u000"));
  const strNoDuplicateByFont: any = {};
  const strCountsByFont: any = {};
  const strArrByFont: any = {};
  for (let i = 0; i < fontOrder.length; i++) {
    //排除特殊字符,降低字体判断复杂度    
    const strByFontArr = strByFont(arrTemp, fontOrder[i], false, true);
    const newArr = [...new Set(strByFontArr)];
    strArrByFont[fontOrder[i]] = {
      strNoDuplicateByFont: newArr,
      strByFontArr: strByFontArr,
    };
    strNoDuplicateByFont[fontOrder[i]] = newArr.length;
    strCountsByFont[fontOrder[i]] = strByFontArr.length;
  }
  //去重字符串的数量组成数组然后降序排序
  const strNoDuplicateOrderByFont = Object.values(strNoDuplicateByFont).sort((a, b) => (b as number) - (a as number));
  const strOrderByFont = Object.values(strCountsByFont).sort((a, b) => (b as number) - (a as number));
  return {
    fontFrequency: fontObj,
    fontOrderByFrequency: fontOrder,
    strNoDuplicateByFont: strNoDuplicateByFont,
    strNoDuplicateOrderByFont: strNoDuplicateOrderByFont,
    strCountsByFont: strCountsByFont,
    strOrderByFont: strOrderByFont,
    strArrByFont: strArrByFont,
    titleFont: titleFont,
  };
};


const fontStyle = (item: PDFItem, lineItem: PDFItem[], lineArr: PDFItem[][], fontInfoObj: any) => {
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
  if (linefontIndex >= 1) {
    /*     if () */
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


const mergePDFItemsToPDFLine = (items: PDFItem[]) => {
  if (!items.length) { return; }
  const lineArr: PDFItem[][] = [];
  let lines: PDFItem[] = [];
  for (let i = 0; i < items.length; i++) {
    //特殊字符转换，避免加减号等重要信息弄不清
    clearCharactersDisplay(items[i]);
    //总是判断下一个元素是否换行，所以把当前元素先放入行数组中
    lines.push(items[i]);
    //通过？和 ||false 减低复杂度
    //isNewLineAdjacent指下一个元素是否新起一行，高于顶低于底则换行
    let bottomi = 0, topNext = 0, topi = 0, bottomNext = 0, righti = 0, leftNext = 0;
    //定义页面方向，后续补充
    const ltrAndUp = true;
    if (ltrAndUp) {
      bottomi = items[i].transform[5];
      topNext = items[i + 1]?.transform[5] + items[i + 1]?.transform[3];
      topi = items[i].transform[5] + items[i].transform[3];
      bottomNext = items[i + 1]?.transform[5];
    }
    const test1 = lines.some(e => /[^& ]/.test(e.str));
    const test2 = items[i];
    const test3 = items[i + 1];
    //底高于顶，或顶低于底
    const isNewLineAdjacent = (bottomi - topNext > 0 || topi - bottomNext < 0) || false;
    let isNewLine = false;
    if (isNewLineAdjacent) {
      isNewLine = true;
      //空格可以很长 str: " ", dir: "ltr", width: 27.381
      //下一个非空非空格元素和该行字体不同，且有1个字符以上的间隔
      //现有行内容没有特殊字符（COCC的方框字符是&，出现在悬挂缩进时）
    } else if (lines.some(e => /[^& ]/.test(e.str)) && items[i].str != ""
      && !items[i].str.includes("❓")
      && items[i + 1] && items[i + 1].str.match(/[\u0000-\u001f]/) == null
      && items[i].fontName != items[i + 1].fontName) {
      //根据页面方向定义，后续完善
      righti = items[i].transform[4] + items[i].width;
      leftNext = items[i + 1]?.transform[4];
      let hasGap = false;
      if (items[i].str != "") {
        hasGap = leftNext - righti > 1 * (items[i].width / items[i].str.length)
          || false;
      } else if (items[i + 1] && items[i + 1].str != "") {
        hasGap = leftNext - righti > 1 * (items[i + 1].width / items[i + 1].str.length) || false;
      } else if (items[i - 1] && items[i - 1].str != "") {
        hasGap = leftNext - righti > 1 * (items[i - 1].width / items[i - 1].str.length) || false;
      } else {
        hasGap = leftNext - righti > 6;
      }
      if (hasGap) {
        const fontLines = fontInfo(lines, true)?.fontOrderByFrequency[0] || undefined;
        if (fontLines && fontLines != items[i + 1].fontName) {
          isNewLine = true;
        }
      }
    }
    if (isNewLine) {
      lineArr.push(lines);
      lines = [];
    }
  }
  if (lines.length) {
    lineArr.push(lines);
  }
  return lineArr;
};

const makeLine = (lineArr: PDFItem[][]) => {
  // 行数组中的元素合并成行，
  //判断上下标，粗斜体
  const linesCombined = [];
  const fontInfoObj = fontInfo(lineArr, true);
  for (let i = 0; i < lineArr.length; i++) {
    const lineItem: PDFItem[] = lineArr[i];
    if (!lineItem.length) { continue; }
    // 行数组的首个元素转换为PDFLine类型，作为行首，即前一行（或上一小行）
    const lastLine = toLine(lineItem[0] as PDFItem);
    const fontInfo = fontStyle(lineItem[0], lineItem, lineArr, fontInfoObj);
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
        const lineFontStyle = fontStyle(lineItem[i], lineItem, lineArr, fontInfoObj)?.lineFontStyle;
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
  const longSpaces = longSpaceCounts(currentLine);
  const longSpaceCount = longSpaces.spaceCounts;
  const longSpaceIndex = longSpaces.longSpaceIndex || 0;
  const gaps = hasGapInline(currentLine);
  const gapCounts = gaps.gapCounts;
  const gapIndex = gaps.gapIndex;

  //悬挂缩进，暂定一个长空格或一个长间隙
  if ((longSpaceCount == 1 && longSpaceIndex[0] <= 3) || (gapCounts == 1 && gapIndex[0] <= 3)) {
    paraCondition["condition"] += `悬挂缩进 ((longSpaceCount == 1 && longSpaceIndex[0] <= 3) || (gapCounts >= 1 && gapIndex[0] <= 3))`;
    if (nextLine && currentLine.x + tolerance < nextLine.x) {
      isNewParagraph = true;
      paraCondition["condition"] += `&&(nextLine && currentLine.x > nextLine.x + tolerance)`;
    } else if (currentLine.x + tolerance < lastLine.x) {
      isNewParagraph = true;
      paraCondition["condition"] += `&&(currentLine.x > lastLine.x + tolerance)`;
    } else if (longSpaceCounts(lastLine).spaceCounts == 1 && longSpaceCounts(lastLine).longSpaceIndex[0] <= 3) {
      isNewParagraph = true;
      paraCondition["condition"] += `&&(longSpaceCounts(lastLine).spaceCounts== 1 &&longSpaceCounts(lastLine).longSpaceIndex[0]<= 3)`;
    } else if (nextLine && longSpaceCounts(nextLine).spaceCounts == 1 && longSpaceCounts(nextLine).longSpaceIndex[0] <= 3) {
      isNewParagraph = true;
      paraCondition["condition"] += `&&(nextLine&&longSpaceCounts(nextLine).spaceCounts== 1 &&longSpaceCounts(nextLine).longSpaceIndex[0]<= 3)`;
    }
  } else if (currentLine.fontName != lastLine.fontName) {
    isNewParagraph = true;
    paraCondition["condition"] += `主字体不同 if(currentLine.fontName != lastLine.fontName)`;
  } else if (currentLine._height.filter(e => e).some((h2: number) => lastLine._height.filter(e2 => e2).every(e3 => h2 / e3 > 1.5))) {
    isNewParagraph = true;
    //当前行如果有很大的字，可能是新段落
    //但下一行和该行可以是一段 && currentLine._height.some((h2: number) => h2 / nextLine.height > 1.5)
    paraCondition["condition"] += `(currentLine._height.some((h2: number) => h2 / lastLine.height > 1.5)`;
  } else if (/^(<[^<>]+?>)*abstract(<\/[^<>]+?>)*/im.test(currentLine.text)
    || /^\W*(<[^<>]+?>)*references(<\/[^<>]+?>)*\W*$/im.test(currentLine.text)) {
    isNewParagraph = true;
    paraCondition["condition"] += `if (/^abstract/im.test(currentLine.text) || /^\W+references\W+$/im.test(currentLine.text))`;
  } else if (currentLine.height / lastLine.height > 1.1 || currentLine.height / lastLine.height < 0.9) {
    isNewParagraph = true;
  } else if (currentLine.sourceLine[1] && currentLine.sourceLine[0].str == '' && currentLine.sourceLine[0].hasEOL
    && /^[& 0-9.]+$/m.test(currentLine.sourceLine[1].str)) {
    isNewParagraph = true;
  } else if (!nextLine) {
    if (lastLine.lineSpaceTop && currentLine.lineSpaceTop) {
      paraCondition["condition"] += ` if (lastLine.lineSpaceTop && currentLine.lineSpaceTop)`;
      //行间距大于上两行，但小于2倍上一行的高，可不分但不错分
      if (currentLine.lineSpaceTop - lastLine.lineSpaceTop > 0.5
        && currentLine.lineSpaceTop - lastLine.lineSpaceTop > 1.5 * lastLine.height) {
        paraCondition["condition"] += ` && (currentLine.lineSpaceTop - lastLine.lineSpaceTop > 0.5
            && currentLine.lineSpaceTop - lastLine.lineSpaceTop < 2 * lastLine.height)`;
        if (abs(lastLine.lineSpaceTop - lines[i - 2].lineSpaceTop!) < 0.5) {
          isNewParagraph = true;
          paraCondition["condition"] += `&& 上两行间距相等 (abs(lastLine.lineSpaceTop - lines[i - 2].lineSpaceTop!) < 0.5)`;
        } else if (currentLine.y == infoParas.yOrder[0]) {
          isNewParagraph = true;
          paraCondition["condition"] += `&& 最低位，中间无图那种情况 (currentLine.y == infoParas.yOrder[0] )`;
        }
      }
    } else if (currentLine.x > lastLine.x + 16 && longSpaceCount == 0 && gapCounts == 0) {
      isNewParagraph = true;
      paraCondition["condition"] += `非悬挂，确认缩进就换行,(currentLine.x > lastLine.x + 16 && longSpaceCount==0&&gapCounts==0)`;
    }

  } else if (nextLine) {
    // 当前行较上下行明显缩进，，字体和上一行相同，避免悬挂分段时错误分段
    // 有的上下行有长间隙，长空格呢？暂时不考虑
    if ((currentLine.x > lastLine.x + tolerance && currentLine.x > nextLine.x + tolerance)
      /* && longSpaceCounts(lastLine).spaceCounts == 0 && longSpaceCounts(nextLine).spaceCounts == 0
      && hasGapInline(lastLine).gapCounts == 0 && hasGapInline(nextLine).gapCounts == 0 */
      && currentLine.fontName == lastLine.fontName) {
      isNewParagraph = true;
      paraCondition["condition"] += `当前行较上下行明显缩进，且上下行没有长空格和长间隙，字体和上一行相同，避免悬挂分段时错误分段，
      (currentLine.x > lastLine.x + tolerance && currentLine.x > nextLine.x + tolerance)
      && currentLine.fontName == lastLine.fontName)`;
    } else if (currentLine.x > lastLine.x + 16 && longSpaceCount == 0) {
      isNewParagraph = true;
      paraCondition["condition"] += `左侧明显比上一行更靠右,(currentLine.x > lastLine.x + 16 && longSpaceCount == 0)`;
    } else if (nextLine.lineSpaceTop && lastLine.lineSpaceTop && currentLine.lineSpaceTop) {
      paraCondition["condition"] += ` (nextLine.lineSpaceTop&&lastLine.lineSpaceTop && currentLine.lineSpaceTop)`;
      if (currentLine.lineSpaceTop - lastLine.lineSpaceTop > 1.5 * lastLine.height
        && currentLine.lineSpaceTop - nextLine.lineSpaceTop > 1.5 * nextLine.height
        && lastLine.y > currentLine.y && currentLine.y > nextLine.y) {
        isNewParagraph = true;
        paraCondition["condition"] += `&& 该行行间距大于上下两行的行间距, (currentLine.lineSpaceTop - lastLine.lineSpaceTop > 1.5 * lastLine.height
          && currentLine.lineSpaceTop - nextLine.lineSpaceTop > 1.5 * nextLine.height
          && lastLine.y > currentLine.y && currentLine.y > nextLine.y)`;
      }
    } else if (currentLine.lineSpaceTop == 0 && currentLine.x > nextLine.x + tolerance) {
      isNewParagraph = true;
      paraCondition["condition"] += `(currentLine.lineSpaceTop==0&&currentLine.x>nextLine.x+tolerance)`;
    }
  }
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
 * @param headingY 
 * @param footerY 
 * @returns 
 */
const cleanHeadFooter = (lines: PDFLine[], totalPageNum: number, headFooderTextArr: string[], headingY?: number, footerY?: number) => {
  // 左下角坐标的 y 加上行高加上容差如果超过页眉下边界限认为是页眉
  // 左下角坐标的 y 加上容差如果超过页脚下边界限认为是页脚
  //只有当所有条件都为 true 时，当前元素 e 才会被过滤掉

  const linesClean = lines.filter((e: any) =>
    !(e.forward || e.backward || (e.repeat && e.repeat > totalPageNum * 0.5)
      || (headingY && (e.y + e.height + 6) > headingY) || (footerY && (e.y < footerY + 6))));
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
const titleIdentify = (title: string,
  _pagePara: {
    [key: string]: PDFParagraph[];
  },
  contentHeightInfo: {
    _frequency: {
      [key: string]: number;
    };
    _orderByFrequency: number[] | string[];
    mode: number;
  }) => {
  const pdfTitle = {
    "title": '',
    "para": {} as PDFParagraph,
  };
  let twords: string[] = [];
  if (title) {
    twords = [...new Set(title.toLowerCase().split(' '))];
  }
  const pagesHeightOrderByValue = contentHeightInfo._orderByFrequency.sort((a, b) => Number(b) - Number(a)) as number[];

  const totalPageNum = Object.keys(_pagePara).length;
  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
    const _para: PDFParagraph[] = _pagePara[String(pageNum) as keyof typeof _pagePara];
    const lineHeightArr = Object.values(_para).map(e => e.lineHeight);
    const highModeFrequencyOrder = getModeFrequencyAndOrder(lineHeightArr);
    const lineHeightOrderByFrequency = highModeFrequencyOrder._orderByFrequency;
    const highMode = highModeFrequencyOrder.mode;
    const lineHeightOrderByValue = [...lineHeightOrderByFrequency].sort((a, b) => Number(b) - Number(a));

    //const lineWidthtArr = Object.values(_para).map(e => parseFloat(e.width.toFixed(3)));
    //const widthModeFrequencyOrder = getModeFrequencyAndOrder(lineWidthtArr);
    //const lineWidthOrderByFrequency = widthModeFrequencyOrder._orderByFrequency;
    //const lineWidthOrderByValue =[... lineWidthOrderByFrequency].sort((a, b) => b - a);

    /* const lines = _para.flat(1).map(p => p.lines);
    const pagefontOrderByFrequency = fontInfo(lines, true)?.fontOrderByFrequency; */

    let skip = false;
    for (let i = 0; i < _para.length; i++) {
      const p = _para[i];
      let isHasTitle = false;
      if (title !== undefined && title != "") {
        const pwords = [...new Set(p.text.toLowerCase().split(' '))];
        let combineNoduplicate = [...new Set(pwords.concat(twords as string[]))];
        combineNoduplicate = combineNoduplicate.filter(e => e.match(/<[^<>]+>/g) == null);
        const counts = (pwords.length + twords.length) / 2;
        const factor = counts / combineNoduplicate.length;
        if ((
          //和标题吻合
          p.text.toLowerCase() == title.toLowerCase()
          || (factor > 0.8 && abs(pwords.length - twords.length) < counts * 0.5)
        )) {
          isHasTitle = true;
        }
      }
      //标题有可能是本页最短的行
      //非高的众数
      if (!isHasTitle
        && p.lineHeight != highMode
        && p.text.split(/\b/).filter(e => e != " ").length > 1) {
        //所有页面中最高的
        if (pagesHeightOrderByValue.indexOf(p.lineHeight) == 0) {
          isHasTitle = true;
        }
        //本页最高且非单个单词
        else if (lineHeightOrderByValue.indexOf(p.lineHeight) == 0
        ) {
          isHasTitle = true;
        } else if (
          //所有页面中第二高
          pagesHeightOrderByValue.indexOf(p.lineHeight) == 1
        ) {
          isHasTitle = true;
        }
        else if (
          //找不到符合条件且最高的行
          //第二高，且仅有这一行
          lineHeightOrderByValue.indexOf(p.lineHeight) == 1
          && highModeFrequencyOrder._frequency[p.lineHeight] == 1
        ) {
          isHasTitle = true;
        }
      }
      if (isHasTitle) {
        pdfTitle.title = p.text;
        pdfTitle.para = p;
        p.headingLevel = 1;
        if (_para[i + 1]) {
          //用100表示紧邻文章大标题
          if (_para[i + 1].left >= p.left && _para[i + 1].paraSpaceTop < 1.5 * p.lineHeight)
            _para[i + 1].headingLevel = 100;
        }
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
  const lineSpaceTopArr = [];
  pdfLines[0].lineSpaceTop = 0;
  pdfLines[pdfLines.length - 1].lineSpaceBottom = 0;
  for (let i = 1; i < pdfLines.length; i++) {
    //允许为负值，折行
    let lineSpace = pdfLines[i - 1].y - (pdfLines[i].y + pdfLines[i].height);
    lineSpace = parseFloat(lineSpace.toFixed(1));
    pdfLines[i].lineSpaceTop = lineSpace;
    pdfLines[i - 1].lineSpaceBottom = lineSpace;
    lineSpaceTopArr.push(lineSpace);
  }
  return lineSpaceTopArr;
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

const getModeFrequencyAndOrder = (arrary: number[]) => {
  //众数可能不止一个，找到众数中较大的一个行高
  const tempObj = frequency(arrary);
  const _frequency = tempObj.objFrequency;

  const testobj = objTempOrder(_frequency);


  const _objArrOrderByFrequency = tempObj.objArrOrderByFrequency;
  const _orderByFrequency = tempObj.itemOrderByFrequency;
  //const _orderByFrequency = numberKVObjOrderByFrequency(_frequency) as number[];
  let mode = 0;
  let highArr;
  //如果相邻频次相差悬殊时认为之前的为候选众数，因为频次较高的可能不止一个
  for (let i = 1; i < _objArrOrderByFrequency.length; i++) {
    if (Object.values(_objArrOrderByFrequency[i - 1])[0] > 2 * Object.values(_objArrOrderByFrequency[i])[0]
      && Object.values(_objArrOrderByFrequency[i])[0] > 10) {
      highArr = _objArrOrderByFrequency.slice(0, i - 1).map(e => Number(Object.keys(e)[0]));
    }
  }


  /*   for (let i = 1; i < _orderByFrequency.length; i++) {
       
      if (_frequency[_orderByFrequency[i - 1]] > 2 * _frequency[_orderByFrequency[i]] && _frequency[_orderByFrequency[i]] > 10) {
        highArr = _orderByFrequency.slice(0, i - 1) as number[];
        break;
      }
    } */
  if (!highArr) {
    mode = Number(Object.keys(_objArrOrderByFrequency[0])[0]);
  } else if (highArr && highArr.length >= 2) {
    while (!mode) {
      const modeTemp = Math.max(...highArr);
      if (_frequency[modeTemp] / Object.values(_objArrOrderByFrequency[0])[0] > 0.7) {
        mode = modeTemp;
        break;
      } else {
        if (highArr.length == 1) {
          mode = highArr[0];
          break;
        } else {
          highArr = highArr.filter(e => e != modeTemp);
        }
      }
    }
  } else {
    mode = highArr[0];
  }
  return {
    _frequency: _frequency,
    _orderByFrequency: _orderByFrequency,
    _objArrOrderByFrequency: _objArrOrderByFrequency,
    mode: mode,
  };
};

const longSpaceCounts = (pdfLine: PDFLine) => {
  let spaceCounts = 0;
  const longSpaceIndex: number[] = [];
  if (pdfLine.sourceLine.length > 1) {
    let widthChara = 0;
    let counts = 0;
    pdfLine.sourceLine.filter(e => {
      if (e.str != " " && e.str != "") {
        widthChara += e.width;
        counts += e.str.length;
      }
    });
    if (counts) {
      widthChara = widthChara / counts;
    } else {
      widthChara = 4;
    }
    pdfLine.sourceLine.filter((e, i) => {
      if (e.str == " " && e.width > 1.5 * widthChara) {
        spaceCounts += 1;
        longSpaceIndex.push(i);
      }
    });
  } else if (pdfLine.sourceLine[0].str == " " && pdfLine.sourceLine[0].width > 6) {
    spaceCounts = 1;
    longSpaceIndex.push(0);
  }
  return {
    spaceCounts: spaceCounts,
    longSpaceIndex: longSpaceIndex,
  };
};

/**
 * 查找列x，该x不穿透任何单元格，排除空格和空字符
 * @param items 
 * @returns 
 */
const findColumnX = (items: PDFItem[]) => {
  const temp = frequency(items.filter(e => e.str != "" && e.str != " ").map(e => Math.round(e.transform[4] * 10) / 10));
  const xfrequency = temp.objFrequency;
  const xorderByFrequency = temp.itemOrderByFrequency;
  const valid: number[] = [];
  const invalid: number[] = [];
  for (let i = 0; i < xorderByFrequency.length; i++) {
    const value = Number(xorderByFrequency[i]);
    //some不支持continue和break，false结束本次循环
    //||e.str == ")"
    if (items.some((e, i) => {
      if (e.str == " " || e.str == "") { return false; }
      if ((Math.round((e.transform[4] + e.width) * 10) / 10 > value + 0.2 && Math.round(e.transform[4] * 10) / 10 < value - 0.2)) {
        return true;
      } else {
        //如果前面有内容，则 x取前一个元素来比较
        if (i == 0) { return false; }
        if (items[i - 1].str == " " && items[i - 1].width > 4 || items[i - 1].str == "" || items[i - 1].hasEOL) { return false; }
        if (Math.round(items[i - 1].transform[5] * 10) / 10 != Math.round(e.transform[5] * 10) / 10) { return false; }
        if ((Math.round((e.transform[4] + e.width) * 10) / 10 > value + 0.2 && Math.round(items[i - 1].transform[4] * 10) / 10 < value - 0.2)) {
          return true;
        }
      }
    })) {
      invalid.push(value);
      continue;
    } else {
      valid.push(value);
    }
  };
  return valid;
};


const findRowY = (items: CellBox[]) => {
  const temp = frequency(items.map(e => e.bottom));
  const rowYfrequency = temp.objFrequency;
  const rowYorderByFrequency = temp.itemOrderByFrequency;
  const valid: number[] = [];
  const invalid: number[] = [];
  for (let i = 0; i < rowYorderByFrequency.length; i++) {
    const value = Number(rowYorderByFrequency[i]);
    if (items.some(e => {

      if (e.bottom < value && e.top > value) {
        return true;
      }
    })) {
      invalid.push(value);
      continue;
    } else {
      valid.push(value);
    }
  };
  return valid;
};

const hasGapInline = (pdfLine: PDFLine) => {
  const items = pdfLine.sourceLine;
  let righti = 0, leftNext = 0;
  let gapCounts = 0;
  const gapIndex: number[] = [];
  for (let i = 0; i < items.length; i++) {
    //页面方向 todo
    righti = items[i].transform[4] + items[i].width;
    leftNext = items[i + 1]?.transform[4];
    let hasGap = false;
    if (items[i].str) {
      hasGap = leftNext - righti > 1 * (items[i].width / items[i].str.length)
        || false;
    } else if (items[i + 1] && items[i + 1].str) {
      hasGap = leftNext - righti > 1 * (items[i + 1].width / items[i + 1].str.length) || false;
    } else if (items[i - 1] && items[i - 1].str) {
      hasGap = leftNext - righti > 1 * (items[i - 1].width / items[i - 1].str.length) || false;
    } else {
      hasGap = leftNext - righti > 6;
    }
    if (hasGap) {
      gapCounts += 1;
      gapIndex.push(i);
    }
  }
  return {
    gapCounts: gapCounts,
    gapIndex: gapIndex,
  };

};
const tagWrapHeader = (headingLevel: number, item: string) => {
  if (headingLevel < 1 || headingLevel > 6) {
    item = "<p>" + item + "</p>\n";
  } else {
    const tagBegin = '<h' + headingLevel + '>';
    const tagClose = '</h' + headingLevel + '>\n';
    item = tagBegin + item + tagClose;
  }
  return item;
};

const IdentifyHeadingLevel = (
  para: PDFParagraph,
  contentCleanFontInfo: {
    fontFrequency: {
      [key: string]: number;
    };
    fontOrderByFrequency: string[];
    strNoDuplicateByFont: any;
    strNoDuplicateOrderByFont: unknown[];
    strCountsByFont: any;
    strOrderByFont: unknown[];
    strArrByFont: any;
    titleFont: any;
  },
  contentHeightInfo: {
    _frequency: {
      [key: string]: number;
    };
    _orderByFrequency: string[] | number[];
    mode: number;
  },
  modelineSpaceTop: number[],
  level?: number,
) => {
  let headingLevel: number;
  let isheading = false;
  const heightOrder = contentHeightInfo._orderByFrequency.sort((a, b) => Number(b) - Number(a)) as number[];
  headingLevel = heightOrder.indexOf(para.lineHeight) + 1;
  if (para.headingLevel == 1 || para.headingLevel == 100 && !para.isReference) { return; }
  if (contentCleanFontInfo.fontOrderByFrequency[0].includes(para.fontName)) { return; }
  if (para.lineHeight < contentHeightInfo.mode) { return; }
  if (para.lines.length > 3 && para.lineHeight < contentHeightInfo.mode) { return; }
  if (!level) {
    level = 3;
  } else {
    if (level > 6) {
      level = 6;
    }
  }
  const fontTotalNumber = Object.values(contentCleanFontInfo.fontFrequency)
    .reduce((acc: number, el: number) => {
      acc += el;
      return acc;
    }, 0);
  let fontLess;
  for (let i = 1; i < contentCleanFontInfo.fontOrderByFrequency.length; i++) {
    const fontNum0 = contentCleanFontInfo.fontFrequency[contentCleanFontInfo.fontOrderByFrequency[i - 1]];
    const fontNum1 = contentCleanFontInfo.fontFrequency[contentCleanFontInfo.fontOrderByFrequency[i]];
    if ((fontNum0 + fontNum1) / fontTotalNumber < 0.5 && fontNum1 / fontNum0 < 0.6) {
      fontLess = i;
    }
  }


  if (para.lineHeight > contentHeightInfo.mode) {
    //行高大于众高
    isheading = true;
  } else if ((para.paraSpaceTop > 2 * modelineSpaceTop[0] || para.paraSpaceBottom > 2 * modelineSpaceTop[0])) {
    //行间距大于2倍正文行间距
    isheading = true;
  } else if (para.text.match(/[a-z]/g) == null && para.lines.length <= 3 && para.lineHeight == contentHeightInfo.mode) {
    //均为大写
    isheading = true;
  }
  if (isheading) {
    if (headingLevel > level) {
      headingLevel = level;
    }
    para.headingLevel = headingLevel;

  }
};

export async function pdf2document(itmeID: number) {
  //await Zotero.Reader.open(itmeID) as _ZoteroTypes.ReaderInstance;
  //Zotero.Promise.delay(500);
  /* let tab =Zotero_Tabs._getTab(Zotero_Tabs.selectedID) 
    if(tab.tab.type!="reader"){return} */
  const tabID = Zotero_Tabs.getTabIDByItemID(itmeID);
  if (!tabID) { return; }
  if (Zotero_Tabs.selectedID != tabID) {
    Zotero_Tabs.select(tabID);
  }
  const reader = Zotero.Reader.getByTabID(tabID);
  while (!reader._iframeWindow) {
    Zotero.Promise.delay(500);
  }
  const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
  await PDFViewerApplication.pdfLoadingTask.promise;
  await PDFViewerApplication.pdfViewer.pagesPromise;
  const pages = PDFViewerApplication.pdfViewer._pages;
  let totalPageNum = pages.length;
  let isHasEOL: boolean;
  const titleTemp = PDFViewerApplication._title.replace(/( - )?PDF.js viewer$/g, '');
  let title;
  if (titleTemp.length && !titleTemp.includes("untitled")) {
    title = titleTemp;
  }
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
    const items = textContent.items;
    items.filter((e: any) => {
      e.transform[5] = Math.round(e.transform[5] * 1000) / 1000;
      e.transform[4] = Math.round(e.transform[4] * 1000) / 1000;
      e.transform[3] = Math.round(e.transform[3] * 1000) / 1000;
      e.transform[0] = Math.round(e.transform[0] * 1000) / 1000;
      e.height = Math.round(e.height * 1000) / 1000;
      e.width = Math.round(e.width * 1000) / 1000;
      delete e.chars;
    });
    itemsArr.push(items as PDFItem[]);
  }
  const fontInfoArticle = fontInfo(itemsArr, false);
  const heightTempArr = itemsArr.flat(1).map(e => e.height).filter(e => e != undefined);
  const heightInfoArticle = getModeFrequencyAndOrder(heightTempArr);



  const linesArr: PDFLine[][] = [];
  //给行添加 pageLines和 isReference 属性
  let refMarker = 0;
  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
    const lines1 = mergePDFItemsToPDFLine(itemsArr[pageNum])!;
    const lines = makeLine(lines1);
    linesArr.push(lines);
    lineSpace(lines);
    pageLines[pageNum] = lines.map((e: PDFLine) => {
      e.pageIndex = pageNum;
      if (refMarker == 0) {
        if ((/^\W*(<[^>]+>)*references( AND RECOMMENDED)?(<\/[^>]+>)*\W*$/img.test(e.text))) {
          refMarker = 1;
          e.isReference = true;
        } else {
          e.isReference = false;
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


  // 获取页眉页脚信息，将信息作为行属性添加到相应行
  totalPageNum = Object.keys(pageLines).length;
  const headingY0: number = pages[0].pdfPage._pageInfo.view[3] + 10;
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
  let headingY: number = 0;
  let footerY: number = 0;
  const Yclean = Object.keys(resultY).sort((a: string, b: string) => Number(a) - Number(b));
  if (Yclean.length > 1) {
    headingY = Number(Yclean.slice(-1)[0]);
    footerY = Number(Yclean[0]);
  } else {
    Number(Yclean[0]) >= 300 ? headingY = Number(Yclean[0]) : footerY = Number(Yclean[0]);
  }
  //如果页眉或页脚出现的次数小于总页数的一半，则认为没有页眉或页脚
  if (resultY[Number(Yclean.slice(-1)[0])] < totalPageNum * 0.5) {
    headingY = headingY0;
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
    const lines = cleanHeadFooter(linesTemp, totalPageNum, headFooderTextArr, headingY, footerY);
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
      const xFrequency = frequency(linesX(lines)).objFrequency;
      const xOrder = numberKVObjOrderByFrequency(xFrequency);
      const yFrequency = frequency(linesY(lines)).objFrequency;
      const yOrder = numberKVObjOrderByFrequency(yFrequency);
      const hFrequency = frequency(linesHeight(lines)).objFrequency;
      const hOrder = numberKVObjOrderByFrequency(hFrequency);
      const widthFrequency = frequency(linesWidth(lines)).objFrequency;
      const widthOrder = numberKVObjOrderByFrequency(widthFrequency);
      const spaceFrequency = frequency(lineSpace(lines)).objFrequency;
      const spaceOrder = numberKVObjOrderByFrequency(spaceFrequency);

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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          currentLine["paraCond"] = paraCond;
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
  const contentHeightInfo = getModeFrequencyAndOrder(contentLineHighArr);
  const modeHigh = contentHeightInfo.mode;

  //找页中顺序要调整的到段落
  //找到页间需要合并的段落
  for (const pageNum of Object.keys(recordCombine)) {
    const lines: PDFLine[] = recordCombine[pageNum];
    //每页颠倒顺序的段落可能为多处
    if (!lines || lines.length == 0) { continue; }
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
                  //本来每页每段都有内容，但在该阶段段落调整后，则页面段落可能为空
                  const targetLine = pagePara[pageNum2][m][0];
                  if (!targetLine) { continue; }
                  if (longSpaceCounts(targetLine).spaceCounts == 1) {
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
              let findNextPage = 1;
              for (let t = i + 1; t < pageParaArr.length; t++) {
                if (pageParaArr[i][j].y > pageParaArr[t][0].y) {
                  //找到后判断是否需要合并
                  if (line.fontName == pageParaArr[t][0].fontName
                    && abs(line.height - pageParaArr[t][0].height) < 0.1) {
                    pageParaArr[i].push(...pageParaArr[t]);
                    pageParaArr[t] = [];
                  }
                  findNextPage = 0;
                  break;
                }
                if (findNextPage) {
                  //如果没有则跨页比对
                  for (let pageNum2 = Number(pageNum) + 1; pageNum2 < totalPageNum; pageNum2++) {
                    let skip = 0;
                    for (let m = 0; m < pagePara[pageNum2].length; m++) {
                      const targetLine = pagePara[pageNum2][m][0];
                      if (!targetLine) { continue; }
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
  const _pagePara: { [key: string]: PDFParagraph[]; } = {};
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
        paraSpaceTop: 0,
        paraSpaceBottom: 0,
        lineSpaceTop: 0,
        fontName: '',
        headingLevel: -1,
      };
      for (let j = 0; j < pagePara[pageNum][i].length; j++) {

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
      _para.lineHeight = getMode((_para._height as number[]), "descending")[0];
      _para.fontName = fontInfo(_para.sourceLines, true)!.fontOrderByFrequency[0];
      if (_para.lines.length > 1) {
        const para_lineSpaceTop = _para.lines.map(e => e.lineSpaceTop).filter(e => e !== undefined) as number[];
        if (para_lineSpaceTop !== undefined && para_lineSpaceTop.length) {
          _para.lineSpaceTop = getMode(para_lineSpaceTop, "ascending")[0];
        }
      } else {
        _para.lineSpaceTop = _para.lines[0].lineSpaceTop ? _para.lines[0].lineSpaceTop : 0;
      }
      _para.paraSpaceTop = _para.lines[0].lineSpaceTop ? _para.lines[0].lineSpaceTop : 0;
      _para.paraSpaceBottom = _para.lines.slice(-1)[0].lineSpaceBottom !== undefined ? _para.lines.slice(-1)[0].lineSpaceBottom : 0;
      _paraArr.push(_para);
      _pagePara[pageNum].push(_para);
    }
  }

  //确认标题，并剔除标题前无关内容。保存到变量 contentBeforeTitle

  const pdfTitle = titleIdentify(title, _pagePara, contentHeightInfo);
  if (pdfTitle) {
    /*     const pdfPage = pages[pdfTitle.para.pageIndex].pdfPage;
        const maxHeight = pdfPage._pageInfo.view[3]; */
    let contentBeforeTitle: PDFParagraph[];
    const pagePara: PDFParagraph[] = _pagePara[pdfTitle.para.pageIndex];
    for (let i = 0; i < pagePara.length; i++) {
      if (pagePara[i].text == pdfTitle.title) {
        //pdf 排版不一定标题就在最前面，标题高度是任意的
        // i>0代表标题前面有内容，可能非本篇文章的正文
        if (i > 0) {
          const handleContentBeforeTitle = getPref("handleContentBeforeTitle");
          switch (handleContentBeforeTitle) {
            case "moveToArticleEnd":
              contentBeforeTitle = pagePara.splice(0, i);
              _pagePara[totalPageNum - 1].push(...contentBeforeTitle);
              break;
            case "moveToPageEnd":
              contentBeforeTitle = pagePara.splice(0, i);
              pagePara.push(...contentBeforeTitle);
              break;
            case "moveAfterTitle":
              contentBeforeTitle = pagePara.splice(0, i);
              pagePara.splice(1, 0, ...contentBeforeTitle);
              break;
            case "deleteIt":
              contentBeforeTitle = pagePara.splice(0, i);
              break;
            case "nothingToDo":
              break;
            default:
              contentBeforeTitle = pagePara.splice(0, i);
              _pagePara[totalPageNum - 1].push(...contentBeforeTitle);
              break;
          }
        }
        break;
      }
    }
  }

  let skipReference = false;
  for (let p = 0; p < Object.keys(_pagePara).length; p++) {
    //除外参考文献和页眉页脚的所有行,content代表正文
    /*   const contentCleanLines = (Object.values(_pagePara) as PDFParagraph[][]).flat(1).filter(p => !p.isReference)
      .map(p2 => p2.lines).flat(1); */
    //考虑到字体众多增加复杂度，故而逐页进行
    const contentCleanLines = _pagePara[p].map(p => p.lines).flat(1).filter(e => e !== undefined);
    const paralineSpaceTopArr = contentCleanLines.map(l => l.lineSpaceTop);
    const modelineSpaceTop = getMode(paralineSpaceTopArr, "descending");
    const contentCleanFontInfo = fontInfo(contentCleanLines, true);
    const contentCleanLineHighArr = contentCleanLines.map(l => l.height).filter(e => e != undefined);
    //众数可能不止一个，找到众数中较大的一个行高
    const contentCleanHeightInfo = getModeFrequencyAndOrder(contentCleanLineHighArr);
    for (let i = 0; i < _pagePara[p].length; i++) {
      const para = _pagePara[p][i] as PDFParagraph;
      if (!skipReference) {
        if (para.isReference) {
          skipReference = true;
        }
        IdentifyHeadingLevel(para, contentCleanFontInfo, contentCleanHeightInfo, modelineSpaceTop, 3);
      }
      para.text = tagWrapHeader(para.headingLevel, para.text) as string;
      docs.push(_pagePara[p][i].text);
    }
  }
  if (pdfTitle == undefined && title !== undefined && title != "") {
    const pdfTitle = "<h1>" + title + "</h1>" + "\n";
    docs.unshift(pdfTitle);
  }
  return docs;
};