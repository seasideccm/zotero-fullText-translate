import { readJsonFromDisk, addonStorageDir, saveJsonToDisk, arrayBufferToString } from "../utils/prefs";
import { combinObj } from "../utils/tools";
import path from "path";
import {
    existsSync,
    lstatSync,
    writeFileSync,
    readFileSync,
    mkdirSync,
    readdirSync,
    rmSync,
    renameSync,
} from "fs";
export async function syncFontInfo() {
    const pathSync = [];
    const unitDirSync = "D:\\随时同步\\fontInfoCollectionSync-unit\\fontStyleCollection.json";
    const basename1 = OS.Path.basename(unitDirSync);
    const dir1 = OS.Path.dirname(unitDirSync);


    //unitDirSync = encodeURIComponent(unitDirSync);
    //"D:\\随时同步\\fontInfoCollectionSync-unit\\fontStyleCollection.json"
    let homeDirSync = "随时同步";
    homeDirSync = encodeURIComponent(homeDirSync);
    const testpath = "D:\\testpath\\fontStyleCollection.json";
    /* let buf = await OS.File.read(testpath, {});
    const objbackuo3 = JSON.parse(arrayBufferToString(buf)); */


    const testpath2 = `D:\\${homeDirSync}\\fontInfoCollectionSync-unit\\.fontStyleCollection.json`;
    const buf = await OS.File.read(testpath2, {});
    const objbackuo4 = JSON.parse(arrayBufferToString(buf));

    /*     let realName = encodeURI(homeDirSync,"GBK")
        realName = realName.toString('iso8859-1') */
    // pathSync.push(unitDirSync, homeDirSync);
    const fileName = "fontStyleCollection";
    //const objUsed = await readJsonFromDisk(fileName, addonStorageDir);
    const objBackup1 = await readJsonFromDisk(fileName, dir1);
    const objBackup2 = await readJsonFromDisk(testpath);
    const bbb = objBackup1 == objBackup2;
    const test = objBackup1;
    /* pathSync.filter(async (dir: any) => {
        const objBackup = await readJsonFromDisk(fileName, dir);
        if (objBackup) {
            const newObj = combinObj(objUsed, objBackup);
            if (newObj) {

                await saveJsonToDisk(newObj, fileName);
            }
        }
    }); */
}


