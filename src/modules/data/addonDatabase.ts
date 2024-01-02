import { config } from "../../../package.json";


export async function getDB(dbName?: string) {
    // "F:\\download\\zotero\\zotero7DataDirectory\\testMyDB.sqlite";
    dbName = dbName || "testMyDB.sqlite";
    let path = PathUtils.join(Zotero.DataDirectory.dir, dbName);
    const testDB = new Zotero.DBConnection(path);
    path = testDB._dbPath;
    try {
        let msg;
        // Test read access, if failure throw error
        await testDB.test();
        // Test write access on path
        if (!Zotero.File.pathToFile(OS.Path.dirname(path)).isWritable()) {
            msg = 'Cannot write to ' + OS.Path.dirname(path) + '/';
        }
        // Test write access on Zotero database
        else if (!Zotero.File.pathToFile(path).isWritable()) {
            msg = 'Cannot write to ' + path;
        }
        else {
            msg = false;
        }

        if (msg) {
            const e = {
                name: 'NS_ERROR_FILE_ACCESS_DENIED',
                message: msg,
                toString: function () { return this.message; }
            };
            throw (e);
        }
    }
    catch (e: any) {
        if (_checkDataDirAccessError(e)) {
            ztoolkit.log(e);
        }
        // Storage busy
        else if (e.message.includes('2153971713')) {
            ztoolkit.log(Zotero.getString('startupError.databaseInUse'));
        }
        else {
            const stack = e.stack ? Zotero.Utilities.Internal.filterStack(e.stack) : null;
            ztoolkit.log(
                Zotero.getString('startupError', Zotero.appName) + "\n\n"
                + Zotero.getString('db.integrityCheck.reportInForums') + "\n\n"
                + (stack || e)
            );
        }
        ztoolkit.log(e);
    }
    if (!testDB.dbInitialized) await initializeSchema(testDB);
    return testDB;

    async function initializeSchema(DB: any) {
        await DB.executeTransaction(async function () {
            try {
                await DB.queryAsync("PRAGMA page_size = 4096");
                await DB.queryAsync("PRAGMA encoding = 'UTF-8'");
                await DB.queryAsync("PRAGMA auto_vacuum = 1");
                const sql = await getSchemaSQL('addonSchema');
                await DB.executeSQLFile(sql);
                DB.dbInitialized = true;
            }
            catch (e) {
                Zotero.debug(e, 1);
                Components.utils.reportError(e);
                const ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                    .getService(Components.interfaces.nsIPromptService);
                ps.alert(
                    null,
                    Zotero.getString('general.error'),
                    Zotero.getString('startupError', Zotero.appName)
                );
                throw e;
            }
        });
    }

    function _checkDataDirAccessError(e: any) {
        if (e.name != 'NS_ERROR_FILE_ACCESS_DENIED' && !e.message.includes('2152857621')) {
            return false;
        }

        let msg = Zotero.getString('dataDir.databaseCannotBeOpened', Zotero.clientName)
            + "\n\n"
            + Zotero.getString('dataDir.checkPermissions', Zotero.clientName);
        // If already using default directory, just show it
        if (Zotero.DataDirectory.dir == Zotero.DataDirectory.defaultDir) {
            msg += "\n\n" + Zotero.getString('dataDir.location', Zotero.DataDirectory.dir);
        }
        // Otherwise suggest moving to default, since there's a good chance this is due to security
        // software preventing Zotero from accessing the selected directory (particularly if it's
        // a Firefox profile)
        else {
            msg += "\n\n"
                + Zotero.getString('dataDir.moveToDefaultLocation', Zotero.clientName)
                + "\n\n"
                + Zotero.getString(
                    'dataDir.migration.failure.full.current', Zotero.DataDirectory.dir
                )
                + "\n"
                + Zotero.getString(
                    'dataDir.migration.failure.full.recommended', Zotero.DataDirectory.defaultDir
                );
        }
        Zotero.startupError = msg;
        return true;
    }
}

export async function insertMyDB(tableName: string, data?: any) {


    const testDB = await getDB();


    await dataInsertIntoTable(data, tableName, testDB);
    await testDB.closeDatabase();
    return;





    //查询所有表的名称
    const allTablesName = await testDB.queryAsync("select name from sqlite_master where type='table' order by name");
    for (const tableName of allTablesName) {

        ztoolkit.log(tableName.name);
        ztoolkit.log("==========================");
        //查询表的字段名        
        const cols = await testDB.getColumns(tableName.name);

        ztoolkit.log(cols);

    }

    /* const table = "myDBFirstTable";
    const sourceText = "abnormal excelent";
    const targetText = "相当卓越";
    let sql = `CREATE TABLE ${table} (id INTEGER PRIMARY KEY,sourceText TEXT NOT NULL,targetText TEXT NOT NULL,score INTEGER)`;
    await testDB.queryAsync(sql);
    sql = `INSERT INTO ${table} (sourceText,targetText) VALUES (?,?)`;
    await testDB.queryAsync(sql, [sourceText, targetText]);
    sql = `SELECT * FROM ${table}`;
    const row = await testDB.queryAsync(sql);
    ztoolkit.log("sourceText", row[0].sourceText, "targetText", row[0].targetText); */
    await testDB.closeDatabase();
}

async function dataInsertIntoTable(data: any, tableName: string, DB: any) {
    //let sql = `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
    //获取主键
    //const cols = await DB.queryAsync(`PRAGMA table_info(${tableName})`);
    //const PrimaryKey = cols.filter((col: any) => col.pk)[0];
    // const sqlColumns = cols.map((col: any) => col.name);
    //const sqlColumnsExcludePK = sqlColumns.filter((col: any) => col != PrimaryKey);
    let result = data.data?.['content'];
    if (!result) result = data.data['words_result'];
    if (!result) return;
    await DB.executeTransaction(async function () {
        for (const i of result) {
            if (i['src'] == i['dst']) continue;
            const sql = "INSERT INTO " + tableName + " (sourceText, targetText)"
                + "VALUES ( ?,?)";
            const paras = [i['src'], i['dst']];
            await DB.queryAsync(sql, paras);

        }
    });
    //"INSERT INTO libraries (libraryID, type, editable, filesEditable) VALUES (4, 'publications', 1, 1)"
}



/**
 * tableName: { fieldName:type }
 */
export const schemaData = {
    sentence: {
        id: "INTEGER PRIMARY KEY",
        sourceText: "TEXT NOT NULL",
        targetText: "TEXT NOT NULL",
        score: "INTEGER"
    }
};
function creatTable() {

}



function getSchemaSQL(schema: string) {
    if (!schema) {
        throw ('Schema type not provided to _getSchemaSQL()');
    }
    const path = `chrome://${config.addonRef}/resource/schema/${schema}.sql`;
    return Zotero.File.getResourceAsync(path);
}





