import { getString } from "../utils/locale";
import { readJsonFromDisk, addonStorageDir, saveJsonToDisk, arrayBufferToString } from "../utils/prefs";
import { combinObj } from "../utils/tools";

export async function syncFontInfo() {

    const ch = "随时同步";
    const unitDirSync = `f:\\test zotero file\\${encodeURIComponent(ch)}\\testzotero.txt`;
    //unitDirSync = encodeURI(unitDirSync);
    //"f:\\test zotero file\\\uFFFD\uFFFD\u02B1\u036C\uFFFD\uFFFD\\testzotero.txt"
    //unitDirSync = decodeURI(unitDirSync);
    /* unitDirSync = encodeURIComponent(unitDirSync);
    unitDirSync = decodeURIComponent(unitDirSync); */

    const data = await Zotero.File.getContentsAsync(unitDirSync);
    const dir1 = OS.Path.dirname(unitDirSync);
    /* const pathSync = [];
    
    const basename1 = OS.Path.basename(unitDirSync);
    const dir1 = OS.Path.dirname(unitDirSync);


    unitDirSync = encodeURIComponent(unitDirSync);
    unitDirSync = decodeURIComponent(unitDirSync);
    //"D:\\随时同步\\fontInfoCollectionSync-unit\\fontStyleCollection.json"
    const homeDirSync = "随时同步";
    homeDirSync = encodeURIComponent(homeDirSync);
    const testpath = "D:\\testpath\\fontStyleCollection.json";
    const testpath22 = "D:\\testpath\\";



    const bufff = await IOUtils.read(unitDirSync);
    let buf = await OS.File.read(testpath, {});
    const objbackuo3 = JSON.parse(arrayBufferToString(buf));


    const testpath2 = `D:\\${homeDirSync}\\fontInfoCollectionSync-unit\\.fontStyleCollection.json`;
    const buf = await OS.File.read(testpath2, {});
    const objbackuo4 = JSON.parse(arrayBufferToString(buf));

        let realName = encodeURI(homeDirSync,"GBK")
        realName = realName.toString('iso8859-1') 
    // pathSync.push(unitDirSync, homeDirSync);
     const fileName = "fontStyleCollection";
    //const objUsed = await readJsonFromDisk(fileName, addonStorageDir);
    const objBackup1 = await readJsonFromDisk(fileName, dir1);
    const objBackup2 = await readJsonFromDisk(testpath);
    const bbb = objBackup1 == objBackup2;
    const test = objBackup1; 
    pathSync.filter(async (dir: any) => {
        const objBackup = await readJsonFromDisk(fileName, dir);
        if (objBackup) {
            const newObj = combinObj(objUsed, objBackup);
            if (newObj) {

                await saveJsonToDisk(newObj, fileName);
            }
        }
    }); */
    /* await ztoolkit.ItemBox.register(
        "titleCUstom",
        getString("info-customField"),
        // getField hook is registered in itemTree.ts
        undefined,
        {
            editable: false,
            setFieldHook: (field, value, loadIn, item, original) => {
                ztoolkit.ExtraField.setExtraField(item, field, value);
                return true;
            },
            index: 2,
            multiline: true,
        }
    ); */
}


