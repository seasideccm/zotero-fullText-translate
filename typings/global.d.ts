declare const _globalThis: {
  [key: string]: any;
  Zotero: _ZoteroTypes.Zotero;
  ZoteroPane: _ZoteroTypes.ZoteroPane;
  Zotero_Tabs: typeof Zotero_Tabs;
  window: Window;
  document: Document;
  ztoolkit: ZToolkit;
  addon: typeof addon;
};

declare type ZToolkit = ReturnType<
  typeof import("../src/utils/ztoolkit").createZToolkit
>;

declare const ztoolkit: ZToolkit;

declare const rootURI: string;

declare const addon: import("../src/addon").default;

declare const __env__: "production" | "development";

declare class Localization { }

declare type SecretKey = {
  key: string;
  usable: boolean;
  charConsum: number;
  dateMarker?: string;
};
declare type FullTextTranslate = {
  docCellArr: object[];
};

declare type RowsData = {

  key: string;
  usable: boolean;
  charConsum: number;
};

declare type CellBox = {
  top: number;
  bottom: number;
  left: number;
  //right: number;
  items: PDFItem[];
};


declare type PDFItem = {
  chars: {
    baseline: number;
    c: string;
    fontName: string;
    fontSize: number;
    rect: number[];
    rotation: number;
  }[];
  dir: string;
  fontName: string;
  height: number;
  str: string;
  transform: number[];
  width: number;
  url?: string;
  hasEOL: boolean;
};

/**
 * 将一段字符串转换为行，一整行可以有多个行
 */
declare type PDFLine = {
  x: number;
  _x?: number;
  y: number;
  text: string;
  height: number;
  _height: number[];
  width: number;
  url?: string;
  pageIndex?: number;
  lineIndex?: number;
  lineSpace?: number;
  sourceLine: PDFItem[];
  fontName: string;
  _fontName: string[];
  isReference?: boolean;
};

declare type PDFParagraph = {
  lineHeight: number;
  text: string;
  _height: number[];
  left: number;
  right: number;
  top: number;
  bottom: number;
  pageIndex: number;
  width: number;
  isReference?: boolean;
  sourceLines: PDFItem[][];
  lines?: PDFLine[];
  fontName?: string;
  lineSpace?: number;
  type?: string;
};



declare type Services = {
  [key: string]: typeof TranslateService;
};

declare namespace _ZoteroTypes {
  interface Utilities {
    unescapeHTML(str: string): string;
  }
}

declare type TransResult = {
  translation: string;
  serviceID: string;
  status: "error" | "success";
};

declare type DocCell = {
  id: string;
  type: "img" | "table" | "paragraph" | "title" | "headMarker" | "tailMarker" | "contentEnd" | "citation" | "header" | "footer";
  rawContent: string;
  rawToTranslate?: string | string[];
  translation?: string | string[];
  result?: string;
  status?: string;
  serviceID?: string | string[];
  itemID?: number;
  imgsInLine?: string | string[];
};

declare type DocItem = {
  itemID?: number;
  newItemID?: number;
  key?: string;
  content: DocCell[];
  status?: "error" | "success";
};
