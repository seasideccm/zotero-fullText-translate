


export async function getDB(dbName?: string) {
    // "F:\\download\\zotero\\zotero7DataDirectory\\testMyDB.sqlite";
    dbName = dbName || "testMyDB.sqlite";
    const path = PathUtils.join(Zotero.DataDirectory.dir, dbName);
    if (await IOUtils.exists(path)) {
        return new Zotero.DBConnection(path);
    }
}

export async function insertMyDB(tableName: string, data?: any) {
    const testDB = await getDB();
    const path = testDB._dbPath;
    try {
        let msg;
        // Test read access
        const testResult = await testDB.test();
        const test = testResult;
        return;
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

/*
export const schemaTrDB = {
    sentence: {
        id: "INTEGER PRIMARY KEY",
        sourceText: "TEXT NOT NULL",
        targetText: "TEXT NOT NULL",
        score: "INTEGER"
    }
};
await Zotero.Schema.getDBVersion('userdata');
const userdataVersion = await _getSchemaSQLVersion('userdata');


updated = await _migrateUserDataSchema(userdata, options);
await _updateSchema('triggers');


const _migrateUserDataSchema = async function (fromVersion, options = {}) {
    const toVersion = await _getSchemaSQLVersion('userdata');

    if (fromVersion >= toVersion) {
        return false;
    }

    Zotero.debug('Updating user data tables from version ' + fromVersion + ' to ' + toVersion);

    Zotero.DB.requireTransaction();
    for (let i = fromVersion + 1; i <= toVersion; i++) {
        if (i == 80) {
            await _updateCompatibility(1);
            await Zotero.DB.queryAsync(sql);
        } else if () {
            await Zotero.DB.queryAsync(sql);
        }
    }

    await _updateDBVersion('userdata', toVersion);
    return true;
};

async function _initializeSchema() {
    await Zotero.DB.executeTransaction(async function (conn) {
        try {
            const userLibraryID = 1;

            // Enable auto-vacuuming
            await Zotero.DB.queryAsync("PRAGMA page_size = 4096");
            await Zotero.DB.queryAsync("PRAGMA encoding = 'UTF-8'");
            await Zotero.DB.queryAsync("PRAGMA auto_vacuum = 1");

            let sql = await _getSchemaSQL('system');
            await Zotero.DB.executeSQLFile(sql);

            sql = await _getSchemaSQL('userdata');
            await Zotero.DB.executeSQLFile(sql);

            sql = await _getSchemaSQL('triggers');
            await Zotero.DB.executeSQLFile(sql);

            const schema = await _readGlobalSchemaFromFile();
            await _updateGlobalSchema(schema, { foreignKeyChecksAllowed: true });

            let version = await _getSchemaSQLVersion('system');
            await _updateDBVersion('system', version);

            version = await _getSchemaSQLVersion('userdata');
            await _updateDBVersion('userdata', version);

            version = await _getSchemaSQLVersion('triggers');
            await _updateDBVersion('triggers', version);

            sql = "INSERT INTO libraries (libraryID, type, editable, filesEditable) "
                + "VALUES "
                + "(?, 'user', 1, 1)";
            await Zotero.DB.queryAsync(sql, userLibraryID);

            await _updateLastClientVersion();
            await _updateCompatibility(_maxCompatibility);

            this.dbInitialized = true;
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
    }.bind(this));
} */

/**
 * Requires a transaction
 */
/* const _updateSchema = async function (schema) {
    const [dbVersion, schemaVersion] = await Zotero.Promise.all(
        [Zotero.Schema.getDBVersion(schema), _getSchemaSQLVersion(schema)]
    );
    if (dbVersion == schemaVersion) {
        return false;
    }
    if (dbVersion > schemaVersion) {
        const dbClientVersion = await Zotero.DB.valueQueryAsync(
            "SELECT value FROM settings WHERE setting='client' AND key='lastCompatibleVersion'"
        );
        throw new Zotero.DB.IncompatibleVersionException(
            `Zotero '${schema}' DB version (${dbVersion}) is newer than SQL file (${schemaVersion})`,
            dbClientVersion
        );
    }
    const sql = await _getSchemaSQL(schema);
    await Zotero.DB.executeSQLFile(sql);
    return _updateDBVersion(schema, schemaVersion);
};
 */
//移除旧文件
/* if (updated) {
    // Upgrade seems to have been a success -- delete any previous backups
    var maxPrevious = userdata - 1;
    var file = Zotero.File.pathToFile(Zotero.DataDirectory.dir);
    var toDelete = [];
    try {
        var files = file.directoryEntries;
        while (files.hasMoreElements()) {
            var file = files.getNext();
            file.QueryInterface(Components.interfaces.nsIFile);
            if (file.isDirectory()) {
                continue;
            }
            var matches = file.leafName.match(/zotero\.sqlite\.([0-9]{2,})\.bak/);
            if (!matches) {
                continue;
            }
            if (matches[1] >= 28 && matches[1] <= maxPrevious) {
                toDelete.push(file);
            }
        }
        for (let file of toDelete) {
            Zotero.debug('Removing previous backup file ' + file.leafName);
            file.remove(false);
        }
    }
    catch (e) {
        Zotero.debug(e);
    }
}


const version = await Zotero.DB.valueQueryAsync("SELECT value FROM settings WHERE setting='client' AND key='lastVersion'");
const currentVersion = Zotero.version;


function _checkClientVersion() {
    return Zotero.DB.executeTransaction(async function () {
        var lastVersion = await _getLastClientVersion();
        var currentVersion = Zotero.version;

        if (currentVersion == lastVersion) {
            return false;
        }

        Zotero.debug(`Client version has changed from ${lastVersion} to ${currentVersion}`);

        // Retry all queued objects immediately on upgrade
        await Zotero.Sync.Data.Local.resetSyncQueueTries();

        // Update version
        await _updateLastClientVersion();

        return true;
    }.bind(this));
} */



/* declare namespace Zotero {
    class DBConnection {
        MAX_BOUND_PARAMETERS: number;
        DB_CORRUPTION_STRINGS: string[];

        constructor(dbNameOrPath: string);

        closed: boolean;
        skipBackup: boolean;

        transactionDate: Date;
        transactionDateTime: string;
        transactionTimestamp: number;

        _dbName: string;
        _dbPath: string;
        _externalDB: boolean;

        _shutdown: boolean;
        _connection: any;
        _transactionID: number;
        _transactionDate: Date;
        _lastTransactionDate: Date;
        _transactionRollback: boolean;
        _transactionNestingLevel: number;
        _callbacks: {
            begin: any[];
            commit: any[];
            rollback: any[];
            current: {
                commit: any[];
                rollback: any[];
            };
        };
        _dbIsCorrupt: boolean | null;

        _transactionPromise: Promise<void> | null;

        IncompatibleVersionException(msg: string, dbClientVersion: string): void;

        __defineGetter__(
            property: string,
            getter: (this: Zotero.DBConnection) => any
        ): void;

        __defineSetter__(
            property: string,
            setter: (this: Zotero.DBConnection, value: any) => void
        ): void;
    }
} */



/* export class AddonDatabase extends Zotero.DBConnection {
    path: string;
    constructor(path: string) {
        super(path);
        this.path = path;
    }

    test  () {
        return this._getConnectionAsync().then(() => {});
    }
    async insertMyDB (ableName: string){
this.test()
    }

} */