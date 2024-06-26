import { config } from "../../package.json";
import { getPref, getSingleServiceUnderUse, saveJsonToDisk } from "../utils/prefs";
import { getString } from "../utils/locale";
import { pdf2document, frequency } from './getPdfFullText';
import { serviceManage, updatecharConsum, recoverDefaultLimit, services } from "./serviceManage";
import { tencentTransmart } from "./netAPI/tencentTransmart";
import { baiduModify } from "./netAPI/baiduModify";
import { baidufieldModify } from "./netAPI/baidufieldModify";
import { franc } from "franc-min";
import { langCode_francVsZotero, langCodeNameSpeakers } from "../utils/config";
import { html2md, md2html } from "./mdHtmlConvert";
import { imageToAnnotation } from "./imageToAnnotation";
import { testSaveImg } from "./annotationImage";

let htmlToMd: any, mdToHtml: any;
// 装饰函数
function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

let charConsumRecoder = 0;

/* export async function onOpenPdf(id: number) {
  await Zotero.Reader.open(id);
  ztoolkit.log("open pdf");
} */
export class fullTextTranslate {
  @example
  static rightClickMenuItem() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
    ztoolkit.Menu.register("item", {
      tag: "menuseparator",
    });
    // item menuitem with icon
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      label: getString("menuitem-note") + " ALT+N",
      commandListener: ((ev) => {
        fullTextTranslate.translateFT("note");
      }),
      icon: menuIcon,
    });
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      label: getString("menuitem-pdf") + " ALT+P",
      commandListener: ((ev) => {
        fullTextTranslate.translateFT("pdf");
      }),
      icon: menuIcon,
    });
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      label: getString("menuitem-pdf2Note"),
      commandListener: (async (ev) => {
        await this.pdf2Note();       //fullTextTranslate.pdf2Note();
      }),
      icon: menuIcon,
    });

    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      label: "添加图片注释",
      commandListener: (async (ev) => {
        await imageToAnnotation();       //fullTextTranslate.pdf2Note();
      }),
      icon: menuIcon,
    });
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      label: "测试保存图片",
      commandListener: (async (ev) => {
        await testSaveImg();
      }),
      icon: menuIcon,
    });
  }
  //在参数设置中注册本插件的标签
  @example
  static registerPrefs() {
    const prefOptions = {
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      defaultXUL: true,
    };
    ztoolkit.PreferencePane.register(prefOptions);
  }

  static registerShortcuts() {
    ztoolkit.Shortcut.register("event", {
      id: `${config.addonRef}-key-translate-note`,
      key: "N",
      // 似乎只支持单个修饰键
      //modifiers="accel,shift,alt"
      modifiers: "alt",
      callback: (keyOptions) => {
        addon.hooks.onShortcuts("translateNote");
      },
    });
    ztoolkit.Shortcut.register("event", {
      id: `${config.addonRef}-key-translate-pdf`,
      key: "P",
      modifiers: "alt",
      callback: (keyOptions) => {
        addon.hooks.onShortcuts("translatePDF");
      },
    });
  }

  /**
   * 
   * @param pdfItem 
   * @param isSavePDTtoNote 
   * @returns 
   */
  static async getPdfContent(pdfItem: Zotero.Item, isSavePDTtoNote?: boolean) {
    if (!pdfItem.isPDFAttachment()) {
      fullTextTranslate.showInfo(getString("info-notPdf"));
      return;
    }
    const doc = await pdf2document(pdfItem.id);
    if (!doc) { return; }
    const noteTxt = doc;
    //保存笔记
    if (isSavePDTtoNote) {
      const note = new Zotero.Item('note');
      note.libraryID = pdfItem.libraryID;
      const zp = Zotero.getActiveZoteroPane();

      if (pdfItem.parentKey) {
        note.parentKey = pdfItem.parentKey;
      }
      else if (pdfItem.getCollections().length) {

        note.addToCollection(zp.collectionsView.selectedTreeRow.ref.id);
      }

      note.setNote(noteTxt);
      await note.saveTx();
    }
    return noteTxt;
  }

  /**
   * 
   * @returns 
   */
  static getPDFs() {
    const items = Zotero.getActiveZoteroPane().getSelectedItems();
    if (!items.length) {
      return [];
    }
    let pdfIDs: number[] = [];

    for (let item of items) {
      //如果是常规条目，不做处理
      //如果是子条目，获取其父条目，即常规条目
      //如果是无父条目的pdf，直接获取其id
      if (!item.isRegularItem() && item.parentItem) {
        item = item.parentItem;
      } else if (!item.isRegularItem() && item.isPDFAttachment() && !item.parentItem) {
        pdfIDs.push(item.id);
        continue;
      }
      //通过常规条目获取子条目，筛选出 pdf，然后获取其id
      const attachmentIDs = item.getAttachments();
      for (const id of attachmentIDs) {
        //筛选pdf
        if (Zotero.Items.get(id).isPDFAttachment()) {
          pdfIDs.push(id);
        }
      }
    }
    pdfIDs = [...new Set(pdfIDs)];
    return pdfIDs;
  }
  static async translatePDFs() {
    const pdfIDs = this.getPDFs();
    for (const id of pdfIDs) {
      this.contentPrepare(id);
    }
  }

  static async pdf2Note() {
    const pdfIDs = this.getPDFs();
    for (const id of pdfIDs) {
      const item = Zotero.Items.get(id);
      /* if (!Zotero_Tabs.getTabIDByItemID(item.id)) {
        await Zotero.Reader.open(id);
      } */
      /* let tabID = Zotero_Tabs.getTabIDByItemID(item.id);
      Zotero_Tabs.select(tabID); */
      await this.getPdfContent(item, true);

      //任务完成关闭 pdf
      /*       while (tabID) {
              Zotero_Tabs.close(tabID);
              await Zotero.Promise.delay(200);
              tabID = Zotero_Tabs.getTabIDByItemID(item.id);
            } */
      //Zotero_Tabs.select('zotero-pane');

    }
  }

  static async onePdf2Note() {
    const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
    if (!reader) { return; }
    const item = reader._item;
    await this.getPdfContent(item, true);
  }


  static async translateOnePdf() {
    const reader = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID);
    if (!reader) { return; }
    const itemID = reader._item.id;
    const contentObj = await fullTextTranslate.contentPrepare(itemID);
    if (!contentObj) { return; }
    const docItem = await fullTextTranslate.translateDoc(contentObj);
    await fullTextTranslate.makeTranslation(docItem);
    const serviceID = getSingleServiceUnderUse().serviceID as string;
    if (services[serviceID].hasSecretKey) {
      const service = services[serviceID];
      updatecharConsum(charConsumRecoder, service);
      charConsumRecoder = 0;
    }
    serviceManage.allkeyUsableCheck();
  }

  /**
   * 
   */
  static getTxtCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "getTxt",
        type: "default",
      })
      .show();
    const noteIDs = fullTextTranslate.getNoteIDs();
    window.alert("成功获取笔记ID" + noteIDs);
  }
  static async getHtmlMdInterconvert() {
    const betterNoteInfo = await fullTextTranslate.getAddonInfo('Knowledge4Zotero@windingwind.com');
    if (!betterNoteInfo || betterNoteInfo.userDisabled) {
      htmlToMd = html2md;
      mdToHtml = md2html;
      ztoolkit.log("betterNote未安装或禁用，使用根据 windingwind/zotero-better-notes 改编的 html2md和md2html");
    } else {
      htmlToMd = Zotero.BetterNotes.api.convert.html2md;
      mdToHtml = Zotero.BetterNotes.api.convert.md2html;
      ztoolkit.log("已经安装betterNote" + ":version " + betterNoteInfo.version);
    }
  }
  /**
   * 
   * @returns 
   */
  static async getNoteIDs(itemIDs?: number[] | number) {
    let items;
    if (!itemIDs) {
      items = Zotero.getActiveZoteroPane().getSelectedItems();
    } else {
      if (typeof itemIDs == "number") {
        itemIDs = [itemIDs];
      }
      items = await Zotero.Items.getAsync(itemIDs);
    }

    if (!items.length) {
      return [];
    }
    let noteIDs: number[] = [];
    for (const item of items) {
      if (item.isNote()) {
        noteIDs.push(item.id);
      }
      if (item.isRegularItem()) {
        //拼接笔记ID数组
        noteIDs = noteIDs.concat(item.getNotes());
      }
      // 独立笔记
      else if (item.isNote() && !item.parentItem) {
        noteIDs.push(item.id);
      }
      // 条目的子项(子笔记, pdf 等)
      else if (!item.isNote()) {
        const parentItem = item.parentItem!;
        noteIDs = noteIDs.concat(parentItem.getNotes());
      }
    }
    noteIDs = [...new Set(noteIDs)];
    return noteIDs;
  }

  static async languageIdentify(sourceText: string) {
    //todo 指定排除的语言
    sourceText = Zotero.Utilities.unescapeHTML(sourceText);
    const isSkipLocal = getPref("isSkipLocal");
    let untranslatedLanguage = getPref("untranslatedLanguage") as string || "";
    if (isSkipLocal) {
      untranslatedLanguage += Zotero.locale as string;
    }

    const arr = sourceText.split("\n");
    const plainText = arr.slice(0, arr.length > 15 ? 15 : arr.length);
    const languageArr = [];
    const langRecognize: string[] = [];
    let langCodeNameSpeakersString = getString("info-francRecognize");
    for (const text of plainText) {
      //franc库识别语种，注意有识别错误的情况
      const francLang: string = franc(text);
      if (francLang !== undefined && francLang != "" && francLang !== "und") {
        //三码到两码未定义的语言被忽略
        const lang = langCode_francVsZotero[francLang as keyof typeof langCode_francVsZotero];
        const langCodeNameSpeakersObj = langCodeNameSpeakers[francLang as keyof typeof langCode_francVsZotero];
        if (lang !== undefined && lang != '') {
          languageArr.push(lang);
        }
        langRecognize.push(francLang);
      }
    }
    if (langRecognize.length) {
      //[...new Set(langRecognize)]
      frequency(langRecognize).itemOrderByFrequency.filter(e => {
        langCodeNameSpeakersString = langCodeNameSpeakersString + ('\n' + e + "=" + langCodeNameSpeakers[e as keyof typeof langCode_francVsZotero].name + ", speakers=" + langCodeNameSpeakers[e as keyof typeof langCode_francVsZotero].speakers + ';\n');
      });

    }
    //对元素合并计数
    const languageObj = languageArr.reduce((acc: { [key: string]: number; }, el) => {
      acc[el] = (acc[el] + 1) || 1;
      return acc;
    }, {});
    //多键值对象转换为一键一值的对象数组
    const languageObjArr = Object.keys(languageObj).map((key: string) => ({ [key]: languageObj[key] }));
    //对对象数组按降序排序
    languageObjArr.sort((a, b) => b[Object.keys(b)[0]] - a[Object.keys(a)[0]]);
    const langArr = [];
    for (const lang of languageObjArr) {
      for (const langKey in lang) {
        langArr.push(langKey);
      }
    }

    fullTextTranslate.showInfo(langCodeNameSpeakersString + '\n\n' + '三码到两码未定义的语言被忽略，然后保留识别次数最多的前两种语言', 5000);
    if (langArr.length > 2) {
      langArr.splice(2);
    }
    let isTran;
    const forbiddenLang = langArr.filter(item => untranslatedLanguage.includes(item));
    if (!forbiddenLang.length) {
      isTran = true;
      /* noteTodoIDs.push(aNOteID); */
    } else {
      isTran = false;
      fullTextTranslate.showInfo(getString("info-filteredByLanguageForbidden") + ": " + forbiddenLang.toString());
    }
    /*     }
      } */
    const fullTextTranslateInfoTxt = langArr.toString();
    fullTextTranslate.showInfo(fullTextTranslateInfoTxt, 3000);
    return isTran;
  }

  /**
   * 
   * @param mdtxt 
   * @returns 
   */
  static cleanMd(mdtxt: string) {

    /* eslint-disable no-useless-escape */
    //删除markdown转义“\”
    //const reg0 = /\\([.\[\]~\(\)>*\\\-`{}_!#+&])/gi;
    // 处理引文序号
    //const reg111 = /<a[^>]*>(?!-) *([\[\d\]\-\(\), ]*) *<\/a>/gi;
    //mdtxt = mdtxt.replace(reg0, '$1').replace(reg111, '[$1]');
    // 处理其他 a 标签
    const reg1 = /<a[^>]*>([^>]?.*?)<\/a>/gi;
    const reg2 = /\xA0/g;
    const reg3 = /(^(?!!\[).+?)[\[\(]+https.+?[\]\)]+/gmi;
    const reg4 = /(<span[^>]*>)+(.+?)(<\/span>)+/gi;
    const reg41 = /\*\*([^\*\n]+)\*\*/g;
    const reg5 = /\]\]([, ]*)\[\[/g;
    const reg6 = /^(\W*Download\W*)+$\n?/gim;
    const reg7 = /\[\[/g;
    const reg8 = /\]\]/g;
    const reg9 = /\]\)([, ]*)\(\[/g;
    const reg10 = /\)\]([, ]*)\[\(/g;
    const reg11 = /\)\)([, ]*)\(\(/g;
    const reg12 = /\(\[/g;
    const reg13 = /\]\)/g;
    const reg14 = /\[\(/g;
    const reg15 = /\)\]/g;
    const reg16 = /\(\(/g;
    const reg17 = /\)\)/g;
    const reg18 = /<span[^>]*><\/span>/gi;
    const reg19 = /(\[[^\[\]]+?\])\([^()]+?\)/g;
    const reg22 = /^\W*Full size image\W*$\n?/gim;
    //强调短语合并到下一行
    //var reg19 = /(\*\*$)\n+/gim
    //			 .replace(reg19,'$1 ')
    const reg20 = /\n{2,}/g;
    const reg21 = /^#+ *$/gm;

    mdtxt = mdtxt.replace(reg1, '[$1]')
      .replace(reg2, ' ')
      .replace(reg3, '$1')
      .replace(reg4, '$2')
      .replace(reg41, '$1')
      .replace(reg5, ',')
      .replace(reg6, '')
      .replace(reg22, '')
      .replace(reg7, '[')
      .replace(reg8, ']')
      .replace(reg9, ',')
      .replace(reg10, ',')
      .replace(reg11, ',')
      .replace(reg12, '[')
      .replace(reg13, ']')
      .replace(reg14, '[')
      .replace(reg15, ']')
      .replace(reg16, '[')
      .replace(reg17, ']')
      .replace(reg18, '')
      .replace(reg19, '$1')
      .replace(reg20, '\n')
      .replace(reg21, '');
    return mdtxt;
  }

  /**
   * 
   * @returns 
   */
  static async translateFT(type: "note" | "pdf") {

    let noteIDs: number[] = [];
    if (type == "pdf") {
      noteIDs = this.getPDFs();
    } else if (type == "note") {
      noteIDs = await fullTextTranslate.getNoteIDs();
    }

    if (!noteIDs?.length) { return; }
    for (const noteID of noteIDs) {
      const contentObj = await fullTextTranslate.contentPrepare(noteID);
      if (!contentObj) { continue; }
      const time1 = new Date().getTime();
      const docItem = await fullTextTranslate.translateDoc(contentObj);
      const time2 = new Date().getTime();
      const time3 = time2 - time1;
      fullTextTranslate.showInfo(getString("info-translationTIme") + (time3 / 1000).toString() + " seconds", 2000);
      await fullTextTranslate.makeTranslation(docItem);
    }
    const serviceID = getSingleServiceUnderUse().serviceID as string;
    if (services[serviceID].hasSecretKey) {
      const service = services[serviceID];
      updatecharConsum(charConsumRecoder, service);
      charConsumRecoder = 0;
    }
    serviceManage.allkeyUsableCheck();
  }

  /**
   * split zotero note by paragraph or table or img
   * @param sourceTxt 
   * @param emptyLine  whether to preserve empty lines  
   * @returns 
   */
  static splitContent = (sourceTxt: string, emptyLine: boolean) => {
    let regex;
    if (emptyLine) {
      //(<([^<>]+?>)<\/\2)用于分割空行会导致\2也起到了分割的作用
      //正则表达式标志gs可以运行，但在zotero run JavaScript中不能有s，估计其支持不完整
      //改为/(<[^<>]+?><\/[^<>]+>\n)/ 后出错 "</strong></p>\n" 
      //(<([^<>]+?>)<\/\2),然后过滤掉 p> h>，需要写在正则表达式后面，否则元素可能未定义


      regex = /(<([^<>]+?>)<\/\2\n)|(<table>.+?<\/table>\n?)|(<ol>.+?<\/ol>\n?)|(<ul>.+?<\/ul>\n?)|(<p><img.+?<\/p>\n?)|(^<p><span class="highlight" data-annotation="[^>]+?>“.+?”<\/span> <span class="citation" data-citation=".+?<\/span>\)<\/span><\/p>\n?)|(^<[^<>]+?>“.+” ?<span class="citation" data-citation=".+?<\/span>\)<\/span><\/[^><]+?>\n?)/gms;



    } else {
      regex = /(^<table>.+?<\/table>\n?)|(<ol>.+?<\/ol>\n?)|(<ul>.+?<\/ul>\n?)|(^<p><img.+?<\/p>\n?)|(^<p><span class="highlight" data-annotation="[^>]+?>“.+?”<\/span> <span class="citation" data-citation=".+?<\/span>\)<\/span><\/p>\n?)/gms;
    }
    const splitArr = sourceTxt.split(regex);
    const filteredArr = splitArr.filter((item) => item !== undefined && item !== "" && item.match(/^[a-z]>$/g) === null);
    return filteredArr;
  };

  /**
   * split table or image at the end of the article
   * @param sourceTxt 
   * @returns 
   */
  static splitContentEnd = (sourceTxt: string) => {
    const regex = /(<table>.+?<\/table>\n?)|(<p><img.+?<\/p>\n?)/gs;
    const splitArr = sourceTxt.split(regex);
    const filteredArr = splitArr.filter((item) => item !== undefined && item !== "");
    return filteredArr;
  };

  /**
   * 整句拆分
   * 如果未经判断的字串传入，且小于字符限制，则以数组的形式返回
   * @param sourceTxt 
   * @param charasPerTime 
   * @returns 
   */
  static wholeSentenceSplit(sourceTxt: string, charasPerTime: number) {
    /* eslint-disable no-useless-escape */
    const regexTxt = `\}\(?<!^\[A-Z\]\)\(?<! \[A-Z\]\)\(?<!e\\\.g\)\(?<![Nn]o\)\(?<!i\\\.e\)\(?<![Ff]\(ig|igure\)\)\(?<!\([Tt]able \\\d+\)\)\(?<!\\\d+\)`;
    const regexTxt2 = `\[\.!?\]\(?![A-Za-z,]+\)\(\["”\]?\)\(\[\\\[\\\(\\\d\]\{0,3\}\[\\\d\]*\[\\\d\\\-,\\\[\\\]\]*\[\\\]\\\)\\\d\]{0,3}\)* ?`;

    // consider characters count after a period "."
    const charaLength = charasPerTime - 20;
    if (sourceTxt.length <= charaLength) { return [sourceTxt]; }
    //烧脑正则表达式，只有通过new RegExp 构建regex，才能利用变量达到长度为动态的要求
    const regex = new RegExp("\(" + ".{1," + charaLength + regexTxt + regexTxt2 + "\)", 'gm');
    const splitArr = sourceTxt.split(regex);
    let filteredArr = splitArr.filter((item) => item !== undefined && item !== "" && item !== "\n");
    //分割失败怎么办？
    if (filteredArr.length == 0) {
      const regex2 = /(.+?[.:?!'"] (?=[A-z]))/g;
      const splitArr1 = sourceTxt.split(regex2);
      const filteredArr1 = splitArr1.filter((item) => item !== undefined && item !== "");

      filteredArr = fullTextTranslate.combineByLimit(filteredArr1, charasPerTime);
    }
    return filteredArr;
  }


  /**
   * 数组元素中不能有"\n"
   * 传入数组，合并成符合字数限制的数组，原有数组字符串末尾加 '\n'
   * 最终返回字符串数组，有"\n"的字符串是合并过的
   * @param filteredArr 
   * @param charasPerTime 
   * @returns 
   */
  static combineByLimit(filteredArr: string[], charasPerTime: number) {
    const resultArr = [];
    let tempStr = '';
    for (let i = 0; i < filteredArr.length; i++) {
      if (tempStr.length + filteredArr[i].length <= charasPerTime) {
        tempStr = tempStr + filteredArr[i] + '\n';
      } else {
        resultArr.push(tempStr.replace(/\n$/, ''));
        tempStr = filteredArr[i] + '\n';
      }
      if (i === filteredArr.length - 1) {
        resultArr.push(tempStr);
      }
    }
    return resultArr;
  }

  /**
   * 
   * @param filteredArr 
   * @param charasPerTime 
   * @returns 
   */
  static combineByLimitOneRequest(filteredArr: string[], charasPerTime: number) {
    let tempStr = '';
    const reg = /\n$/g;
    const leftArr = filteredArr.map(e => e);
    for (let i = 0; i < filteredArr.length; i++) {
      if (tempStr.length + filteredArr[i].length < charasPerTime) {
        tempStr = tempStr + filteredArr[i] + '\n';
        leftArr.shift();
      } else {
        return {
          str: tempStr.replace(reg, ''),
          leftArr: leftArr
        };
      }
    }
    return {
      str: tempStr.replace(reg, ''),
      leftArr: leftArr
    };
  }

  /**
   * 
   * @param noteID 
   * @returns 
   */
  static async contentPrepare(itemID: number) {
    if (itemID === undefined) { return; }
    const item = Zotero.Items.get(itemID);
    const Library = Zotero.Libraries.get(item.libraryID);
    if (!(Library && Library.filesEditable)) {
      fullTextTranslate.showInfo(getString("info-filesUnEditable"));
      return;
    }
    let noteHtml = '';
    if (item.isNote()) {
      noteHtml = item.getNote();
    } else if (item.isPDFAttachment()) {
      noteHtml = await this.getPdfContent(item) as string;
    }
    const docCellArr: DocCell[] = [];
    const docItem: DocItem = {
      itemID: itemID,
      key: item.key,
      content: docCellArr,
    };
    if (!noteHtml.length || noteHtml === undefined) { return; }
    //split paragraph
    //replace begin <div data-schema-version="8"> with ''
    //replace end </div> with ''
    //extract table and img after reference
    const regBegin = /<div.+?>/gs;
    const regEnd = /<\/div>$/g;
    const headMarkerMatch = noteHtml.match(regBegin);
    const tailMarkerMatch = noteHtml.match(regEnd);
    let headMarker = '';
    let tailMarker = "";
    if (headMarkerMatch != null && headMarkerMatch.length) {
      headMarker = headMarkerMatch[0];
      const obj: DocCell = {
        id: getID(),
        type: "headMarker" as DocCell["type"],
        rawContent: headMarker,
      };
      docCellArr.push(obj);
    }
    //extract title
    const noteTitle: string = item.getNoteTitle();
    const obj: DocCell = {
      id: getID(),
      type: "title" as DocCell["type"],
      rawContent: noteTitle,
      rawToTranslate: noteTitle,

    };
    docCellArr.push(obj);

    const noteHtmlTrimHeadTail = noteHtml.replace(regEnd, '').replace(headMarker, '');
    //split noteHtml by image table paragraph
    //const noteHtmlArr1 = fullTextTranslate.splitContent(noteHtml);
    // split contentEndExceptImgTablefrom last element of noteHtmlArr1
    //匹配到文末，故如有文末的表格图片则予以提取
    //let noteHtmlEnd = noteHtmlArr1.slice(-1)[0];
    //|\bAuthor Affiliations\b    
    let noteHtmlTrimHeadEndTail;
    let contentEndExceptImgTable;
    const contentEndExceptImgTableArr = [];
    const tableImgAfter: string[] = [];
    let contentEnd;
    //文末内容正则表达式，排除表格内的关键字，^ 很关键
    //const regContentEnd = /(?<!<th>\n)(<[^>\n]+?>)(<[^>\n]+?>)*\W*(\bReferences?\b|\bAcknowledgments?\b|\bAppendix\b)[^A-Za-z\n]*(<\/[^>]+?>)[\s\S]*/gi;
    //const regContentEnd = /(?<!<\/?th[^<>]+>\n?)^(<[^>\n]+?>)(<[^>\n]+?>)*\W*(\bReferences?\b|\bAcknowledgments?\b|\bAppendix\b)[^A-Za-z\n]*(<\/[^>]+?>)[\s\S]*/mgi;
    //整篇没有换行？除外表格标题或单元格内的关键字：可有一次换行，无论多少<*>标签，后面的关键字都是除外的
    const regContentEnd = /(?<!<\/?t[hd][^<>]*>\n?(<\/?[^>\n]+?>)*)(<[^>\n]+?>)+\W*(\bReferences?\b|\bAcknowledgments?\b|\bAppendix\b)(&nbsp)*[^A-Za-z\n]*(<\/[^>]+?>)[\s\S]*/gi;
    const contentEndMatch = noteHtmlTrimHeadTail.match(regContentEnd);
    if (contentEndMatch != null && contentEndMatch[0] != "") {
      contentEnd = contentEndMatch[0];
      noteHtmlTrimHeadEndTail = noteHtmlTrimHeadTail.replace(contentEnd, '');
      //split table and img.How todo when contentEndExceptImgTableis table？
      if (contentEnd.includes("<table>" || "<p><img")) {
        const contentEndArrTemp = fullTextTranslate.splitContentEnd(contentEnd);
        for (const e of contentEndArrTemp) {
          if (e.startsWith('<p><img') || e.startsWith('<table>')) {
            tableImgAfter.push(e);
          }
          else {
            contentEndExceptImgTableArr.push(e);
          }
        }
        //如果数组为空，字符串即为""
        contentEndExceptImgTable = contentEndExceptImgTableArr.join('\n');
      } else {
        contentEndExceptImgTable = contentEnd;
      }
      const obj: DocCell = {
        id: getID(),
        type: "contentEnd" as DocCell["type"],
        rawContent: contentEndExceptImgTable,
      };
      docCellArr.push(obj);
    } else {
      noteHtmlTrimHeadEndTail = noteHtmlTrimHeadTail;
    }
    //语种识别
    const isTran = await this.languageIdentify(noteHtmlTrimHeadEndTail);
    if (isTran == false) { return; }

    //tailMarker
    if (tailMarkerMatch != null && tailMarkerMatch.length) {
      tailMarker = tailMarkerMatch[0];
      const obj: DocCell = {
        id: getID(),
        type: "tailMarker" as DocCell["type"],
        rawContent: tailMarker,

      };
      docCellArr.push(obj);
    }

    //正文
    const noteHtmlTrimHeadEndTailArr = fullTextTranslate.splitContent(noteHtmlTrimHeadEndTail, true);
    let noteHtmlArr = [];
    if (tableImgAfter.length) {
      noteHtmlArr = noteHtmlTrimHeadEndTailArr.concat(tableImgAfter);
    } else {
      noteHtmlArr = noteHtmlTrimHeadEndTailArr;
    }

    /*     const htmlTransArr: string[] = []; */
    //skip img, table trans, txtHtml trans
    for (let html of noteHtmlArr) {
      //图片不翻译        
      if (html.startsWith('<p><img')) {
        const obj: DocCell = {
          id: getID(),
          type: "img" as DocCell["type"],
          rawContent: html,
        };
        docCellArr.push(obj);
        continue;
        //空行
      } else if (html.match(/^<([^<>]+?>)<\/\1\n?$/g) !== null) {
        const obj: DocCell = {
          id: getID(),
          type: "paragraph",
          rawContent: html,
        };
        docCellArr.push(obj);
        continue;
      }
      //提取表格中需要翻译的文字，转为数组，去重
      else if (html.startsWith('<table>')) {
        //删除表格的标签
        const reg = /<[^>]+?>/g;
        const tableTxt = html.replace(reg, '');
        const reg2 = /\n+/g;
        const tempTabletxtArr = tableTxt.split(reg2);
        const tableTxtArr = tempTabletxtArr.filter((item) => item !== undefined && item !== "");
        const tableTxtArrUnrepeated = [...new Set(tableTxtArr)];
        //过滤掉非单词内容
        const tableTxtArrClean = tableTxtArrUnrepeated.filter((item) => /\b[A-Za-z]{3,}\b/.test(item));
        if (!tableTxtArrClean.length) {
          const obj: DocCell = {
            id: getID(),
            type: "table",
            rawContent: html,
          };
          docCellArr.push(obj);
        } else {
          const obj: DocCell = {
            id: getID(),
            type: "table",
            rawContent: html,
            rawToTranslate: tableTxtArrClean,
          };
          docCellArr.push(obj);
        }
        continue;
        // 保留引用格式，仅翻译其中的正文内容
      } else if (html.startsWith('<p><span class="highlight" data-annotation=')
        || html.startsWith('<[^<>]+?>“.+” ?<span class="citation" data-citation=')) {
        //引文的正文被 >“ ”<\/span>包裹，引文提取后可能为数组        
        //const reg = /(?<=>“)(.+?)(?=”<\/span>)/;
        const reg = /^<p><span class="highlight" data-annotation="[^>]+?>“(.+)”<\/span> <span class="citation" data-citation=".+?<\/span>\)<\/span><\/p>\n?|^<[^<>]+?>“(.+)” ?<span class="citation" data-citation=".+?<\/span>\)<\/span><\/[^><]+?>\n?/m;
        //const citationTotran = html.match(reg)?.filter((item) => item.length)||[];
        const citationTotran = html.match(reg);
        if (citationTotran == null || citationTotran[0] == "") {
          const obj: DocCell = {
            id: getID(),
            type: "citation",
            rawContent: html,
          };
          docCellArr.push(obj);
        } else {
          let ctx;
          if (citationTotran[1] != undefined) {
            ctx = citationTotran[1];
          } else {
            ctx = citationTotran[2];
          }
          if ((citationTotran[1] != undefined && citationTotran[1].includes('class="citation"'))
            || (citationTotran[2] != undefined && citationTotran[2].includes('class="citation"'))
          ) {
            const reg = /”?<[^>]+?>“?|\(<span class="citation-item">.+?<\/span>\)/g;
            const tempArr = ctx.split(reg).filter(e => e !== undefined && e != "" && e != "\n" && e != " ");
            const obj: DocCell = {
              id: getID(),
              type: "citation",
              rawContent: html,
              rawToTranslate: tempArr
            };
            docCellArr.push(obj);
          } else {
            const obj: DocCell = {
              id: getID(),
              type: "citation",
              rawContent: html,
              rawToTranslate: [ctx]
            };
            docCellArr.push(obj);
          }
        }
        continue;
      } else if (html.startsWith('<ol>') || html.startsWith('<ul>')) {
        const reg = /<[^>]+?>/g;
        let olUlTxtArr = html.split(reg);
        olUlTxtArr = olUlTxtArr.filter((item) => item !== undefined && item !== "" && item !== "\n");
        const olUlTxtArrUnrepeated = [...new Set(olUlTxtArr)];
        //过滤掉非单词内容
        const olUlTxtArrClean = olUlTxtArrUnrepeated.filter((item) => /\b[A-Za-z]{3,}\b/.test(item));
        if (!olUlTxtArrClean.length) {
          const obj: DocCell = {
            id: getID(),
            //先归类到表格
            type: "table",
            rawContent: html,
          };
          docCellArr.push(obj);
        } else {
          const obj: DocCell = {
            id: getID(),
            type: "table",
            rawContent: html,
            rawToTranslate: olUlTxtArrClean,
          };
          docCellArr.push(obj);
        }
        continue;

      }
      // translate paragraph
      else {
        //多段分段, 分有没有 \n 两种情况,不能够用||
        const htmlSource = html;
        const regTaga = /<a[^>]+?>(\d+)<\/a>/g;
        html = html.replace(regTaga, "[$1]");
        let tempArr;
        /* const regSplit = /'\n'|(<([ph][1-6]?>).+?<\/\2)/g;
        tempArr = html.split(regSplit);
        tempArr = tempArr.filter(e => e != "" && e.match(/^[hp][1-6]?>$/g) === null && e !== undefined && e.match(/^ +$/g) === null);
 */
        if (html.includes(">\n<")) {
          tempArr = html.split("\n").filter(e => e != "" && e !== undefined && e.match(/^ +$/g) === null);
        } else {
          const reg = /(<([ph][1-6]?>).+?<\/\2)/g;
          tempArr = html.split(reg).filter(e => e != '' && e.match(/^[hp][1-6]?>$/g) === null);
        }
        for (const item of tempArr) {
          //匹配行内图片
          const reg = /<img[^<>]+?>/g;
          const regMatch = item.match(reg);
          //不替换行内图片，转为markdown ![](), 译后替换

          let mdTxt = await htmlToMd(item) as string;
          mdTxt = mdTxt.replace("\n", '');
          mdTxt = fullTextTranslate.cleanMd(mdTxt);
          //再拆分，为句子？
          /* const regPara = /\n+/gs;
          const mdArr = mdTxt.split(regPara);
          const mdParas = mdArr.filter((item) => item !== undefined && item !== ""); */
          /* const obj: DocCell = {
            type: "paragraph",
            rawContent: item,
            rawToTranslate: mdParas,            
          }; */
          const obj: DocCell = {
            id: getID(),
            type: "paragraph",
            rawContent: item,
            rawToTranslate: mdTxt,
          };
          if (regMatch != null && regMatch[0] != "") {
            obj["imgsInLine"] = regMatch;
          }
          docCellArr.push(obj);
        }
      }
    }
    return docItem;
    function getID() {
      return String(itemID) + "#" + String(new Date().getTime());
    }
  }

  /**
   * 译后处理，生成译文
   * @param docCellArr 
   * @returns 
   */
  static async translateDoc(docItem: DocItem) {
    //const addonStorageDir = Zotero.Prefs.get("extensions.zotero.dataDir", true) as string + "\\storage\\" + config.addonName + "\\";
    //const docsTranslationCacheDir = addonStorageDir + "docsTranslationCache\\";
    const docCellArr = docItem.content;
    const bilingualContrast = getPref('bilingualContrast');
    const isSourceFirst = getPref('isSourceFirst');

    //const docItemFailure = "Failure" + "_" + String(docItem.itemID) + "_" + "docItem";

    let objArrToTranArr: DocCell[] = [];
    let totranArr: string[];
    let result: TransResult[];
    objArrToTranArr = docCellArr.filter((e: DocCell) => e.rawToTranslate && e.rawToTranslate != "");
    //段落
    const paragraph = objArrToTranArr.filter(e => (e.type == "paragraph" || e.type == "title") && e.rawToTranslate);
    totranArr = paragraph.map(e => e.rawToTranslate) as string[];
    result = await fullTextTranslate.translateExec(totranArr);
    const translation = result.map(e => e.translation);
    const serviceID = result.map(e => e.serviceID);
    if (result.slice(-1)[0].status != 'error') {
      //map,filter导致执行混乱      
      /*          paragraph.map(async e => {
                        e.translation = translation!.splice(0, 1)[0];
                        e.serviceID = serviceID!.splice(0, 1)[0];
                        let result = await paraPostTran(e);
                        result = await Promise.all(result);
                        if (result !== undefined && result != "") {
                          e.result = result;                 
                      }}) */
      for (const e of paragraph) {
        e.translation = translation!.splice(0, 1)[0];
        e.serviceID = serviceID!.splice(0, 1)[0];
        await paraPostTran(e);
      }
    } else {
      translation.splice(-1);
      serviceID.splice(-1);
      if (translation.length) {
        for (let i = 0; i < translation.length; i++) {
          paragraph[i].translation = translation.splice(0, 1)[0];
          paragraph[i].serviceID = serviceID.splice(0, 1)[0];
          await paraPostTran(paragraph[i]);
        }
        //翻译失败，将已翻译数据写入缓存

        //saveJsonToDisk(docItem, docItemFailure, docsTranslationCacheDir);        
        docItem.status = "error";
      }
    }

    //表格引用单独翻译后处理
    /*     objArrToTranArr.filter(e => {
          if (e.type == "table" || e.type == "citation") {
            result = await fullTextTranslate.translateExec(e.rawToTranslate);
            if (result?.slice(-1)[0].translation == "no available service") {
    
            } else if (result == undefined) {
              return;
            }
            else {
              const translation = result.map(result => result.translation);
              e.translation = translation;
              tableCitationPostTran(e);
            }
          }
        }); */
    //表格引用批量翻译后处理
    const tableCitation = objArrToTranArr.filter(e => (e.type == "table" || e.type == "citation") && e.rawToTranslate);
    if (tableCitation.length) {
      //展开数组
      totranArr = tableCitation.map(e => e.rawToTranslate).flat(Infinity) as string[];
      if (totranArr.length) {
        result = await fullTextTranslate.translateExec(totranArr);
        const translation = result.map(e => e.translation);
        const serviceID = result.map(e => e.serviceID);
        if (result.slice(-1)[0].status != 'error') {
          for (const e of tableCitation) {
            if (translation.length >= (e.rawToTranslate as string[]).length) {
              e.translation = translation.splice(0, (e.rawToTranslate as string[]).length);
              e.serviceID = serviceID.splice(0, (e.rawToTranslate as string[]).length);
              tableCitationPostTran(e);
            } else {
              //saveJsonToDisk(docItem, docItemFailure, docsTranslationCacheDir);
              docItem.status = "error";
              break;
            }
          }
          //删除失败的数组元素如果还有翻译完的元素，则写处理后入缓存
        } else {
          translation.splice(-1);
          serviceID.splice(-1);
          if (translation.length) {
            for (const e of tableCitation) {
              if (translation.length >= (e.rawToTranslate as string[]).length) {
                e.translation = translation.splice(0, (e.rawToTranslate as string[]).length);
                e.serviceID = serviceID.splice(0, (e.rawToTranslate as string[]).length);
                tableCitationPostTran(e);
              } else {
                break;
              }
            }
          }
          //saveJsonToDisk(docItem, docItemFailure, docsTranslationCacheDir);
          docItem.status = 'error';
        }
      }
    }


    return docItem;

    //段落生成html，考虑行内图片
    async function paraPostTran(docCell: DocCell) {
      //如果没有译文，则result属性缺失
      if (!docCell.translation || docCell.translation == "") { return; }
      let tranedStr = docCell.translation as string;
      const rawToTranslate = docCell.rawToTranslate! as string;
      //要想译文结果是按照段落对照，应当在最后合并时按一段原文一段译文方式来处理
      //表格译文已经是html格式，译文结果应在最终合并前处理，即该阶段
      /*       if (bilingualContrast) {
              //双语时，若原文未翻译，翻译结果无需重复
              if (tranedStrArr == rawToTranslate) {
                tranedStr = rawToTranslate;
                //双语对照，两行内容
              } else {
                if (isSourceFirst) {
                  tranedStr = rawToTranslate + "<br>" + tranedStrArr;
                } else {
                  tranedStr = tranedStrArr + "<br>" + rawToTranslate;
                }
              }
            } else {
              tranedStr = tranedStrArr;
            } */
      //段落译文均为字符串，不是数组，
      //如果译文和原文不相等，说明译文是有点，
      //两者相等时等于该段没翻译,
      if (tranedStr == rawToTranslate) {
        return;
      }

      //替换图片，然后修复上下标错误，转为html
      if (docCell.imgsInLine) {
        //有可能翻译成了中文符号
        const reg = /[!！][\[【][^\[\]【】]*?[】\]][（\(][^\(\)（）]*?[\)）]/;
        for (const item of docCell.imgsInLine) {
          tranedStr = tranedStr.replace(reg, item);
          /*           //双语对照需要多替换一次
          //改为最后合并是处理，也就无需处理
                    if (bilingualContrast) {
                      tranedStr = tranedStr.replace(reg, item);
                    } */
        }
      }
      tranedStr = fullTextTranslate.modifySubSupHeading(tranedStr);
      const result = await mdToHtml(tranedStr);
      if (result !== undefined) {
        docCell.result = result;
      } else { return; }
    }

    //表格引用替换原文html内容为译文html
    function tableCitationPostTran(docCell: DocCell) {
      /* if(docCell===undefined){return;} */
      if (!docCell.translation) { return; }
      let tranedStr = '';
      const tranedStrArr = docCell.translation;
      const rawToTranslate = docCell.rawToTranslate!;
      let result = docCell.rawContent;
      for (let i = 0; i < tranedStrArr.length; i++) {
        if (bilingualContrast) {
          if (isSourceFirst) {
            tranedStr = rawToTranslate[i] + "<br>" + tranedStrArr[i];
          } else {
            tranedStr = tranedStrArr[i] + "<br>" + rawToTranslate[i];
          }
        }
        else {
          tranedStr = tranedStrArr[i];
        }
        const temp = fullTextTranslate.escapeString(rawToTranslate[i]);
        const reg = new RegExp(temp, 'g');
        result = result.replace(reg, tranedStr);
      }
      if (result != docCell.rawContent) {
        docCell.result = result;
      }
    }
  }

  /**
   * 合成译文，写入笔记
   * @param docCellArr 
   * @returns 
   */
  static async makeTranslation(docItem: DocItem) {
    if (docItem.status == 'error') {
      const failureReason = "";
      fullTextTranslate.showInfo(getString("info-translateFailure") + ": " + docItem.itemID?.toString() + ':' + failureReason);
      return;
    }
    const docCellArr = docItem.content;
    const bilingualContrast = getPref('bilingualContrast');
    const isSourceFirst = getPref('isSourceFirst');
    let head: string, tail: string, contentEnd: string, title: string;
    head = tail = contentEnd = title = '';
    const contentBody: string[] = [];
    docCellArr.map(e => {
      if (e.type == "title" && e.result) {
        //如果双语并且原文在前，需要把译文标题作为标题
        //否则留空，软件将自动提取第一段为标题
        if (bilingualContrast) {
          if (isSourceFirst) {
            title = e.translation as string;
          }
        }

      }
      if (e.type == "tailMarker" && e.rawContent) {
        tail = e.rawContent;
      }
      if (e.type == "contentEnd" && e.rawContent) {
        contentEnd = e.rawContent;
      }
      if (e.type == "headMarker" && e.rawContent) {
        head = e.rawContent;
      }
      if (e.type == "img" || e.type == "table" || e.type == "paragraph" || e.type == "citation") {

        if (e.result) {
          if (e.type == "paragraph") {
            if (bilingualContrast) {
              if (isSourceFirst) {
                contentBody.push(e.rawContent);
                contentBody.push(e.result);
              } else {
                contentBody.push(e.result);
                contentBody.push(e.rawContent);
              }
            } else {
              contentBody.push(e.result);
            }
          } else {
            //除了段落，如有译文，已经过双语处理
            contentBody.push(e.result);
          }

        } else {
          contentBody.push(e.rawContent);
        }
      }
    }
    );
    //如果双语原文在前，标题没有截断的话，标题译文是重复的，只需删除数组第二个元素即可纠正
    if (bilingualContrast) {
      if (isSourceFirst) {
        if (title == contentBody[1].replace(/(<\/?[^<>]+?>)/g, "")) {
          contentBody.splice(1, 1);
        }
      }
    }
    const body = contentBody.join("\n");
    //双语对照，则将标题设为目标语言
    if (bilingualContrast) {
      title = '<h1>' + title + '</h1>';
    } else {
      title = "";
    }

    //合成最终翻译结果
    //const transresult = begin + noteTitleTrans + htmlTransArr.join('') + contentEndExceptImgTable + tail;
    const contentTranslation = head + title + body + contentEnd + tail;
    const itemID = docItem.itemID!;
    //克隆笔记，替换译文，写入，复制图片
    //不要改变原笔记信息
    const zp = Zotero.getActiveZoteroPane();
    const item = Zotero.Items.get(itemID);
    if (item.isNote()) {
      const newItem = item.clone(item.libraryID);
      newItem.setNote(contentTranslation);
      if (zp.getCollectionTreeRow()!.isCollection() && newItem.isTopLevelItem()) {
        newItem.setCollections([zp.getCollectionTreeRow()!.ref.id]);
      }
      const newItemID = await newItem.saveTx({ skipSelect: true });
      if (typeof newItemID == "number") {
        docItem.newItemID = newItemID;
      }

      // 复制图片,必须通过 executeTransaction 完成
      if (!(!await Zotero.Notes.ensureEmbeddedImagesAreAvailable(item)
        && !Zotero.Notes.promptToIgnoreMissingImage())) {
        Zotero.DB.executeTransaction(async function () {
          if (newItem.isNote() && (Zotero.Libraries.get(newItem.libraryID) as any).filesEditable) {
            await Zotero.Notes.copyEmbeddedImages(item, newItem);
          }
        });
      }
    }

    if (item.isPDFAttachment()) {
      const note = new Zotero.Item('note');
      note.libraryID = item.libraryID;
      note.parentKey = item.parentKey;
      note.setNote(contentTranslation);
      await note.saveTx();
    }
    //docItem 写入硬盘
    /* const addonStorageDir = Zotero.Prefs.get("extensions.zotero.dataDir", true) as string + "\\storage\\" + config.addonName + "\\";
    const docsTranslationCacheDir = addonStorageDir + "docsTranslationCache\\";
    const docItemSuccess = "Success" + "_" + String(docItem.itemID) + "_" + "docItem"; */
    //saveJsonToDisk(docItem, docItemSuccess, docsTranslationCacheDir);
  }

  /**
   * 筛选出符合条件的翻译引擎
   * @param num 
   * @returns 
   */
  static checkQuotaSwitch(num: number) {
    let onSwitchResult;
    /* eslint-disable no-constant-condition */
    while (true) {
      const serviceID = getSingleServiceUnderUse().serviceID as string;
      const secretKey = getSingleServiceUnderUse().key as string;
      //查一遍属性以防未定义,无需查询全部
      /* for(const e  of Object.keys(services[serviceID])){
        if(services[serviceID][e as keyof TranslateService]===undefined){
          recoverDefaultLimit(serviceID,e as keyof TranslateService)
        }
      } */
      if (services[serviceID].charasPerTime === undefined) {
        recoverDefaultLimit(serviceID, "charasPerTime");
      }
      const charasPerTime = services[serviceID].charasPerTime;
      if (services[serviceID].hasSecretKey === undefined) {
        recoverDefaultLimit(serviceID, "hasSecretKey");
      }
      if (services[serviceID].hasSecretKey) {
        const secretKeyObj = serviceManage.getSingleSecretKey(serviceID, secretKey);
        // 如果有秘钥，则检查该秘钥的余额情况
        if (secretKeyObj) {
          let factor = Number(getPref('charasLimitFactor'));
          if (isNaN(factor)) {
            factor = 1;
          }
          if (services[serviceID].charasLimit === undefined) {
            recoverDefaultLimit(serviceID, "charasLimit");
          }
          let charasLimit;
          if (factor != undefined) {
            charasLimit = services[serviceID].charasLimit * factor;
          } else {
            charasLimit = services[serviceID].charasLimit;
          }
          const serviceAvailableCharacters = charasLimit - secretKeyObj?.charConsum;
          if (serviceAvailableCharacters < num - 10) {
            onSwitchResult = serviceManage.onSwitch(true);
            //失败后退出，成功则循环检查
            if (!onSwitchResult) {
              //失败就存一下
              serviceManage.allkeyUsableCheck();
              return "no available service";
            }
            //剩余额度小于每次请求限制数，调整限制数为剩余额度，
            //避免拆分合并的字符数超过每次请求限制
            //如果剩余数过少，直接更换引擎
          } else if (serviceAvailableCharacters < charasPerTime) {
            if (serviceAvailableCharacters > 1000) {
              return serviceAvailableCharacters;
            } else {
              onSwitchResult = serviceManage.onSwitch(true);
              if (!onSwitchResult) {
                serviceManage.allkeyUsableCheck();
                return "no available service";
              }
            }
          } else {
            break;
          }
          //如果引擎需要秘钥，但没有秘钥，则更换引擎
        } else {
          onSwitchResult = serviceManage.onSwitch(true);
          if (!onSwitchResult) {
            serviceManage.allkeyUsableCheck();
            return "no available service";
          }
        }
        //无需秘钥则直接退出循环然后退出函数
      } else {
        break;
      }
    }
  }

  /**
   * 
   * @param docCellArr 
   * @param sourceTxt 
   * @returns 
   */
  static async translateExec(sourceTxt: string | string[]) {
    let toTranArr: string[] = [];
    const transResultArr: TransResult[] = [];
    if (sourceTxt === undefined) {
      const obj: TransResult = {
        translation: "",
        serviceID: "",
        status: "error",
      };
      return [obj];
    }
    if (typeof sourceTxt == "string") {
      toTranArr = [sourceTxt];
    } else {
      toTranArr = sourceTxt.filter(e => e);
    }
    /* const keyUse = getSingleServiceUnderUse().key;
    const serviceIDUse = getSingleServiceUnderUse().serviceID; */
    serviceManage.singleSecretKeyUsableCheck();
    const translatingProgress = new ztoolkit.ProgressWindow(config.addonName, {
      closeOnClick: true,
      closeTime: -1,
      closeOtherProgressWindows: true,
    });

    const translatingInfoA = `${getSingleServiceUnderUse().serviceID}: ${getString("translating")}...✍️...`;
    const translatingInfoB = `${getSingleServiceUnderUse().serviceID}: ✍️...${getString("translating")}...✍️`;
    const translatingInfoC = `${getSingleServiceUnderUse().serviceID}: ✍️...✍️...${getString("translating")}`;
    let LoopCountor = 0;
    let text = '';
    translatingProgress.createLine({
      text: getString(`service-${getSingleServiceUnderUse().serviceID}`) + getString("start-translating"),
      type: "default",
    }).show();
    let leftArr = toTranArr.map(e => e);
    let toTran = '';
    let loopTimes = 0;
    let lastServiceID = '';
    while (leftArr.length) {
      //翻译引擎支持多段翻译,合并后翻译提高效率
      loopTimes += 1;
      let charasPerTime: number;
      const num = leftArr[0].length;
      const check = this.checkQuotaSwitch(num);
      const serviceID = getSingleServiceUnderUse().serviceID as string;
      if (loopTimes != 0 && lastServiceID == serviceID) {
        if (services[serviceID].hasSecretKey) {
          const key = getSingleServiceUnderUse().key;
          if (key !== undefined) {
            const secretKey = serviceManage.getSingleSecretKey(serviceID, key);
            if (secretKey?.charConsum == 0) {
              fullTextTranslate.showInfo("error: characters record failure");
              break;
            }
          }
        }
      }
      lastServiceID = serviceID;
      if (check !== undefined && typeof check == "number") {
        charasPerTime = check;
      } else if (check !== undefined && check == "no available service") {
        const obj: TransResult = {
          translation: "",
          serviceID: serviceID,
          status: "error",
        };
        transResultArr.push(obj);
        break;
      } else {
        charasPerTime = services[serviceID].charasPerTime;
      }
      //判断翻译引擎额度是否够本次翻译
      if (services[serviceID].isMultiParas && leftArr.length > 1
        && leftArr[0].length <= charasPerTime && leftArr[0].length > 0) {
        //将可以合并的句子按翻译引擎字符数限制合并
        // 超过翻译引擎字符数限制的句子在翻译前拆分，以后合并
        // 翻译结束再根据"\n"拆分合并的句子
        const lengthOfBefor = leftArr.length;
        const combineObj = fullTextTranslate.combineByLimitOneRequest(leftArr, charasPerTime);
        toTran = combineObj.str;
        leftArr = combineObj.leftArr;
        const lengthOfAfter = leftArr.length;
        const arrLengthToTran = lengthOfBefor - lengthOfAfter;
        const resultStr = await fullTextTranslate.translateGo(toTran);
        if (resultStr == "no available service") {
          const obj: TransResult = {
            translation: resultStr,
            serviceID: serviceID,
            status: "error",
          };
          transResultArr.push(obj);
          break;
        }
        const reg = /\n$/g;
        const splitArr = resultStr.replace(reg, '').split("\n");
        if (arrLengthToTran != splitArr.length) {
          const obj: TransResult = {
            translation: resultStr,
            serviceID: serviceID,
            status: "error",
          };
          transResultArr.push(obj);
          break;
        }
        for (const item of splitArr) {
          const obj: TransResult = {
            translation: item,
            serviceID: serviceID,
            status: "success",
          };
          transResultArr.push(obj);
        }
      } else {
        //翻译引擎不支持多段翻译或者需要拆分
        //Translation engine does not support multi-paragraph translation
        toTran = leftArr.shift()!;
        if (toTran.length > charasPerTime) {
          toTranArr = this.wholeSentenceSplit(toTran, charasPerTime);
          const tempArr: string[] = [];
          for (const toTran of toTranArr) {
            const resultStr = await fullTextTranslate.translateGo(toTran);
            if (resultStr == "no available service") {
              const obj: TransResult = {
                translation: resultStr,
                serviceID: serviceID,
                status: "error",
              };
              transResultArr.push(obj);
              break;
            }
            tempArr.push(resultStr);
          }
          const resultStr = tempArr.join("");
          const obj: TransResult = {
            translation: resultStr,
            serviceID: serviceID,
            status: "success",
          };
          transResultArr.push(obj);
        } else {
          const resultStr = await fullTextTranslate.translateGo(toTran);
          if (resultStr == "no available service") {
            const obj: TransResult = {
              translation: resultStr,
              serviceID: serviceID,
              status: "error",
            };
            transResultArr.push(obj);
            break;
          }
          const obj: TransResult = {
            translation: resultStr,
            serviceID: serviceID,
            status: "success",
          };
          transResultArr.push(obj);
        }
      }
      LoopCountor % 3 == 0 ? text = translatingInfoA
        : (LoopCountor % 2 ? text = translatingInfoB : text = translatingInfoC);
      translatingProgress.changeLine({
        text: text,
      });
      LoopCountor += 1;
    }
    translatingProgress.close();
    return transResultArr;
  }




  static translateGo = async (sourceSegment: string) => {
    let onSwitchResult;
    const serviceID = getSingleServiceUnderUse().serviceID as string;
    const secretKey = getSingleServiceUnderUse().key as string;
    let secretKeyObj;
    let paraResult: any;
    if (!Zotero.Streamer._socketOpen()) {
      fullTextTranslate.showInfo(getString("info-networkDisconnected"), 5000);
      return paraResult["result"] = `[请求错误]：${serviceID}`;
    }
    if (services[serviceID].hasSecretKey) {
      secretKeyObj = serviceManage.getSingleSecretKey(serviceID, secretKey);
      if (secretKeyObj) {
        const charactersTotranslate = sourceSegment.length;
        let factor = Number(getPref('charasLimitFactor'));
        if (isNaN(factor)) {
          factor = 1;
        }
        let charasLimit = services[serviceID].charasLimit;
        if (factor != undefined) {
          charasLimit = services[serviceID].charasLimit * factor;
        }
        const serviceAvailableCharacters = charasLimit - secretKeyObj?.charConsum;
        if (serviceAvailableCharacters < charactersTotranslate) {
          onSwitchResult = serviceManage.onSwitch();
          //如果更换引擎失败，退出translateGo后保存翻译原文和译文到缓存
          if (!onSwitchResult) {
            //失败就存一下
            serviceManage.allkeyUsableCheck();
            return "no available service";
            //break
            //翻译引擎更换成功，需要继续完成翻译任务，不能break，同时切换记录
          } else {
            let serviceID = getSingleServiceUnderUse().serviceID as string;
            if (sourceSegment.length > services[serviceID].charasPerTime - 20) {
              const sourceTxtArr = fullTextTranslate.wholeSentenceSplit(sourceSegment, services[serviceID].charasPerTime);
              const sourceTxtArrTrans: string[] = [];
              for (const sourceSegment of sourceTxtArr) {
                const result = await fullTextTranslate.translateGo(sourceSegment) as string;
                sourceTxtArrTrans.push(result as string);
                serviceID = getSingleServiceUnderUse().serviceID as string;
                if (services[serviceID].QPS) { await Zotero.Promise.delay(1000 / services[serviceID].QPS); }
              }
              const Result = sourceTxtArrTrans.join('');
              return Result;
              //break
            } else {
              const Result = await fullTextTranslate.translateGo(sourceSegment) as string;
              return Result;
            }
          }
        }
      }
    }

    if (serviceID == "baiduModify") {
      //const secretKey = (services["baidu"].secretKey as secretKey[]).filter((item: secretKey) => item.usable)[0].key
      try {
        paraResult = await baiduModify(sourceSegment, secretKey);
      } catch (e) {
        paraResult["result"] = `[请求错误]：${serviceID}`;
      }
    } else if (serviceID == "baidufieldModify") {
      //const secretKey = (services["baidufield"].secretKey as secretKey[]).filter((item: secretKey) => item.usable)[0].key
      try {
        paraResult = await baidufieldModify(sourceSegment, secretKey);
      } catch (e) {
        paraResult["result"] = `[请求错误]：${serviceID}`;
      }
    } else if (serviceID == "tencentTransmart") {
      try {
        paraResult = await tencentTransmart(sourceSegment);
      } catch (e) {
        paraResult["result"] = `[请求错误]：${serviceID}`;
      }
    } else {
      try {
        paraResult = await Zotero.PDFTranslate.api.translate(sourceSegment);
      } catch (e) {
        paraResult["result"] = `[请求错误]：${serviceID}`;
      }
    }
    const result = paraResult.result;
    //如果翻译失败,更换引擎仅限于调用pdfTranslate
    if (result.includes("[请求错误]") || result.includes("[Request Error]")) {
      //hasSwitch是否执行切换引擎或账号操作
      //onSwitchResult为更换成功与否
      if (services[serviceID].secretKey !== undefined && services[serviceID].secretKey?.length) {
        const service = services[serviceID];
        //如果每次更新秘钥字符消耗量，则无需在此记录
        //updatecharConsum(sourceSegment.length, service);

        serviceManage.singleSecretKeyUsableCheck();
      }
      //todo 如果其原因，如网络不通，则解决问题后继续
      onSwitchResult = serviceManage.onSwitch();
      //如果更换引擎失败，退出translateGo后保存翻译原文和译文到缓存
      if (!onSwitchResult) {
        //失败就存一下
        serviceManage.allkeyUsableCheck();
        return "no available service";
        //break
        //翻译引擎更换成功，需要继续完成翻译任务，不能break，同时切换记录
      } else {
        let serviceID = getSingleServiceUnderUse().serviceID as string;
        if (sourceSegment.length > services[serviceID].charasPerTime) {
          const sourceTxtArr = fullTextTranslate.wholeSentenceSplit(sourceSegment, services[serviceID].charasPerTime);
          const sourceTxtArrTrans: string[] = [];
          for (const sourceSegment of sourceTxtArr) {
            const result = await fullTextTranslate.translateGo(sourceSegment) as string;
            sourceTxtArrTrans.push(result as string);
            serviceID = getSingleServiceUnderUse().serviceID as string;
            if (services[serviceID].QPS) { await Zotero.Promise.delay(1000 / services[serviceID].QPS); }
          }
          const Result = sourceTxtArrTrans.join('');
          return Result;
        } else {
          const Result = await fullTextTranslate.translateGo(sourceSegment) as string;
          return Result;
        }
      }
      //翻译成功终止循环
    } else {
      //对有密钥的引擎累计消耗的字符数
      if (services[serviceID].secretKey) {
        //charConsumRecoder += sourceSegment.length;
        //secretKeyObj!["charConsum"] = charConsumRecoder
        updatecharConsum(sourceSegment.length, services[serviceID]);

      }
      onSwitchResult = true;
    }
    return result;
  };
  /**
   * 翻译引擎：支持换行，字数限制，QPS
   * @param sourceTxt 
   * @returns 
   */
  //删除行首不翻译的字符
  static beginNoTransExtract(sourceTxt: string) {
    const regSS = /^[\W.]+/;
    const regSSMatch = sourceTxt.match(regSS);
    let begingSS = '';
    if (regSSMatch != null) {
      begingSS = regSSMatch[0];
    }
    return begingSS;
  }
  /**
   * 截取的行尾内容不包括最后的标点
   * @param sourceTxt 
   * @returns 
   */
  static endNoTransExtract(sourceTxt: string) {
    //测试后向断言,通过
    //const regSS = /(?<=[.?!"]) /g
    const regSS = /[\[\(][0-9\W]+[^.?!]"?(?=[.?!"]$)|(?<=[.?!]"?)[\[\(][0-9\W]+|(<su[pb]>[^>]+?<\/su[pb]>)+[^A-Za-z.]*(?=[.?!]"?$)/gm;
    const regSSMatch = sourceTxt.match(regSS);
    let endSS = '';
    if (regSSMatch != null) {
      endSS = regSSMatch[0];
    }
    return endSS;
  }

  /**
   * 根据插件id查看插件版本
   * 不传参数返回所有插件
   * @param id 
   * @returns 
   */
  static async getAddonInfo(id?: string) {
    const { AddonManager } = ChromeUtils.import("resource://gre/modules/AddonManager.jsm");
    if (id !== undefined && id != "") {
      const addon = await AddonManager.getAddonByID(id);
      if (addon) {
        return {
          version: addon.version,
          userDisabled: addon.userDisabled
        };
      }
    } else {
      const addonAll = await AddonManager.getAllAddons();
      if (addonAll) {
        return addonAll;
      }
    }
  }

  static fullTextTranslateNotifierCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Selected note!",
        type: "success",
        progress: 100,
      })
      .show();
  }
  /**
   * 通过进度条显示信息
   * 关闭其他窗口若为true，则关闭最近一次生成的所有进度条
   * 但不会关闭更早的进度条窗口
   * 不传参数用 undefined 表示
   * @param fullTextTranslateInfo 显示的信息
   * @param window 指定显示在哪个窗口中，如指定 addon.data.prefs.window，否则主窗口
   * @param closeOnClick 默认点击时关闭
   * @param closeTime 默认不自动关闭
   * @param closeOtherProgressWindows 默认 true
   */
  static showInfo(fullTextTranslateInfo: string, closeTime?: number, window?: Window, closeOnClick?: boolean, closeOtherProgressWindows?: boolean) {
    /*     if (closeOtherProgressWindows) {
          while (true) {
            if (typeof Zotero.ProgressWindowSet != "undefined") {
              Zotero.ProgressWindowSet.closeAll()
            } else {
              break
            }
          }
        } */
    const popupWin = new ztoolkit.ProgressWindow(config.addonName, {
      window: window ? window : undefined,
      closeOnClick: closeOnClick ? closeOnClick : true,
      closeTime: closeTime ? closeTime : -1,
      closeOtherProgressWindows: closeOtherProgressWindows ? closeOtherProgressWindows : true
    })
      .createLine({
        text: fullTextTranslateInfo,
        type: "default",
        progress: 0,
      });
    popupWin.show();

    return popupWin;
  }


  /**
   * 转义字符串中需要转义的字符
   * @param str 
   * @returns 
   */
  static escapeString(str: string) {
    const result = str.replace(/[\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}]/g, '\\$&') as string;
    return result;
  }

  /**
   * 修复翻译引擎错误处理的上下标和标题
   * @param mdTxtTransResult 
   * @returns 
   */
  static modifySubSupHeading = (mdTxtTransResult: string) => {
    //有时markdown标题标志#翻译为＃，和文字没有空格，需要替换＃为#，添加空格
    //g是全局标志，没有的话仅匹配一项
    //限定匹配6个以内的#或＃
    const regMd = /^ *[#＃]{0,5}[#＃](?![#＃])/mg;
    const ss = mdTxtTransResult.match(regMd);
    if (ss != null) {
      //最长的需要先替换，古先要把最长的放到数组前面
      const sss = [...new Set(ss)];
      sss?.sort((a, b) => b.length - a.length);
      if (sss.length) {
        for (const s of sss) {
          //先把匹配项的空格删除然后替换＃，末尾加空格，这是要替换为的内容
          const t = s.replace(/ /g, '').replace(/＃/g, '#') + ' ';
          //按先长后短的顺序全文替换
          const reg = new RegExp("^" + s, 'gm');
          mdTxtTransResult = mdTxtTransResult.replace(reg, t);
        }
      }
    }
    if (mdTxtTransResult.match(/su[bp]|&#x3C;?|&#x3E;?|&#60;?|&#62;?/g) != null) {
      const regMDSubp1 = /(&#x3C);?|(&#60);?|&lt;/g;
      const regMDSubp2 = /(&#x3E);?|(&#62);?|&gt;/g;
      const regMDSubp3 = /<([^<>＜＞]{1,10}?)(\/su[bp])([^<>＜＞]{1,10}?)>/g;
      const regMDSubp4 = /(<\/su[bp])([^><＜＞]{1,10}?)>/g;
      const regMDSubp5 = /<([^><＜＞]{1,10}?)(\/su[bp]>)/g;
      const regMDSubp6 = /(<su[bp])([^><＜＞]{1,10}?)>/g;
      const regMDSubp7 = /<([^></]{1,10}?)(su[bp]>)/g;
      const regMDSubp8 = /(<\/)[^<>/＜＞]{1,10}?(su[bp]>)/g;
      const regMDSubp9 = /亚([^<>＜＞]{1,10}?)\/亚/g;
      const regMDSubp10 = /(?<!<)(su[bp]) *([^<>＜＞]{1,10}?) *\/\1/g;
      const regMDSubp11 = /<(su[bp]>) *([^<>＜＞]{1,10}?) *<\1/g;
      const regMDSubp12 = /＜su([pb])＞/g;
      const regMDSubp13 = /＜\/su([pb])＞/g;
      const regMDSubp14 = /<su([bp])>([^<>＜＞]{15,})/g;
      const regMDSubp15 = /([^<>＜＞]{15,})<\/su([bp])>/g;

      let temp;
      const match1 = mdTxtTransResult.match(regMDSubp1);
      if (match1 != null) {
        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp1, "<");
      }
      const match2 = mdTxtTransResult.match(regMDSubp2);
      if (match2 != null) {
        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp2, ">");
      }
      const match3 = mdTxtTransResult.match(regMDSubp3);
      if (match3 != null) {
        temp = mdTxtTransResult;

        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp3, "$1<$2>$3");
      }
      const match4 = mdTxtTransResult.match(regMDSubp4);
      if (match4 != null) {

        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp4, "$1>$2");
      }
      const match5 = mdTxtTransResult.match(regMDSubp5);
      if (match5 != null) {
        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp5, "$1<$2");
      }
      const match6 = mdTxtTransResult.match(regMDSubp6);
      if (match6 != null) {
        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp6, "$1>$2");
      }
      const match7 = mdTxtTransResult.match(regMDSubp7);
      if (match7 != null) {
        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp7, "$1<$2");
      }
      const match8 = mdTxtTransResult.match(regMDSubp8);
      if (match8 != null) {
        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp8, "$1$2");
      }
      mdTxtTransResult = mdTxtTransResult.replace(regMDSubp12, "<su$1>");
      mdTxtTransResult = mdTxtTransResult.replace(regMDSubp13, "</su$1>");
      const match9 = mdTxtTransResult.match(regMDSubp9);
      if (match9 != null) {
        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp9, "<sub>$1</sub>");
      }

      const match10 = mdTxtTransResult.match(regMDSubp10);
      if (match10 != null) {
        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp10, "<$1>$2</$1>");
      }
      const match11 = mdTxtTransResult.match(regMDSubp11);
      if (match11 != null) {
        temp = mdTxtTransResult;
        mdTxtTransResult = mdTxtTransResult.replace(regMDSubp11, "<$1$2</$1");
      }
      mdTxtTransResult = mdTxtTransResult.replace(regMDSubp14, "<su$1></su$1>$2");
      mdTxtTransResult = mdTxtTransResult.replace(regMDSubp15, "$1<su$2></su$2>");
    };
    return mdTxtTransResult;
  };
}

