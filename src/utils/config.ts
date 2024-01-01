


//特殊字符要显示的内容，即正文中应该是什么
export const specialCharacters = {
  '\u0000': '－', '\u0001': '?', '\u0002': '×', '\u0003': '?',
  '\u0004': '?', '\u0005': '?', '\u0006': '?', '\u0007': '?',
  '\u0008': '?', '\u000f': '●', "\u0015": "≥",
};
//特殊字符对应显示为unicode码
export const specialCharaDisplay = {
  '\u0000': '\\u0000', '\u0001': '\\u0001', '\u0002': '\\u0002', '\u0003': '\\u0003',
  '\u0004': '\\u0004', '\u0005': '\\u0005', '\u0006': '\\u0006', '\u0007': '\\u0007',
  '\u0008': '\\u0008', "\u0015": "\\u0015"
};
export const pdfCharasReplace = {
  "¼": "=",
  '\\u0000': '－',
  '\\u0002': '×',
  '\\u0003': '－',
  '\\u0004': '*',
  '\\u000f': '●',
  "\\u0015": "≥",
};
export const boldFontStyle = ["AdvTT7d6ad6bc", "AdvP4ADA8D", "AdvP4AA440", "AdvP978E", "AdvP405AA6", "AdvPi3", "AdvTTecf15426.B", "AdvP418142"];
export const italicFontStyle = ["AdvP9794", 'AdvTT52d06db3.I',];
export const boldItalicFontStyle = [];
export const normalFontStyle = ["AdvP9725",];
export const fontStyleCollection = {
  boldFontStyle: boldFontStyle,
  italicFontStyle: italicFontStyle,
  boldItalicFontStyle: boldItalicFontStyle,
};

export const RenderingStates = {
  INITIAL: 0,
  RUNNING: 1,
  PAUSED: 2,
  FINISHED: 3,
};

export const alphabetDigital = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const OPS = {
  dependency: 1,
  setLineWidth: 2,
  setLineCap: 3,
  setLineJoin: 4,
  setMiterLimit: 5,
  setDash: 6,
  setRenderingIntent: 7,
  setFlatness: 8,
  setGState: 9,
  save: 10,
  restore: 11,
  transform: 12,
  moveTo: 13,
  lineTo: 14,
  curveTo: 15,
  curveTo2: 16,
  curveTo3: 17,
  closePath: 18,
  rectangle: 19,
  stroke: 20,
  closeStroke: 21,
  fill: 22,
  eoFill: 23,
  fillStroke: 24,
  eoFillStroke: 25,
  closeFillStroke: 26,
  closeEOFillStroke: 27,
  endPath: 28,
  clip: 29,
  eoClip: 30,
  beginText: 31,
  endText: 32,
  setCharSpacing: 33,
  setWordSpacing: 34,
  setHScale: 35,
  setLeading: 36,
  setFont: 37,
  setTextRenderingMode: 38,
  setTextRise: 39,
  moveText: 40,
  setLeadingMoveText: 41,
  setTextMatrix: 42,
  nextLine: 43,
  showText: 44,
  showSpacedText: 45,
  nextLineShowText: 46,
  nextLineSetSpacingShowText: 47,
  setCharWidth: 48,
  setCharWidthAndBounds: 49,
  setStrokeColorSpace: 50,
  setFillColorSpace: 51,
  setStrokeColor: 52,
  setStrokeColorN: 53,
  setFillColor: 54,
  setFillColorN: 55,
  setStrokeGray: 56,
  setFillGray: 57,
  setStrokeRGBColor: 58,
  setFillRGBColor: 59,
  setStrokeCMYKColor: 60,
  setFillCMYKColor: 61,
  shadingFill: 62,
  beginInlineImage: 63,
  beginImageData: 64,
  endInlineImage: 65,
  paintXObject: 66,
  markPoint: 67,
  markPointProps: 68,
  beginMarkedContent: 69,
  beginMarkedContentProps: 70,
  endMarkedContent: 71,
  beginCompat: 72,
  endCompat: 73,
  paintFormXObjectBegin: 74,
  paintFormXObjectEnd: 75,
  beginGroup: 76,
  endGroup: 77,
  // beginAnnotations: 78,
  // endAnnotations: 79,
  beginAnnotation: 80,
  endAnnotation: 81,
  // paintJpegXObject: 82,
  paintImageMaskXObject: 83,
  paintImageMaskXObjectGroup: 84,
  paintImageXObject: 85,
  paintInlineImageXObject: 86,
  paintInlineImageXObjectGroup: 87,
  paintImageXObjectRepeat: 88,
  paintImageMaskXObjectRepeat: 89,
  paintSolidColorImageMask: 90,
  constructPath: 91,
};

export class OutputScale {
  [x: string]: number;
  constructor() {
    const pixelRatio = window.devicePixelRatio || 1;

    /**
     * @type {number} Horizontal scale.
     */
    this.sx = pixelRatio;

    /**
     * @type {number} Vertical scale.
     */
    this.sy = pixelRatio;
  }

  /**
   * @type {boolean} Returns `true` when scaling is required, `false` otherwise.
   */
  /* get scaled() {
    return this.sx !== 1 || this.sy !== 1;} */

}


export const langCode_francVsZotero = {
  "cmn": "zh",
  "spa": "es",
  "eng": "en",
  "rus": "ru",
  "arb": "ar",
  "ben": "bd",
  "hin": "hi",
  "por": "pt",
  "ind": "id",
  "jpn": "ja",
  "fra": "fr",
  "deu": "de",
  "jav": "jv",
  "kor": "ko",
  "tel": "te",
  "vie": "vi",
  "mar": "mr",
  "ita": "it",
  "tam": "ta",
  "tur": "tr",
  "urd": "ur",
  "guj": "gu",
  "pol": "pl",
  "ukr": "uk",
  "kan": "kn",
  "mai": "",
  "mal": "ml",
  "pes": "fa",
  "mya": "my",
  "swh": "sw",
  "sun": "su",
  "ron": "ro",
  "pan": "pa",
  "bho": "",
  "amh": "am",
  "hau": "ha",
  "fuv": "",
  "bos": "",
  "hrv": "",
  "nld": "",
  "srp": "",
  "tha": "",
  "ckb": "",
  "yor": "",
  "uzn": "",
  "zlm": "",
  "ibo": "",
  "npi": "",
  "ceb": "",
  "skr": "",
  "tgl": "",
  "hun": "",
  "azj": "",
  "sin": "",
  "koi": "",
  "ell": "el",
  "ces": "cs",
  "mag": "",
  "run": "",
  "bel": "",
  "plt": "",
  "qug": "",
  "mad": "",
  "nya": "",
  "zyb": "",
  "pbu": "",
  "kin": "",
  "zul": "",
  "bul": "bg",
  "swe": "",
  "lin": "",
  "som": "",
  "hms": "",
  "hnj": "",
  "ilo": "",
  "kaz": "",
};

export const langCodeNameSpeakers = {
  cmn: { name: "Mandarin Chinese 普通话汉语", speakers: "885M" },
  spa: { name: "Spanish 西班牙语", speakers: "332M" },
  eng: { name: "English 英语", speakers: "322M" },
  rus: { name: "Russian 俄语", speakers: "288M" },
  arb: { name: "Standard Arabic 标准阿拉伯语", speakers: "280M" },
  ben: { name: "Bengali 孟加拉语", speakers: "196M" },
  hin: { name: "Hindi 印地语", speakers: "182M" },
  por: { name: "Portuguese 葡萄牙语", speakers: "182M" },
  ind: { name: "Indonesian 印尼语", speakers: "140M" },
  jpn: { name: "Japanese 日语", speakers: "125M" },
  fra: { name: "French 法语", speakers: "124M" },
  deu: { name: "German 德语", speakers: "121M" },
  jav: { name: "Javanese (Javanese) 爪哇语（爪哇语）", speakers: "76M" },
  kor: { name: "Korean 韩语", speakers: "75M" },
  tel: { name: "Telugu 泰卢固语", speakers: "73M" },
  vie: { name: "Vietnamese 越南语", speakers: "67M" },
  mar: { name: "Marathi 马拉地语", speakers: "65M" },
  ita: { name: "Italian 意大利语", speakers: "63M" },
  tam: { name: "Tamil 泰米尔语", speakers: "62M" },
  tur: { name: "Turkish 土耳其语", speakers: "59M" },
  urd: { name: "Urdu 乌尔都语", speakers: "54M" },
  guj: { name: "Gujarati 古吉拉特语", speakers: "44M" },
  pol: { name: "Polish 波兰语", speakers: "44M" },
  ukr: { name: "Ukrainian 乌克兰语", speakers: "41M" },
  kan: { name: "Kannada 坎纳达语", speakers: "38M" },
  mai: { name: "Maithili 迈斯利", speakers: "35M" },
  mal: { name: "Malayalam 马拉雅拉姆语", speakers: "34M" },
  pes: { name: "Iranian Persian 伊朗波斯语", speakers: "33M" },
  mya: { name: "Burmese 缅甸语", speakers: "31M" },
  swh: { name: "Swahili (individual language) 斯瓦希里语（个人语言）", speakers: "30M" },
  sun: { name: "Sundanese 松丹尼斯语", speakers: "27M" },
  ron: { name: "Romanian 罗马尼亚语", speakers: "26M" },
  pan: { name: "Panjabi 潘贾比", speakers: "26M" },
  bho: { name: "Bhojpuri 比哈尔方言", speakers: "25M" },
  amh: { name: "Amharic 阿姆哈拉语", speakers: "23M" },
  hau: { name: "Hausa 豪萨", speakers: "22M" },
  fuv: { name: "Nigerian Fulfulde 尼日利亚富富尔德", speakers: "22M" },
  bos: { name: "Bosnian (Cyrillic) 波斯尼亚文（西里尔文）", speakers: "21M" },
  hrv: { name: "Croatian 克罗地亚语", speakers: "21M" },
  nld: { name: "Dutch 荷兰语", speakers: "21M" },
  srp: { name: "Serbian (Cyrillic) 塞尔维亚语（西里尔语）", speakers: "21M" },
  tha: { name: "Thai 泰语", speakers: "21M" },
  ckb: { name: "Central Kurdish 中部库尔德人", speakers: "20M" },
  yor: { name: "Yoruba 约鲁巴", speakers: "20M" },
  uzn: { name: "Northern Uzbek (Cyrillic) 北乌兹别克语（西里尔语）", speakers: "18M" },
  zlm: { name: "Malay (individual language) (Arabic) 马来语（个人语言）（阿拉伯语）", speakers: "18M" },
  ibo: { name: "Igbo 伊博人", speakers: "17M" },
  npi: { name: "Nepali (individual language) 尼泊尔语（个人语言）", speakers: "16M" },
  ceb: { name: "Cebuano 宿务诺", speakers: "15M" },
  skr: { name: "Saraiki 萨赖基", speakers: "15M" },
  tgl: { name: "Tagalog 他加禄语", speakers: "15M" },
  hun: { name: "Hungarian 匈牙利语", speakers: "15M" },
  azj: { name: "North Azerbaijani (Cyrillic) 北阿塞拜疆语（西里尔语）", speakers: "14M" },
  sin: { name: "Sinhala 僧伽罗语", speakers: "13M" },
  koi: { name: "Komi-Permyak 科米-佩尔米亚克", speakers: "13M" },
  ell: { name: "Modern Greek (1453-) 现代希腊语（1453-）", speakers: "12M" },
  ces: { name: "Czech 捷克语", speakers: "12M" },
  mag: { name: "Magahi 马加希", speakers: "11M" },
  run: { name: "Rundi 隆迪", speakers: "11M" },
  bel: { name: "Belarusian 白俄罗斯语", speakers: "10M" },
  plt: { name: "Plateau Malagasy 马达加斯加高原", speakers: "10M" },
  qug: { name: "Chimborazo Highland Quichua 钦博拉索高地奎丘亚人", speakers: "10M" },
  mad: { name: "Madurese 马杜雷塞", speakers: "10M" },
  nya: { name: "Nyanja 尼扬贾", speakers: "10M" },
  zyb: { name: "Yongbei Zhuang 永北庄", speakers: "10M" },
  pbu: { name: "Northern Pashto 北普什图语", speakers: "10M" },
  kin: { name: "Kinyarwanda 基尼亚卢旺达语", speakers: "9M" },
  zul: { name: "Zulu 祖鲁语", speakers: "9M" },
  bul: { name: "Bulgarian 保加利亚语", speakers: "9M" },
  swe: { name: "Swedish 瑞典语", speakers: "9M" },
  lin: { name: "Lingala 林加拉", speakers: "8M" },
  som: { name: "Somali 索马里人", speakers: "8M" },
  hms: { name: "Southern Qiandong Miao 黔东南部苗", speakers: "8M" },
  hnj: { name: "Hmong Njua 苗族人", speakers: "8M" },
  ilo: { name: "Iloko 伊洛科", speakers: "8M" },
  kaz: { name: "Kazakh 哈萨克语", speakers: "8M" },
  uig: { name: "Uighur (Arabic) 维吾尔语（阿拉伯语）", speakers: "7M" },
  hat: { name: "Haitian 海地人", speakers: "7M" },
  khm: { name: "Khmer 高棉语", speakers: "7M" },
  prs: { name: "Dari 从", speakers: "7M" },
  hil: { name: "Hiligaynon 希利盖农", speakers: "7M" },
  sna: { name: "Shona 夏娜！", speakers: "7M" },
  tat: { name: "Tatar 鞑靼人", speakers: "7M" },
  xho: { name: "Xhosa 科萨", speakers: "7M" },
  hye: { name: "Armenian 亚美尼亚语", speakers: "7M" },
  min: { name: "Minangkabau 米南卡保", speakers: "7M" },
  afr: { name: "Afrikaans 南非荷兰语", speakers: "6M" },
  lua: { name: "Luba-Lulua 卢巴-卢卢阿", speakers: "6M" },
  sat: { name: "Santali 桑塔利", speakers: "6M" },
  bod: { name: "Tibetan 藏族", speakers: "6M" },
  tir: { name: "Tigrinya 提格里尼亚", speakers: "6M" },
  fin: { name: "Finnish 芬兰语", speakers: "6M" },
  slk: { name: "Slovak 斯洛伐克语", speakers: "6M" },
  tuk: { name: "Turkmen (Cyrillic) 土库曼语（西里尔语）", speakers: "5M" },
  dan: { name: "Danish 丹麦语", speakers: "5M" },
  nob: { name: "Norwegian Bokmål 挪威博克莫尔", speakers: "5M" },
  suk: { name: "Sukuma 须间町", speakers: "5M" },
  als: { name: "Tosk Albanian 托斯克阿尔巴尼亚语", speakers: "5M" },
  sag: { name: "Sango 新闻", speakers: "5M" },
  nno: { name: "Norwegian Nynorsk 挪威尼诺斯克", speakers: "5M" },
  heb: { name: "Hebrew 希伯来文", speakers: "5M" },
  mos: { name: "Mossi 莫西", speakers: "5M" },
  tgk: { name: "Tajik 塔吉克语", speakers: "4M" },
  cat: { name: "Catalan 加泰罗尼亚语", speakers: "4M" },
  sot: { name: "Southern Sotho 南索托", speakers: "4M" },
  kat: { name: "Georgian 格鲁吉亚语", speakers: "4M" },
  bcl: { name: "Central Bikol 中比科尔", speakers: "4M" },
  glg: { name: "Galician 加利西亚语", speakers: "4M" },
  lao: { name: "Lao 老挝", speakers: "4M" },
  lit: { name: "Lithuanian 立陶宛语", speakers: "4M" },
  umb: { name: "Umbundu 翁本杜", speakers: "4M" },
  tsn: { name: "Tswana 茨瓦纳", speakers: "4M" },
  vec: { name: "Venetian 威尼斯人", speakers: "4M" },
  nso: { name: "Pedi 佩迪", speakers: "4M" },
  ban: { name: "Balinese 巴厘岛人", speakers: "4M" },
  bug: { name: "Buginese 布基尼塞语", speakers: "4M" },
  knc: { name: "Central Kanuri 中卡努里", speakers: "4M" },
  kng: { name: "Koongo 昆戈", speakers: "3M" },
  ibb: { name: "Ibibio 伊比比奥", speakers: "3M" },
  lug: { name: "Ganda 甘达", speakers: "3M" },
  ace: { name: "Achinese 阿西尼亚人", speakers: "3M" },
  bam: { name: "Bambara 班巴拉", speakers: "3M" },
  tzm: { name: "Central Atlas Tamazight 中央阿特拉斯塔马兹特", speakers: "3M" },
  ydd: { name: "Eastern Yiddish 东部意第绪语", speakers: "3M" },
  kmb: { name: "Kimbundu 金本杜", speakers: "3M" },
  lun: { name: "Lunda 隆达", speakers: "3M" },
  shn: { name: "Shan 掸族", speakers: "3M" },
  war: { name: "Waray (Philippines) 瓦雷（菲律宾）", speakers: "3M" },
  dyu: { name: "Dyula 迪尤拉", speakers: "3M" },
  wol: { name: "Wolof 沃洛夫", speakers: "3M" },
  kir: { name: "Kirghiz 柯尔克孜族", speakers: "3M" },
  nds: { name: "Low German 低地德语", speakers: "3M" },
  fuf: { name: "Pular 普拉尔", speakers: "3M" },
  mkd: { name: "Macedonian 马其顿语", speakers: "3M" },
  vmw: { name: "Makhuwa 马库瓦", speakers: "3M" },
  zgh: { name: "Standard Moroccan Tamazight 标准摩洛哥塔马兹特", speakers: "2M" },
  ewe: { name: "Ewe 母羊", speakers: "2M" },
  khk: { name: "Halh Mongolian 哈尔蒙古语", speakers: "2M" },
  slv: { name: "Slovenian 斯洛文尼亚语", speakers: "2M" },
  ayr: { name: "Central Aymara 中艾马拉", speakers: "2M" },
  bem: { name: "Bemba (Zambia) 本巴（赞比亚）", speakers: "2M" },
  emk: { name: "Eastern Maninkakan 东马宁卡坎", speakers: "2M" },
  bci: { name: "Baoulé 巴乌莱", speakers: "2M" },
  bum: { name: "Bulu (Cameroon) 布卢（喀麦隆）", speakers: "2M" },
  epo: { name: "Esperanto 世界语", speakers: "2M" },
  pam: { name: "Pampanga 潘邦加", speakers: "2M" },
  tiv: { name: "Tiv", speakers: "2M" },
  tpi: { name: "Tok Pisin 托克皮辛", speakers: "2M" },
  ven: { name: "Venda 文达", speakers: "2M" },
  ssw: { name: "Swati 斯瓦蒂", speakers: "2M" },
  nyn: { name: "Nyankole 尼安科尔", speakers: "2M" },
  kbd: { name: "Kabardian 卡巴第安", speakers: "2M" },
  iii: { name: "Sichuan Yi 四川彝族", speakers: "2M" },
  yao: { name: "Yao 姚明", speakers: "2M" },
  lvs: { name: "Standard Latvian 标准拉脱维亚语", speakers: "2M" },
  quz: { name: "Cusco Quechua 库斯科盖丘亚", speakers: "2M" },
  src: { name: "Logudorese Sardinian 洛古多雷塞撒丁岛", speakers: "2M" },
  rup: { name: "Macedo-Romanian 马塞多-罗马尼亚", speakers: "2M" },
  sco: { name: "Scots 苏格兰人", speakers: "2M" },
  tso: { name: "Tsonga 聪加", speakers: "2M" },
  men: { name: "Mende (Sierra Leone) 门德（塞拉利昂）", speakers: "1M" },
  fon: { name: "Fon 丰", speakers: "1M" },
  nhn: { name: "Central Nahuatl 中央纳瓦特尔", speakers: "1M" },
  dip: { name: "Northeastern Dinka 丁卡东北部", speakers: "1M" },
  kde: { name: "Makonde 马孔德", speakers: "1M" },
  kbp: { name: "Kabiyè 卡比耶", speakers: "1M" },
  tem: { name: "Timne 蒂姆", speakers: "1M" },
  toi: { name: "Tonga (Zambia) 汤加（赞比亚）", speakers: "1M" },
  ekk: { name: "Standard Estonian 标准爱沙尼亚语", speakers: "1M" },
  snk: { name: "Soninke 索宁克", speakers: "1M" },
  cjk: { name: "Chokwe 乔克韦", speakers: "1M" },
  ada: { name: "Adangme 阿当梅", speakers: "1M" },
  aii: { name: "Assyrian Neo-Aramaic 亚述新阿拉姆语", speakers: "1M" },
  quy: { name: "Ayacucho Quechua 阿亚库乔·盖丘亚", speakers: "1M" },
  rmn: { name: "Balkan Romani 巴尔干罗姆人", speakers: "1M" },
  bin: { name: "Bini 比尼", speakers: "1M" },
  gaa: { name: "Ga 不包括在内。", speakers: "1M" },
  ndo: { name: "Ndonga 狗", speakers: "1M" },
  nym: { name: "Nyamwezi 月亮", speakers: "926K" },
  sus: { name: "Susu 素素", speakers: "923K" },
  tly: { name: "Talysh 塔利什", speakers: "915K" },
  srr: { name: "Serer 塞雷尔", speakers: "869K" },
  kha: { name: "Khasi 哈西", speakers: "865K" },
  oci: { name: "Occitan (post 1500) 奥奇坦（1500年后）", speakers: "855K" },
  hea: { name: "Northern Qiandong Miao 黔东北部苗族", speakers: "820K" },
  gkp: { name: "Guinea Kpelle 几内亚克佩勒", speakers: "808K" },
  hni: { name: "Hani 哈尼族", speakers: "747K" },
  fry: { name: "Western Frisian 西弗里西安", speakers: "730K" },
  yua: { name: "Yucateco 尤卡特科", speakers: "700K" },
  fij: { name: "Fijian 斐济人", speakers: "650K" },
  fur: { name: "Friulian 弗留利安", speakers: "600K" },
  tet: { name: "Tetum 德顿", speakers: "600K" },
  wln: { name: "Walloon 瓦隆", speakers: "600K" },
  eus: { name: "Basque 巴斯克", speakers: "588K" },
  oss: { name: "Ossetian 奥塞梯人", speakers: "588K" },
  nbl: { name: "South Ndebele 南恩德贝勒", speakers: "588K" },
  pov: { name: "Upper Guinea Crioulo 上几内亚克里乌洛", speakers: "580K" },
  cym: { name: "Welsh 威尔士语", speakers: "580K" },
  lus: { name: "Lushai 芦柴", speakers: "542K" },
  dag: { name: "Dagbani 达格巴尼", speakers: "540K" },
  dga: { name: "Southern Dagaare 南达加雷", speakers: "501K" },
  bre: { name: "Breton 布列塔尼", speakers: "500K" },
  kek: { name: "Kekchí 凯奇", speakers: "500K" },
  lij: { name: "Ligurian 利古里亚", speakers: "500K" },
  pcd: { name: "Picard 皮卡德", speakers: "500K" },
  roh: { name: "Romansh 罗曼语", speakers: "500K" },
  bfa: { name: "Bari 巴里", speakers: "480K" },
  kri: { name: "Krio 克里奥", speakers: "480K" },
  cnh: { name: "Hakha Chin 哈卡钦", speakers: "446K" },
  lob: { name: "Lobi 叶", speakers: "442K" },
  arn: { name: "Mapudungun 马普敦贡", speakers: "440K" },
  bba: { name: "Baatonum 巴托努姆", speakers: "400K" },
  dzo: { name: "Dzongkha 宗卡", speakers: "400K" },
  kea: { name: "Kabuverdianu", speakers: "394K" },
  sah: { name: "Yakut 雅库特", speakers: "363K" },
  smo: { name: "Samoan 萨摩亚语", speakers: "362K" },
  koo: { name: "Konzo 孔佐", speakers: "362K" },
  nzi: { name: "Nzima 恩济马", speakers: "353K" },
  maz: { name: "Central Mazahua 马扎华中部", speakers: "350K" },
  pis: { name: "Pijin 皮金", speakers: "350K" },
  ctd: { name: "Tedim Chin 泰迪姆·钦", speakers: "344K" },
  cos: { name: "Corsican 科西嘉", speakers: "341K" },
  ltz: { name: "Luxembourgish 卢森堡语", speakers: "336K" },
  lia: { name: "West-Central Limba 中西部林巴", speakers: "335K" },
  mlt: { name: "Maltese 马耳他语", speakers: "330K" },
  hna: { name: "Mina (Cameroon) 米纳（喀麦隆）", speakers: "327K" },
  zdj: { name: "Ngazidja Comorian 恩加齐贾科摩罗语", speakers: "312K" },
  guc: { name: "Wayuu 瓦鱼", speakers: "305K" },
  qwh: { name: "Huaylas Ancash Quechua 瓦伊拉斯·安卡什·盖丘亚", speakers: "300K" },
  quc: { name: "K'iche' 基切", speakers: "300K" },
  div: { name: "Dhivehi 迪维希", speakers: "287K" },
  isl: { name: "Icelandic 冰岛语", speakers: "283K" },
  kqn: { name: "Kaonde 考昂德", speakers: "276K" },
  pap: { name: "Papiamento 帕皮阿门托", speakers: "263K" },
  gle: { name: "Irish 爱尔兰语", speakers: "260K" },
  dyo: { name: "Jola-Fonyi 乔拉-丰伊", speakers: "260K" },
  hns: { name: "Caribbean Hindustani 加勒比印度斯坦人", speakers: "250K" },
  gjn: { name: "Gonja 贡贾", speakers: "250K" },
  njo: { name: "Ao Naga 奥那加", speakers: "232K" },
  hus: { name: "Huastec 华钢", speakers: "220K" },
  xsm: { name: "Kasem 卡西姆", speakers: "200K" },
  ote: { name: "Mezquital Otomi 梅兹奎塔尔大富", speakers: "200K" },
  qxn: { name: "Northern Conchucos Ancash Quechua 北孔丘科斯安卡什盖丘阿", speakers: "200K" },
  tyv: { name: "Tuvinian 图文尼人", speakers: "200K" },
  gag: { name: "Gagauz 加告兹", speakers: "198K" },
  san: { name: "Sanskrit 梵语", speakers: "194K" },
  shk: { name: "Shilluk 希卢克", speakers: "175K" },
  nba: { name: "Nyemba 涅恩巴", speakers: "172K" },
  miq: { name: "Mískito 米斯基托", speakers: "160K" },
  mam: { name: "Mam", speakers: "157K" },
  tah: { name: "Tahitian 塔希提语", speakers: "150K" },
  nav: { name: "Navajo 纳瓦霍人", speakers: "149K" },
  ami: { name: "Amis 阿米斯人", speakers: "138K" },
  lot: { name: "Otuho 奥图霍", speakers: "135K" },
  cak: { name: "Kaqchikel 卡奇克尔", speakers: "132K" },
  tzh: { name: "Tzeltal 泽尔塔尔", speakers: "130K" },
  tzo: { name: "Tzotzil 佐齐尔", speakers: "130K" },
  lns: { name: "Lamnso' 兰姆索", speakers: "125K" },
  ton: { name: "Tonga (Tonga Islands) 汤加（汤加群岛）", speakers: "123K" },
  tbz: { name: "Ditammari 迪塔马里", speakers: "120K" },
  lad: { name: "Ladino 拉迪诺", speakers: "120K" },
  vai: { name: "Vai 瓦伊", speakers: "120K" },
  mto: { name: "Totontepec Mixe 托通特佩克混合", speakers: "119K" },
  ady: { name: "Adyghe 阿迪格", speakers: "118K" },
  abk: { name: "Abkhazian 阿布哈兹人", speakers: "105K" },
  ast: { name: "Asturian 阿斯图里安", speakers: "100K" },
  tsz: { name: "Purepecha 普雷佩查", speakers: "100K" },
  swb: { name: "Maore Comorian 摩尔科摩罗语", speakers: "97K" },
  cab: { name: "Garifuna 加里富纳", speakers: "95K" },
  krl: { name: "Karelian 卡累利阿", speakers: "80K" },
  zam: { name: "Miahuatlán Zapotec", speakers: "80K" },
  top: { name: "Papantla Totonac 帕潘特拉托托纳克", speakers: "80K" },
  cha: { name: "Chamorro 查莫罗语", speakers: "78K" },
  crs: { name: "Seselwa Creole French Seselwa克里奥尔法语", speakers: "73K" },
  ddn: { name: "Dendi (Benin) 丹迪（贝宁）", speakers: "72K" },
  loz: { name: "Lozi 洛济", speakers: "72K" },
  mri: { name: "Maori 毛利人", speakers: "70K" },
  slr: { name: "Salar 萨拉尔", speakers: "70K" },
  hsb: { name: "Upper Sorbian 上索布族人", speakers: "70K" },
  cri: { name: "Sãotomense 圣奥托曼塞", speakers: "70K" },
  pbb: { name: "Páez 佩兹", speakers: "68K" },
  alt: { name: "Southern Altai 南阿尔泰", speakers: "68K" },
  qva: { name: "Ambo-Pasco Quechua", speakers: "65K" },
  mxv: { name: "Metlatónoc Mixtec 梅特拉托诺克米xtec", speakers: "65K" },
  gla: { name: "Scottish Gaelic 苏格兰盖尔语", speakers: "64K" },
  kjh: { name: "Khakas 卡其色", speakers: "60K" },
  csw: { name: "Swampy Cree 沼泽克里人", speakers: "60K" },
  qvm: { name: "Margos-Yarowilca-Lauricocha Quechua", speakers: "55K" },
  fao: { name: "Faroese 法罗群岛", speakers: "47K" },
  kal: { name: "Kalaallisut 卡拉阿利苏特", speakers: "47K" },
  cni: { name: "Asháninka 阿什宁卡", speakers: "45K" },
  chk: { name: "Chuukese 丘凯塞", speakers: "45K" },
  mah: { name: "Marshallese 马绍尔语", speakers: "44K" },
  rar: { name: "Rarotongan 拉罗汤根", speakers: "43K" },
  evn: { name: "Evenki 埃文基", speakers: "40K" },
  qvn: { name: "North Junín Quechua 北胡宁盖丘阿", speakers: "40K" },
  wwa: { name: "Waama 瓦马", speakers: "40K" },
  buc: { name: "Bushi 布氏", speakers: "39K" },
  qvh: { name: "Huamalíes-Dos de Mayo Huánuco Quechua", speakers: "38K" },
  toj: { name: "Tojolabal 托霍拉巴尔", speakers: "36K" },
  lue: { name: "Luvale 卢瓦尔", speakers: "36K" },
  qvc: { name: "Cajamarca Quechua 卡哈马卡盖丘阿", speakers: "35K" },
  ojb: { name: "Northwestern Ojibwa 西北奥吉布瓦", speakers: "35K" },
  jiv: { name: "Shuar 舒尔", speakers: "35K" },
  lld: { name: "Ladin 拉丁", speakers: "30K" },
  hlt: { name: "Matu Chin 马图钦", speakers: "30K" },
  que: { name: "Quechua 盖丘亚语", speakers: "30K" },
  pon: { name: "Pohnpeian 波纳佩安", speakers: "28K" },
  agr: { name: "Aguaruna 阿瓜鲁纳", speakers: "28K" },
  yrk: { name: "Nenets 涅涅茨", speakers: "27K" },
  quh: { name: "South Bolivian Quechua 南玻利维亚凯丘阿", speakers: "25K" },
  tca: { name: "Ticuna 蒂库纳", speakers: "25K" },
  chj: { name: "Ojitlán Chinantec", speakers: "22K" },
  ike: { name: "Eastern Canadian Inuktitut 加拿大东部因纽特人", speakers: "22K" },
  kwi: { name: "Awa-Cuaiquer 阿瓦-奎克尔", speakers: "21K" },
  rgn: { name: "Romagnol 罗马诺", speakers: "20K" },
  oki: { name: "Okiek 奥基耶克", speakers: "20K" },
  tob: { name: "Toba 鸟羽", speakers: "20K" },
  guu: { name: "Yanomamö 亚诺马莫", speakers: "18K" },
  qxu: { name: "Arequipa-La Unión Quechua 阿雷基帕-盖丘亚联盟", speakers: "16K" },
  pau: { name: "Palauan 阿根廷人", speakers: "15K" },
  shp: { name: "Shipibo-Conibo 希皮博-科尼博", speakers: "15K" },
  gld: { name: "Nanai 七井町", speakers: "12K" },
  gug: { name: "Paraguayan Guaraní 巴拉圭瓜拉尼", speakers: "12K" },
  mzi: { name: "Ixcatlán Mazatec 伊克斯卡特兰·马扎特茨", speakers: "11K" },
  cjs: { name: "Shor 肖尔", speakers: "10K" },
  mic: { name: "Mi'kmaq 米克马克", speakers: "8K" },
  haw: { name: "Hawaiian 夏威夷人", speakers: "8K" },
  eve: { name: "Even 甚至", speakers: "7K" },
  yap: { name: "Yapese 亚佩塞", speakers: "7K" },
  cbt: { name: "Chayahuita 恰亚韦塔", speakers: "6K" },
  ame: { name: "Yanesha' 亚尼沙", speakers: "6K" },
  gyr: { name: "Guarayu 瓜拉尤", speakers: "6K" },
  vep: { name: "Veps 副总统", speakers: "6K" },
  cpu: { name: "Pichis Ashéninka 皮希斯·阿什宁卡", speakers: "5K" },
  acu: { name: "Achuar-Shiwiar 阿丘阿尔-希维亚尔", speakers: "5K" },
  not: { name: "Nomatsiguenga 诺马茨根加", speakers: "4K" },
  sme: { name: "Northern Sami 北萨米人", speakers: "4K" },
  yad: { name: "Yagua 亚瓜", speakers: "4K" },
  ura: { name: "Urarina 乌拉里纳", speakers: "4K" },
  cbu: { name: "Candoshi-Shapra 坎多希-沙普拉", speakers: "3K" },
  huu: { name: "Murui Huitoto 村井会本", speakers: "3K" },
  cof: { name: "Colorado 科罗拉多州", speakers: "2K" },
  boa: { name: "Bora 博拉", speakers: "2K" },
  cbs: { name: "Cashinahua 卡什纳瓦", speakers: "2K" },
  ztu: { name: "Güilá Zapotec 居拉萨波特克", speakers: "2K" },
  piu: { name: "Pintupi-Luritja 平图皮-卢里贾", speakers: "2K" },
  cbr: { name: "Cashibo-Cacataibo", speakers: "2K" },
  mcf: { name: "Matsés", speakers: "1K" },
  bis: { name: "Bislama 比斯拉马", speakers: "1K" },
  orh: { name: "Oroqen 鄂伦春", speakers: "1K" },
  ykg: { name: "Northern Yukaghir 北尤卡吉尔", speakers: "1K" },
  ese: { name: "Ese Ejja", speakers: "1K" },
  nio: { name: "Nganasan 恩加纳桑", speakers: "1K" },
  cic: { name: "Chickasaw 契卡索", speakers: "1K" },
  csa: { name: "Chiltepec Chinantec 奇尔特佩克中医药", speakers: "1K" },
  niv: { name: "Gilyak 吉利亚克", speakers: "1K" },
  mcd: { name: "Sharanahua 沙拉纳瓦", speakers: "950" },
  amc: { name: "Amahuaca 阿马瓦卡", speakers: "720" },
  amr: { name: "Amarakaeri 阿马拉卡里", speakers: "500" },
  snn: { name: "Siona 锡奥纳", speakers: "500" },
  cot: { name: "Caquinte 卡昆特", speakers: "300" },
  oaa: { name: "Orok 奥罗克", speakers: "295" },
  ajg: { name: "Aja (Benin) 阿贾（贝宁）", speakers: "200" },
  arl: { name: "Arabela 阿拉贝拉", speakers: "150" },
  ppl: { name: "Pipil 皮皮尔", speakers: "20" },
  aar: { name: "Afar 阿法尔", speakers: "unknown 未知" },
  bax: { name: "Bamun 巴蒙", speakers: "unknown 未知" },
  nku: { name: "Bouna Kulango 布纳·库兰戈", speakers: "unknown 未知" },
  cbi: { name: "Chachi 恰奇", speakers: "unknown 未知" },
  chr: { name: "Cherokee 切罗基", speakers: "unknown 未知" },
  chv: { name: "Chuvash 楚瓦什", speakers: "unknown 未知" },
  crh: { name: "Crimean Tatar 克里米亚鞑靼人", speakers: "unknown 未知" },
  duu: { name: "Drung 醉酒", speakers: "unknown 未知" },
  cfm: { name: "Falam Chin 法兰钦", speakers: "unknown 未知" },
  fat: { name: "Fanti 范蒂", speakers: "unknown 未知" },
  fvr: { name: "Fur 毛皮", speakers: "unknown 未知" },
  ido: { name: "Ido 伊多", speakers: "unknown 未知" },
  idu: { name: "Idoma 伊多马", speakers: "unknown 未知" },
  ina: { name: "Interlingua (International Auxiliary Language Association) 国际辅助语言协会", speakers: "unknown 未知" },
  kaa: { name: "Kara-Kalpak 卡拉-卡尔帕克", speakers: "unknown 未知" },
  kkh: { name: "Khün 昆", speakers: "unknown 未知" },
  ktu: { name: "Kituba (Democratic Republic of Congo) 基图巴（刚果民主共和国）", speakers: "unknown 未知" },
  fkv: { name: "Kven Finnish 克文芬兰语", speakers: "unknown 未知" },
  lat: { name: "Latin 拉丁语", speakers: "unknown 未知" },
  glv: { name: "Manx 马恩岛", speakers: "unknown 未知" },
  mfq: { name: "Moba 莫巴", speakers: "unknown 未知" },
  mnw: { name: "Mon 蒙", speakers: "unknown 未知" },
  cnr: { name: "Montenegrin 黑山", speakers: "unknown 未知" },
  mor: { name: "Moro 莫罗", speakers: "unknown 未知" },
  mxi: { name: "Mozarabic 莫扎拉布克语", speakers: "unknown 未知" },
  pcm: { name: "Nigerian Pidgin 尼日利亚洋泾子", speakers: "unknown 未知" },
  niu: { name: "Niuean 牛安", speakers: "unknown 未知" },
  kqs: { name: "Northern Kissi 北基西", speakers: "unknown 未知" },
  sey: { name: "Secoya 塞科亚", speakers: "unknown 未知" },
  ijs: { name: "Southeast Ijo 伊城东南", speakers: "unknown 未知" },
  gsw: { name: "Swiss German 瑞士德语", speakers: "unknown 未知" },
  blt: { name: "Tai Dam 泰坝", speakers: "unknown 未知" },
  kdh: { name: "Tem 泰姆", speakers: "unknown 未知" },
  tdt: { name: "Tetun Dili 特屯帝力", speakers: "unknown 未知" },
  twi: { name: "Twi 提威", speakers: "unknown 未知" },
  udu: { name: "Uduk 乌杜克", speakers: "unknown 未知" },
  auc: { name: "Waorani 沃拉尼", speakers: "unknown 未知" },
  gaz: { name: "West Central Oromo 中西部奥罗莫", speakers: "unknown 未知" },
  pnb: { name: "Western Panjabi 西潘贾比", speakers: "unknown 未知" },
  zro: { name: "Záparo 萨帕罗", speakers: "unknown 未知" },
};