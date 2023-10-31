import { config } from "../../package.json";
import { fullTextTranslateService } from "../modules/serviceManage";
import { fileNameLegal } from "../utils/fileNameLegal";
import { getString } from "./locale";

export const fullTextTranslatedir = Zotero.Prefs.get("extensions.zotero.dataDir", true) as string + "\\storage\\" + config.addonName + "\\";
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
 * @param filename 
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

export const getPathDir = (filename: string, dir?: string, ext?: string) => {
  filename = fileNameLegal(filename);
  if (ext === undefined) {
    ext = ".json";
  }
  if (!ext.startsWith(".")) {
    ext = "." + ext;
  }
  if (dir === undefined) {
    dir = fullTextTranslatedir;
  }
  if (dir.includes("\\")) {
    dir = (dir + "\\").replace(/\\+/mg, "\\");
  }

  if (dir.includes("/")) {
    dir = (dir + "/").replace(/\/+/gm, "/");
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
 * @param filename 
 * @param dir 
 * @param ext 
 * @returns 
 */
export async function readJsonFromDisk(filename: string, dir?: string, ext?: string) {
  const tempObj = getPathDir(filename, dir, ext);
  const path = tempObj.path;
  dir = tempObj.dir;
  if (!await OS.File.exists(path)) { return; }
  const buf = await OS.File.read(path, {});
  const servicesJson = arrayBufferToString(buf);
  return JSON.parse(servicesJson);
}

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