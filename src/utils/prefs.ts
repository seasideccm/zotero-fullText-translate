
import { config } from "../../package.json";
import { fullTextTranslateService } from "../modules/serviceManage";
import { fileNameLegal } from "../utils/fileNameLegal";


export const addonStorageDir = Zotero.Prefs.get("extensions.zotero.dataDir", true) as string + "\\storage\\" + config.addonName + "\\";
export const { OS } = Components.utils.import("resource://gre/modules/osfile.jsm");


/**
 * Get preference value.
 * Wrapper of `Zotero.Prefs.get`.
 * @param key
 */
export function getPref(key: string) {
  return Zotero.Prefs.get(`${config.prefsPrefix}.${key}`, true);
}

/**
 * Set preference value.
 * Wrapper of `Zotero.Prefs.set`.
 * @param key
 * @param value
 */
export function setPref(key: string, value: string | number | boolean) {
  return Zotero.Prefs.set(`${config.prefsPrefix}.${key}`, value, true);
}

/**
 * Clear preference value.
 * Wrapper of `Zotero.Prefs.clear`.
 * @param key
 */
export function clearPref(key: string) {
  return Zotero.Prefs.clear(`${config.prefsPrefix}.${key}`, true);
}

/**
 * 获取指定插件的prefs中的key
 * @param plugin 
 * @param key 
 * @returns 
 */
export function getPluginsPref(plugin: string, key: string) {
  const prefsPrefix = "extensions.zotero." + plugin;
  return Zotero.Prefs.get(`${prefsPrefix}.${key}`, true);
}

/**
 * 设置指定插件的prefs中的key
 * @param plugin 
 * @param key 
 * @param value 
 * @returns 
 */
export function setPluginsPref(plugin: string, key: string, value: string | number | boolean) {
  const prefsPrefix = "extensions.zotero." + plugin;
  return Zotero.Prefs.set(`${prefsPrefix}.${key}`, value, true);
}


/**
 * 将 js 对象转为json写入磁盘，默认为插件目录
 * @param obj 
 * @param filename 文件名伴或不伴完整路径
 * @param dir 
 * @param ext 
 */
export async function saveJsonToDisk(obj: any, filename: string, dir?: string, ext?: string) {
  const objJson = JSON.stringify(obj);
  const tempObj = getPathDir(filename, dir, ext);
  const path = tempObj.path;
  dir = tempObj.dir;
  if (!await OS.File.exists(dir)) {
    await OS.File.makeDir(dir);
  }
  await OS.File.writeAtomic(path, objJson);
}


/**
 * 
 * @param filename 文件名,伴或不伴完整路径
 * @param dir 结尾 \\\\ 或 / 可有可无
 * @param ext 默认 .json
 * @returns 对象
 */
export async function readJsonFromDisk(filename: string, dir?: string, ext?: string) {
  const path = getPathDir(filename, dir, ext).path;
  if (!await OS.File.exists(path)) { return; }
  const buf = await OS.File.read(path, {});
  const blob = new Blob([buf]);
  const reader = new FileReader();
  reader.readAsText(blob);
  return JSON.parse(reader.result as string);
  //特殊符号出乱码return JSON.parse(arrayBufferToString(buf));
}

const IMAGE_HEAD_SIGS = {
  GIF: [0x47, 0x49, 0x46], //'G' 'I' 'F' ascii
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  JPG: [0xff, 0xd8, 0xff, 0xe0],
  BMP: [0x42, 0x4d]
};

function readUint32BE(bytes: any, start: number) {
  const uarr = new Uint32Array(1);
  uarr[0] = (bytes[start + 0] & 0xFF) << 24;
  uarr[0] = uarr[0] | ((bytes[start + 1] & 0xFF) << 16);
  uarr[0] = uarr[0] | ((bytes[start + 2] & 0xFF) << 8);
  uarr[0] = uarr[0] | (bytes[start + 3] & 0xFF);
  return uarr[0];
}

export function ReadPNG(buf: any) {
  if (buf.slice(0, 8).toString() === IMAGE_HEAD_SIGS.PNG.toString()) {
    const width = readUint32BE(buf, 16);
    const height = readUint32BE(buf, 20);
    return { width, height };
  }
}
/* function getExtension(fileName: string) {





var suffix = fileName.slice(fileName.lastIndexOf(".") + 1)
  const arr = fileName.split('.');
  return arr[arr.length - 1];
} */

export function getImageBase64(blob: any) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const base64 = reader.result;
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
/* export function toBase64(blob:any){
  return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
          resolve(e.target.result);
        };
        fileReader.readAsDataURL(blob);
        fileReader.onerror = () => {
          reject(new Error('文件流异常'));
        };
      });
} */


export async function readImage(path: string) {
  if (!await OS.File.exists(path)) { return; }
  const buf = await OS.File.read(path, {});
  const imgWidthHeight = ReadPNG(buf);
  const blob = new Blob([buf]);
  const temp = OS.Path.basename(path).split('.');
  const fileType = "image/" + temp.pop();
  const fileName = temp.join('');
  const file = new File([blob], fileName, { type: fileType, lastModified: Date.now() });
  const base64 = await getImageBase64(file);
  //const blob = URL.createObjectURL(file);
  /*   const reader = new FileReader();
    let obj;
    reader.addEventListener(
      "load",
      function () {
        obj = {
          width: imgWidthHeight?.width as number,
          height: imgWidthHeight?.height as number,
          base64: reader.result as string,
        };
      },
      false,
    );
    if (file) {
      reader.readAsDataURL(file);
    }
    while (obj == undefined) {
      Zotero.Promise.delay(10);
      if (obj) {
        break;
      }
    }
    return obj; */
  return {
    width: imgWidthHeight?.width as number,
    height: imgWidthHeight?.height as number,
    base64: base64 as string,
    fileType: fileType,
    fileName: fileName
  };

}

export function enableMasonry() {
  if (!Zotero.Prefs.get("layout.css.grid-template-masonry-value.enabled", true)) {
    Zotero.Prefs.set("layout.css.grid-template-masonry-value.enabled", true, true);
  }
}
export function base64ToBytes(imageDataURL: string)
  : {
    u8arr:
    Uint8Array;
    mime: string;
  } | undefined {
  const parts = imageDataURL.split(',');
  if (!parts[0].includes('base64')) return;
  const mime = parts[0].match(/:(.*?);/)![1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return {
    u8arr: u8arr,
    mime: mime,
  };
}

export function base64ToBlob(imageDataURL: string): Blob | undefined {
  const temp = base64ToBytes(imageDataURL);
  if (!temp) return;
  const blob = new Blob([temp.u8arr], { type: temp.mime });
  return blob;
}


export async function saveImage(dataURL: string, outputPath: string) {
  const temp = base64ToBytes(dataURL);
  if (!temp) return;
  const u8arr = temp.u8arr;
  const mime = temp.mime;
  //事先建好目录可以保存，图片大小适中
  const dir = outputPath.replace(/[^/\\]+$/m, '');
  if (!await OS.File.exists(dir)) {
    await OS.File.makeDir(dir);
  }
  await OS.File.writeAtomic(outputPath, u8arr);
  return {
    u8arr: u8arr,
    mime: mime
  };
}


export const onSaveImageAs = async (dataURL: string, window?: Window) => {

  try {
    const FilePicker = ztoolkit.getGlobal("require")("zotero/modules/filePicker").default;
    const fp = new FilePicker();
    fp.init(window || ztoolkit.getGlobal("window"), Zotero.getString('pdfReader.saveImageAs'), fp.modeSave);
    fp.appendFilter("PNG", "*.png");
    fp.defaultString = Zotero.getString('fileTypes.image').toLowerCase() + '.png';
    const rv = await fp.show();
    if (rv === fp.returnOK || rv === fp.returnReplace) {
      const outputPath = fp.file;
      const parts = dataURL.split(',');
      if (parts[0].includes('base64')) {
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        await OS.File.writeAtomic(outputPath, u8arr);
      }
    }
  }
  catch (e) {
    ztoolkit.log(e);
    throw e;
  }
};

/**
 * 
 * @param filename 文件名伴或不伴完整路径
 * @param dir 
 * @param ext 
 * @returns 
 */
export const getPathDir = (filename: string, dir?: string, ext?: string) => {
  filename = fileNameLegal(filename);
  //文件名是完整路径
  if (filename.match(/\.[^/\\]+$/m) && filename.match(/[/\\]/g)) {
    dir = "";
    ext = '';
  } else {
    if (ext === undefined) {
      ext = ".json";
    }
    if (!ext.startsWith(".")) {
      ext = "." + ext;
    }
    if (dir === undefined) {
      dir = addonStorageDir;
    }
    if (dir.includes("\\")) {
      dir = (dir + "\\").replace(/\\+/mg, "\\");
    }

    if (dir.includes("/")) {
      dir = (dir + "/").replace(/\/+/gm, "/");
    }
  }


  const path = dir + filename + ext;
  return {
    path: path,
    dir: dir
  };
};

/**
 * c:\\path\\to\\file.json
 * 
 * /c/path/to/file/json
 * @param path 
 * @returns 
 */
export const getFileInfo = async (path: string) => {
  return await OS.File.stat(path);

};




/**
 * 
 * @param buffer 
 * @returns 
 */
export function arrayBufferToString(buffer: any) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

/**
 * 
 * @param path 
 * @returns 
 */
export async function readFileContent(path: string) {
  const buf = await OS.File.read(path, {});
  return arrayBufferToString(buf);
}

/**
 * 
 * @param serviceID 
 * @param key 
 */
export function saveSingleServiceUnderUse(serviceID?: string, key?: string) {
  if (serviceID === undefined || serviceID == null || serviceID == "") {
    const obj = getSingleServiceUnderUse();
    serviceID = obj.serviceID;
    key = obj.key;
  }
  const singleServiceUnderUse = {
    serviceID: serviceID,
    key: key
  };
  const json = JSON.stringify(singleServiceUnderUse);
  setPref('singleServiceUnderUse', json);

}
/**
 * 从prefs获取翻译引擎总对象 services
 * @returns 
 */
export function getServicesInfo() {
  const json: string = getPref('servicesPref') as string;
  if (!json) { return; }
  const servicesPref: object = JSON.parse(json);
  return servicesPref;
}
/**
 * 获取当前使用的引擎对象
 * 如果是pdfTranslate的翻译引擎，返回其prefs相关信息
 * 否则返回本插件prefs的相关信息
 * @returns 
 */
export function getSingleServiceUnderUse() {
  const json: string = getPref('singleServiceUnderUse') as string;

  const secrets: object = JSON.parse((getPluginsPref("ZoteroPDFTranslate", "secretObj") as string) || "{}");
  const serviceID = getPluginsPref("ZoteroPDFTranslate", "translateSource") as string;
  const key = secrets[serviceID as keyof typeof secrets];
  if (!json) {
    return { serviceID: serviceID, key: key };
  }
  const singleServiceUnderUse: { serviceID: string, key?: string; } = JSON.parse(json);
  if (fullTextTranslateService.includes(singleServiceUnderUse.serviceID)) {
    return singleServiceUnderUse;
  } else {
    return { serviceID: serviceID, key: key };
  }

}


