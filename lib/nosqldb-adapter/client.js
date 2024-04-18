// import { ObjectId } from 'bson';
// import { NoSQLClient, ServiceType, TableState } from 'oracle-nosqldb';
const ObjectId = require('bson').ObjectId;
const oracleNoSqlDb = require("oracle-nosqldb");
const NoSQLClient = oracleNoSqlDb.NoSQLClient;
const ServiceType = oracleNoSqlDb.ServiceType;
const TableState = oracleNoSqlDb.TableState;
const utils = require('../utils');
const { join } = require('../helpers/query/validOps');
const { NoSQLConnectionString } = require('./connectionString');


const OBJECTID_ENABLED = false;
const OBJECTID_PREFIX = "_obid_";
const MAX_QUERY_RESULTS_LIMIT = 1000;

const LOG_LEVELS = Object.freeze({
    SEVEREE: 1,
    WARNING: 2,
    INFO: 3,
    CONFIG: 4,
    FINE: 5,
    FINNER: 6
});

/**
 * DB connection obhect for the rest of the code. 
 * It contains in this.client the handle to Oracle NoSQL DB.
 */
class OrcoosClient {
    constructor(uri, options) {
        this.uri = uri;
        this.options = options;
        // this.client = new NoSQLClient({
        //     serviceType: ServiceType.KVSTORE,
        //     endpoint: uri
        // });
        this.client = new NoSQLConnectionString(uri).getClient();


        // console.log("   o OrcoosClient() client " + (this.client != null));
        // return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosClient." + m + "(" + JSON.stringify(args) + ")"));
    }

    db(dbName) {
        return new OrcoosDb(this.client, this.options, dbName);
    }
    
    useDb(dbName, options) {
        return new OrcoosDb(this.client, options, dbName);
    }
    
    setMaxListeners(max) { }
    async connect() { }
}

/**
 * The Database object, in the DB is implemented as a namespace/compartment.
 */
class OrcoosDb {
    _collections = {};
    constructor(client, options, dbName) {
        this.client = client;
        this.options = options;
        this.dbName = dbName;
        // return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosDb." + m + "(" + JSON.stringify(args) + ")"));
    }
    
    collection(colName) {
        // console.log('   o Db.collection():' + colName);
        let col = this._collections[colName];
        if (!col) {
            col = new OrcoosCollection(this, colName);
            this._collections[colName] = col;
        }
        return col;
    }
    
    async createCollection(colName, options) {
        // console.log('   o Db.createCollection(' + colName + ")");
        let col = this.collection(colName);
        if (col._created) {
            return col;
        }
        
        col.createTable();
        return col;
    }
}

/**
 * The Collection object, in DB is implmented as a table with 2 columns: 
 *  - kvid as a primary key STRING and 
 *  - kvjson JSON that contains the document
 */
class OrcoosCollection //extends Collection 
{
    constructor(db, colName) {
        //super(colName, db.client, {});
        this.db = db;
        this.colName = colName;
        this._created = false;
        //return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosCollection." + m + "(" + JSON.stringify(args) + ")"));
    }

    async _checkTableIsCreated() {
        // Test with multiple connections fails if the following is uncommented, probably due to bug in Node SDK.
        // if (this._created) {
        //     return;
        // }
        await this.createTable();
    }

    async createTable() {
        let tableName = this.colName;
        try {
            let table = await this.db.client.getTable(tableName);
            if (table && table.tableState == TableState.ACTIVE) {
                this.log(LOG_LEVELS.FINNER, "     o OCol.createTable() Table " + tableName + " already exists.");
                this._created = true;
                return;
            }
        } catch (e) {
            // ignore NoSQLError TABLE_NOT_FOUND
            this.log(LOG_LEVELS.WARNING, "Warning client.getTable: " + e);
        }
        
        try {
            let stmt = 'CREATE TABLE IF NOT EXISTS ' + tableName + '(kvid STRING, kvjson JSON, PRIMARY KEY(kvid))';
            let result = await this.db.client.tableDDL(stmt,
            {
                complete: true,
                tableLimits: {
                    readUnits: 20,
                    writeUnits: 10,
                    storageGB: 1
                }
            });
            await this.db.client.forCompletion(result);
            // console.log("     o - " + JSON.stringify(result));
            this.log(LOG_LEVELS.FINE, '     o OCol.createTable() DDL: ' + tableName + 
                 "    " + stmt);
            this._created = true;
            return;
        } catch (e) {
            console.error("Error create table: " + tableName + '  ' + e);
            throw e;
        }
    }
    
    async insertOne(obj, saveOptions) {
        // this.log(LOG_LEVELS.FINNER, "    o insertOne " + this.colName + " : " + JSON.stringify(obj));
        
        let kvid = "" + obj._id;
        let row = { kvid: kvid };
        row['kvjson'] = OrcoosCollection._fixTypesBeforeInsert(obj);
        try {
            await this._checkTableIsCreated();
            let r = await this.db.client.put(this.colName, row);
            // console.log('    o insertOne: ' + JSON.stringify(r.success));
            return { acknoledged: r.success, insertedId: kvid };
        } catch (e) {
            throw new Error("Error insertOne: " + e);
        }
    }
    
    // MongoDB accepts ObjectId inside doc to be inserted in DB
    // these ObjectId values are saved in NoSQL DB as their string representation
    // ideally they would make it back the same when reading from db
    static _fixTypesBeforeInsert(obj) {
        if (!obj) {
            return obj;
        }
        
        if (obj instanceof ObjectId) {
            return (OBJECTID_ENABLED ? OBJECTID_PREFIX : "" ) + obj;
        } else if (obj instanceof Date) {
            return obj.toISOString();
        }

        if (obj instanceof Array) {
            for (let i in obj) {
                obj[i] = OrcoosCollection._fixTypesBeforeInsert(obj[i]);
            }
            return obj;
        }
        if (obj instanceof Object) {
            for (let prop in obj) {
                obj[prop] = OrcoosCollection._fixTypesBeforeInsert(obj[prop]);
            }
            return obj;
        }
        return obj;
    }
    
    static _fixTypesAfterRead(obj) {
        if (!OBJECTID_ENABLED) {
            if (obj && obj._id) {
                obj._id = new ObjectId(obj._id); 
                return obj;
            }
        }
        
        if (!obj) {
            return obj;
        }
        if (typeof obj === 'string' || obj instanceof String) {
            if ( obj.startsWith(OBJECTID_PREFIX) ) {
                return new ObjectId(obj.substring(OBJECTID_PREFIX.length));
            }
            return obj;
        }
        if (obj instanceof Array) {
            for (let i in obj) {
                obj[i] = OrcoosCollection._fixTypesAfterRead(obj[i]);
            }
            return obj;
        }
        if (obj instanceof Object) {
            for (let prop in obj) {
                obj[prop] = OrcoosCollection._fixTypesAfterRead(obj[prop]);
            }
            return obj;
        }
        return obj;
    }
    
    async findOne(conditions, findOptions) {
        // console.log("    o findOne " + this.colName + " cond: " + JSON.stringify(conditions) + 
        //     " o: " + JSON.stringify(findOptions));
        
        if (conditions._id) {
            await this._checkTableIsCreated();
            return this.db.client.get(this.colName, { kvid: ("" + conditions._id) })
            .then((r) => {
                //console.log('    o findOne: ' + JSON.stringify(r));
                if (r && r.row) {
                    return r.row.kvjson;
                } else {
                    return null;
                }
            });
        }
        // throw new Error("findOne() conditions param doesn't contain _id field.");
        // Do a regular query and return only one result
        let where = this._computeWhere(conditions);
        let stmt = 'SELECT * FROM ' + this.colName + ' t' + where;
        this.log(LOG_LEVELS.INFO, "      o Q: " + stmt);

        await this._checkTableIsCreated();
        for await (const b of this.db.client.queryIterable(stmt)) {
            if (b && b.rows && b.rows.length > 0)
            return OrcoosCollection._fixTypesAfterRead(b.rows[0].kvjson);
        }
        
        return null;
    }
    
    async deleteOne(where, options) {
        // console.log("    o deleteOne " + this.colName + " where: " + JSON.stringify(where) + 
        //     " o: " + JSON.stringify(options));
        
        if (where._id) {
            await this._checkTableIsCreated();
            return this.db.client.delete(this.colName, {kvid: where._id.toString()})
            .then((r, e) => r.success);
        }
        throw new Error("deleteOne() 'where' param must contain _id field.");
    }
    
    // todo cezar: generate queries with bind vars, prepare, cache prepared, bind vars and execute
    async _queryPromise(client, stmt, maxLimit = MAX_QUERY_RESULTS_LIMIT) {        
        try {
            await this._checkTableIsCreated();
            let gen = client.queryIterable(stmt);
            let rows = [];
            let count = 0;
            for await (const b of gen) {
                //console.log('    o - add more ' + b.rows.length);
                if (count + b.rows.length > maxLimit) {
                    throw new Error("Query results more than maxLimit: " + (count + b.rows.length));
                }
                rows.push(b.rows.map(r => OrcoosCollection._fixTypesAfterRead(r)));
                count += b.rows.length;
            }
            //console.log('    o - done ' + rows.length);
            return [].concat(...rows);
        } catch(err) {
            throw new Error("Error executing query: " + err);
        }
    }
    
    async deleteMany(filter, options) {
        // console.log("    o deleteMany " + this.colName + " : " + JSON.stringify(filter) + ", " + JSON.stringify(options));
        let where = this._computeWhere(filter);
        let stmt = 'DELETE FROM ' + this.colName + ' t' + where;       
        
        try {               
            this.log(LOG_LEVELS.INFO, "      o Q: " + stmt);
            await this._checkTableIsCreated();
            let qp = this.db.client.queryIterable(stmt, {});
            
            for await (let b of qp) {
                if (b.rows.length > 0) {
                    // console.log('    o - deleteMany resolved to: ' + (b.rows[0]['numRowsDeleted']));
                    return b.rows[0]['numRowsDeleted'];
                }
            }
            throw new Error("Error: no response from deleteMany query.");
        } catch(error) {
            throw new Error("Error: deleteMany query: " + error);
        }
    }
    
    async count(filter, options) {
        // console.log("    o count " + this.colName + " : " + JSON.stringify(filter) + ", " + JSON.stringify(options));
        
        let where = this._computeWhere(filter);
        let stmt = 'SELECT count(*) FROM ' + this.colName + ' t' + where;
        let client = this.db.client;

        await this._checkTableIsCreated();
        this.log(LOG_LEVELS.INFO, "      o count Q: " + stmt);
        let qp = client.queryIterable(stmt, {});
        
        for await (let b of qp) {
            if (b.rows.length > 0) {
                //console.log('    o - count resolved to: ' + (b.rows[0]['Column_1']));
                return b.rows[0]['Column_1'];
            }
        }
        throw new Error("Error: no response from count query.");
    }
    
    async updateOne(filter, update, options) {
        // https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/#mongodb-method-db.collection.updateOne
        // console.log("    o updateOne " + this.colName + " filter: " + JSON.stringify(filter) + 
        //     " update: " + JSON.stringify(update) + " options: " + JSON.stringify(options));
        
        if (filter && filter._id) {
            await this._checkTableIsCreated();

            let updateClause = this._computeUpdateClause(update);
            let where = this._computeWhere(filter);
            let stmt = 'UPDATE ' + this.colName + ' AS t ' + updateClause + where;
            this.log(LOG_LEVELS.INFO, "      o Q: " + stmt);
    
            const r = await this._queryPromise(this.db.client, stmt);
            
            return {
                matchedCount: r[0].NumRowsUpdated,
                modifiedCount: r[0].NumRowsUpdated,                    
                //upsertedId: r.row.kvid,
                acknoledged: r.success
            };
        } else {
            // doesn't contain _id
            throw new Error("updateOne() filter param doesn't contain _id field.");
        }
    }
    
    async updateMany(filter, update, options) {
        // https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/#mongodb-method-db.collection.updateOne
        // console.log("    o updateMany " + this.colName + " filter: " + JSON.stringify(filter) + 
        //     " update: " + JSON.stringify(update) + " options: " + JSON.stringify(options));

        if (!filter || !filter._id) {
            throw new Error("updateMany() filter param doesn't contain _id field.");
        }

        let updateClause = this._computeUpdateClause(update);
        let where = this._computeWhere(filter);
        let stmt = 'UPDATE ' + this.colName + ' AS t ' + updateClause + where;
        this.log(LOG_LEVELS.INFO, "      o Q: " + stmt);

        const r = await this._queryPromise(this.db.client, stmt);
        
        return {
            matchedCount: r[0].NumRowsUpdated,
            modifiedCount: r[0].NumRowsUpdated,                    
            //upsertedId: r.row.kvid,
            acknoledged: r.success
        };
    }
    
    _computeUpdateClause(update) {
        /*  $currentDate    Sets the value of a field to current date, either as a Date or a Timestamp.
        $inc            Increments the value of the field by the specified amount.
        $min            Only updates the field if the specified value is less than the existing field value.
        $max            Only updates the field if the specified value is greater than the existing field value.
        $mul            Multiplies the value of the field by the specified amount.
        $rename         Renames a field.
        $set            Sets the value of a field in a document.
        $setOnInsert    Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents.
        $unset          Removes the specified field from a document. 
        
        Example: { $set: { "a.2": <new value>, "a.10": <new value>, } }
        */
        
        let updateClause = "";
        
        // These should be done atomically on the server with an UPDATE query
        for (let key in update) {
            if (key == "$set" && update[key] instanceof Object) {
                for (let setKey in update[key]) {
                    updateClause += ', PUT t.kvjson ' + this._computeUpdateSetPutProp(setKey, this._computeLiteral(update[key][setKey]));
                }
            } else if (key == "$unset" && update[key] instanceof Object) {
                for (let setKey in update[key]) {
                    updateClause += ', REMOVE ' + this._computeDbProp(setKey);
                }
            } else if (key == "$currentDate" && update[key] instanceof Object) {
                for (let setKey in update[key]) {
                    updateClause += ', SET ' + this._computeDbProp(setKey) + ' = CAST (current_time() AS String)';
                }
            } else if (key == "$inc" && update[key] instanceof Object) {
                for (let setKey in update[key]) {
                    updateClause += ', SET ' + this._computeDbProp(setKey) + ' = ' + this._computeDbProp(setKey) + ' + ' + this._computeLiteral(update[key][setKey]);
                }
            } else if (key == "$min" && update[key] instanceof Object) {
                for (let setKey in update[key]) {
                    updateClause += ', SET ' + this._computeDbProp(setKey) + ' = ' + 
                    'CASE WHEN ' + this._computeLiteral(update[key][setKey]) + ' < ' + this._computeDbProp(setKey) +
                    ' THEN ' + this._computeLiteral(update[key][setKey]) + 
                    ' ELSE ' + this._computeDbProp(setKey) + 
                    ' END';
                }
            } else if (key == "$max" && update[key] instanceof Object) {
                for (let setKey in update[key]) {
                    updateClause += ', SET ' + this._computeDbProp(setKey) + ' = ' + 
                    'CASE WHEN ' + this._computeLiteral(update[key][setKey]) + ' > ' + this._computeDbProp(setKey) +
                    ' THEN ' + this._computeLiteral(update[key][setKey]) +
                    ' ELSE ' + this._computeDbProp(setKey) +
                    ' END';
                }
            } else if (key == "$mul" && update[key] instanceof Object) {
                for (let setKey in update[key]) {
                    updateClause += ', SET ' + this._computeDbProp(setKey) + 
                    ' = ' + this._computeDbProp(setKey) + ' * ' + this._computeLiteral(update[key][setKey]);
                }
            } else if (key == "$rename" && update[key] instanceof Object) {
                for (let setKey in update[key]) {
                    let dbProp = this._computeDbProp(setKey);
                    updateClause += ', PUT ' + this._computeUpdateRenamePutProp(setKey, update[key][setKey], dbProp);
                    updateClause += ', REMOVE ' + dbProp;
                }
            } else {
                throw new Error("Operator '" + key + "' not known.");
            }
        }
        
        if (updateClause.startsWith(",")) {
            updateClause = updateClause.substring(1);
        }
        
        return updateClause;
    }
    
    async findOneAndDelete(filter, options) {
        // console.log("    o findOneAndDelete " + this.colName + " filter: " + JSON.stringify(filter) + 
        //     " o: " + JSON.stringify(options));
        
        if (filter && filter._id) {
            let where = this._computeWhere(filter);
            let stmt = 'DELETE FROM ' + this.colName + ' t' + where + " RETURNING *";
            this.log(LOG_LEVELS.INFO, "      o Q: " + stmt);
            
            const r = await this._queryPromise(this.db.client, stmt);
            return {value: (r && r[0] ? r[0].kvjson : null)};
            //return new OrcoosFindCursor(this.db, stmt);
        }
        throw new Error("findOneAndDelete() filter param doesn't contain _id field.");
    }
    
    async findOneAndUpdate(filter, update, options) {
        // console.log("    o findOneAndUpdate " + this.colName + " filter: " + JSON.stringify(filter) + 
        //     " update: " + JSON.stringify(update) + " o: " + JSON.stringify(options));
        
        if (filter && filter._id) {
            let where = this._computeWhere(filter);
            let updateClause = this._computeUpdateClause(update);
            let stmt = 'UPDATE ' + this.colName + ' AS t ' + updateClause + where + " RETURNING *";
            this.log(LOG_LEVELS.INFO, "      o Q: " + stmt);
            

            await this._checkTableIsCreated();

            const r = await this._queryPromise(this.db.client, stmt);
            let res = {value: (r && r[0] ? r[0].kvjson : null),
                       ok: (r && r[0] ? 1 : 0)};
            // console.log("     -> " + JSON.stringify(res));
            return res;
        }
        throw new Error("findOneAndDelete() filter param doesn't contain _id field.");
    }
    
    // todo
    async distinct(field, query, options) {
        console.log("    o distinct " + this.colName + " field: " + JSON.stringify(field) + 
            " q: " + JSON.stringify(query) + " o: " + JSON.stringify(options));
        
        throw new Error("distinct not implemented");
    }
    
    async replaceOne(filter, replacement, options) {
        // console.log("    o replaceOne " + this.colName + " filter: " + JSON.stringify(filter) + 
        //     " replcmt: " + JSON.stringify(replacement) + " o: " + JSON.stringify(options));
        
        if (!filter || !filter._id) {
            throw new Error("replaceOne() filter param doesn't contain _id field.");
        }
        
        let kvid = "" + filter._id;
        let row = { kvid: kvid, kvjson: replacement };
        row.kvjson._id = kvid;
        await this._checkTableIsCreated();
        return this.db.client.putIfPresent(this.colName, row)
        .then((r) => {
            this.log(LOG_LEVELS.INFO, '    o > putIfPresent: ' + JSON.stringify(r.success));
            let mc = r.success ? 1 : 0;
            return { acknoledged: r.success, upsertedId: filter._id, matchedCount: mc, modifiedCount: mc};
        });
    }
    
    // todo Can we do anything here?
    aggregate(pipeline, options) {
        // console.log("    o aggregate " + this.colName + " pipeline: " + JSON.stringify(pipeline) + 
        //     " o: " + JSON.stringify(options));
        
        throw new Error("aggregate() not implemented");
    }
    
    async nosqlQuery(statement) {
        this.log(LOG_LEVELS.INFO, "    o nosqlQuery stmt: " + statement);
        await this._checkTableIsCreated();
        return new OrcoosFindCursor(this.db, statement);
    }

    async find(filter, options, schema) {
        //console.log("    o find " + this.colName + " : " + JSON.stringify(filter) + ", " + JSON.stringify(options));
        let where = this._computeWhere(filter);
        let projection = this._conputeProjection(options?.projection, schema);
        let stmt = 'SELECT ' + projection + ' FROM ' + this.colName + ' t' + where;
        this.log(LOG_LEVELS.INFO, "      o Q: " + stmt);
        await this._checkTableIsCreated();
        return new OrcoosFindCursor(this.db, stmt);
    }
    
    _computeWhere(query) {
        if (!query || this._isEmptyObject(query)) {
            return '';
        }
        
        if (!(query instanceof Object)) {
            this.log(LOG_LEVELS.SEVEREE, 'o Error: Unexpected input value for where expression: ' + JSON.stringify(query));
            throw Error('Unexpected input value for where expression: ' + JSON.stringify(query));
        }
        
        if (query._id && (typeof query._id === "string" || 
            query._id instanceof String || 
            query._id instanceof ObjectId)) {
            return ' WHERE (t.kvid = ' + JSON.stringify(query._id) + ')';
        } else {
            let cond = this._computeCompStartExp(query);
            if (cond == "") {
                return "";
            }
            return ' WHERE ' + cond;
        }
    }
    
    _computeCompStartExp(compObj) {
        if (!compObj || !(compObj instanceof Object || compObj instanceof ObjectId)) {
            this.log(LOG_LEVELS.SEVEREE, 'o Error: Unexpected input value for a comparison expression: ' + JSON.stringify(compObj));
            throw Error('Query filter must be a plain object or ObjectId: ' + JSON.stringify(compObj));
        }
        return this._computeCompExp(compObj);
    }

    _computeCompExp(compObj) {
        if (compObj instanceof ObjectId) {
            return "" + compObj;
        }

        let res = '';
        for (const prop in compObj) {
            let propValue = compObj[prop];
            if (res !== '') {
                res += ' AND ';
            }
        
            if (prop.startsWith("$")) {
                switch(prop) {
                case "$or":
                    if (!propValue instanceof Array) {
                        throw Error("$or must be an array");
                    }
                    res += '(';
                    for (let i = 0; i < propValue.length; i++) {
                        if (i > 0) {
                            res += ' OR ';
                        }
                        res += this._computeCompExp(propValue[i]);
                    }
                    res += ')';
                    break;
                case "$and":
                    if (!propValue instanceof Array) {
                        throw Error("$and must be an array");
                    }
                    res += '(';
                    for (let i = 0; i < propValue.length; i++) {
                        if (i > 0) {
                            res += ' AND ';
                        }
                        res += this._computeCompExp(propValue[i]);
                    }
                    res += ')';
                    break;
                case "$not":
                    res += 'NOT(';
                    if (propValue instanceof Array) {
                            for (let i = 0; i < propValue.length; i++) {
                                if (i > 0) {
                                    res += ' AND ';
                                }
                                res += this._computeCompExp(propValue[i]);
                            }
                    } else {
                        res += this._computeCompExp(propValue);
                    }
                    res += ')';
                    break;
                case "$nor":
                    if (!propValue instanceof Array) {
                        throw Error("$nor must be an array");
                    }
                    res += 'NOT(';
                    for (let i = 0; i < propValue.length; i++) {
                        if (i > 0) {
                            res += ' OR ';
                        }
                        res += this._computeCompExp(propValue[i]);
                    }
                    res += ')';
                    break;
                default: 
                    throw Error("Unknown top level operator: " + prop);
                }
            } else if (propValue instanceof Object && Object.keys(propValue).length > 0) {
                let lres = '';
                for (const firstProp in propValue) {
                    if (lres !== '' && firstProp !== "$options") {
                        lres += ' AND ';
                    }
                    switch (firstProp) {
                    case "$gt":
                        lres += '(' + this._computeDbProp(prop) + ' > ' + this._computeLiteral(propValue[firstProp]) + ')';
                        break;
                    case "$gte":
                        lres += '(' + this._computeDbProp(prop) + ' >= ' + this._computeLiteral(propValue[firstProp]) + ')';
                        break;
                    case "$lt":
                        lres += '(' + this._computeDbProp(prop) + ' < ' + this._computeLiteral(propValue[firstProp]) + ')';
                        break;
                    case "$lte":
                        lres += '(' + this._computeDbProp(prop) + ' <= ' + this._computeLiteral(propValue[firstProp]) + ')';
                        break;
                    case "$ne":
                        lres += '(' + this._computeDbProp(prop) + ' != ' + this._computeLiteral(propValue[firstProp]) + ')';
                        break;
                    case "$eq":
                        lres += '(' + this._computeDbProp(prop) + ' = ' + this._computeLiteral(propValue[firstProp]) + ')';
                        break;
                    case "$exists":
                        lres += '(' + (propValue[firstProp] == false ? 'NOT ' : '') + 'EXISTS t.kvjson."' + prop +'")';
                        break;
                    case "$options":
                            // do nothing, it's taken care in the $regex branch below
                            break;
                    case"$regex":
                        if (propValue[firstProp] instanceof Object &&
                            propValue[firstProp]['$regex'] && 
                            propValue[firstProp]['$options'] && propValue[firstProp]['$options'] == 'i') {
                            lres += '( regex_like(' + this._computeDbProp(prop) + ', ' + this._computeLiteral(propValue[firstProp]['$regex']) + ') )';
                        } else if (propValue.$regex instanceof String || 
                            typeof propValue.$regex === "string") {
                            let opt = '';
                            if (propValue.$options && propValue.$options.includes('i')) {
                                opt += 'i';
                            }
                            if (propValue.$options && propValue.$options.includes('s')) {
                                opt += 's';
                            }
                            lres += '( regex_like(' + this._computeDbProp(prop) + ', ' + this._computeLiteral(propValue.$regex) + ',"' + opt + '") )';
                        } else {
                            this.log(LOG_LEVELS.SEVEREE, 'o Error: Unexpected regex value for a comparison expression: ' + JSON.stringify(propValue));
                            throw Error('Unexpected regex value for a comparison expression: ' + JSON.stringify(propValue));
                        }
                        break;
                    case "$in":
                    case "$nin":
                        if (propValue[firstProp] instanceof Array && propValue[firstProp].length > 0) {
                            let kvProp = this._computeDbProp(prop);
                            let inRes = ' IN (';
                            let containsNull = false;
                            let inValCount = 0;
                            for (let i = 0; i < propValue[firstProp].length; i++) {
                                if (propValue[firstProp][i] === null) {
                                    containsNull = true;
                                    continue;
                                }
                                if (i > (containsNull ? 1: 0)) {
                                    inRes += ',';
                                }
                                inRes += this._computeLiteral(propValue[firstProp][i]);
                                inValCount++;
                            }
                            inRes += ')';
                            if (firstProp == "$in") {
                                if (inValCount > 0) {
                                    lres += '(' + kvProp + inRes + ' OR EXISTS (' + kvProp + '[$element' + inRes + '])';
                                }
                                if (containsNull) {
                                    lres += ' OR NOT EXISTS ' + kvProp;
                                }
                            } else {
                                if (inValCount > 0) {
                                    lres += ' NOT (' + kvProp + inRes + ' OR EXISTS (' + kvProp + '[$element' + inRes + '])';
                                }
                                if (containsNull) {
                                    lres += ' OR EXISTS ' + kvProp;
                                }
                            }
                            lres += ')';
                        } else {
                            // skip if this case: $in: []
                        }
                        break;
                    // $or, $and, $nor only at top level?
                    // case "$nor":
                    //     lres += ' NOT ';
                    // case "$or":
                    //     lres += '(';
                    //     for (let i = 0; i < propValue['$or'].length; i++) {
                    //         if (i > 0) {
                    //             lres += ' OR ';
                    //         }
                    //         lres += this._computeCompExp(propValue['$or'][i]);
                    //     }
                    //     lres += ')';
                    //     break;
                    // case "$and": // not sure if this exists
                    //     lres += '(';
                    //     for (let i = 0; i < propValue['$and'].length; i++) {
                    //         if (i > 0) {
                    //             lres += ' AND ';
                    //         }
                    //         lres += this._computeCompExp(propValue['$and'][i]);
                    //     }
                    //     lres += ')';
                    //     break;
                    // case "$not":
                    //     lres += 'NOT(';
                    //     lres += this._computeCompExp(propValue['$not']);
                    //     lres += ')';
                    //     break;
                    case "$size":
                        lres += '( size([' + this._computeDbProp(prop) + ']) = ' + propValue['$size'] + ' )'; 
                        break;
                    default:
                        this.log(LOG_LEVELS.SEVEREE, 'o Error: Unexpected property value for a comparison expression: ' + JSON.stringify(propValue));
                        throw Error('Unexpected property value for a comparison expression: ' + JSON.stringify(propValue));
                    }
                }
                res += lres;
            } else if (propValue instanceof String || typeof propValue === "string" || 
                    propValue instanceof Date || 
                    propValue instanceof Number || typeof propValue === 'number' ||
                    propValue instanceof ObjectId) {
                if (prop == '_id') {
                    res += '(t.kvid = ' + this._computeLiteral(propValue) + ')';
                } else {
                    res += '(' + this._computeDbProp(prop) + ' =any ' + this._computeLiteral(propValue) + ')';
                }
            } else {
                throw Error("ISE prop: " + prop + " propVal: " + propValue);
            }
        }
        if (res == "") {
            return "";
        }
        return '(' + res + ')';
    }
    
    _computeDbProp(prop) {
        if (prop instanceof String || typeof prop === "string") {
            if (prop === '_id') {
                return 't.kvid';
            }
            let trProp = prop
                .split('.')
                // .map(p => {
                //     if (this._isPositiveInteger(p)) {
                //         // the array index case ex: items.0 
                //         return '[' + p + ']';
                //     }
                //     return '"' + p + '"[]';
                // }).join('.');
                .reduce((acc, cur) => {
                    if (this._isPositiveInteger(cur)) {
                      return acc + '[' + cur + ']';
                    }
                    return acc + '."' + cur +'"';
                  }, "");
            return 't.kvjson' + trProp + "[]";
        }
        throw Error("Property is not a string type: " + typeof prop);
    }

    /**
     *  Transforms prop ex: 'a.b.c' to  {'a': {'b': {'c': value }}}
     */
    _computeUpdateSetPutProp(prop, value) {
        if (prop instanceof String || typeof prop === "string") {
            let res = prop
                .split('.')
                .reduceRight( (acc, cur) => '{"' + cur + '": ' + acc + '}', value);
            return res;
        }
        return;
    }

    /**
     *  Transforms prop ex: 'a.b.c' to  {'a': {'b': {'newProp': value }}}
     */
    _computeUpdateRenamePutProp(prop, renamedProp, value) {
        if (prop instanceof String || typeof prop === "string") {
            let li = prop.lastIndexOf('.');
            let newProp = prop.substring(0, li);
            return this._computeDbProp(newProp) + " " + this._computeUpdateSetPutProp(renamedProp, value);
        }
        return;
    }
        
    _isPositiveInteger(str) {
        var n = Math.floor(Number(str));
        return n !== Infinity && String(n) === str && n >= 0;
    }

    // Returns the corect SQL literal to be appended to the statement
    _computeLiteral(value) {
        if (!value || value === null) {
            return 'NULL';
            // } else if (value instanceof Number) {
            //     return value;
            // } else if (value instanceof Date) {
            //     return value.toISOString();
        } else {
            return JSON.stringify(value);
        }
    }
    
    _isEmptyObject(obj) {
        return obj && typeof obj === 'object' && 
        Object.keys(obj).length === 0 &&
        !(obj instanceof Date) && !(obj instanceof ObjectId);
    }
    
    _conputeProjection(projection, schema) {
        if (!projection) {
            return '*';
        }

        if (! typeof projection === 'object') {
            throw Error("Projection is not an object: " + typeof projection);
        }

        let prjType = 0; // 0: unknown or empty projection {}, 1: all inclusions, -1: all exclusions

        // transform projection paths into object tree
        // ex: {'a.b.c': 1} => {'a': {'b': {'c': 1}}}
        let prjObj = {}
        for (let prop in projection) {       
            if (prop == "_id")
                continue;     
            // if (projection[prop] == 0 || projection[prop] == false) {
            //     if (prjType == 1) 
            //         throw Error("Projection cannot be both inclusive and exclusive: " + JSON.stringify(projection));
            //     prjType = -1;
            //     continue;
            // }
            if (projection[prop] == 1 || projection[prop] == true) {
                if (prjType == -1)
                    throw Error("Projection cannot be both inclusive and exclusive: " + JSON.stringify(projection));
                prjType = 1;
                // all inclusions
                this._computePrjObjDeep(prjObj, prop, projection[prop]);
            } else if (projection[prop] == 0 || projection[prop] == false) {
                if (prjType == 1)
                    throw Error("Projection cannot be both exclusive and inclusive: " + JSON.stringify(projection));
                prjType = -1;
                // all exclusions
                this._computePrjObjDeep(prjObj, prop, projection[prop]);                
            } else {
                // all other inclusions
                prjType = 1;
                this._computePrjObjDeep(prjObj, prop, projection[prop]);                
            }
        }
        
        if (prjType == -1 || prjType == 0) {
            // exclusions or '{}' all, ie it needs to include all but the exclusions
            // for this we need schema
            if ( !schema || typeof schema != 'object' || typeof schema.tree != 'object') {
                throw Error("Schema is not provided for the projection. Got: " + JSON.stringify(projection));
            }            
        
            for (let prop in schema.paths) {
                if (prop == '_id' || prop == 'id' || prop == '__v' ||
                    projection[prop] == 0 || projection[prop] == false) {
                    continue;
                }

                if (schema.paths[prop].instance == 'Date' || schema.paths[prop].instance == 'ObjectId' || 
                    schema.paths[prop].instance == 'Number' || schema.paths[prop].instance == 'String' ||
                    schema.paths[prop].instance == 'Boolean') {
                    if (prjObj[prop] == undefined) {
                        prjObj[prop] = 1;
                    }
                } else if (schema.paths[prop].instance == 'Array' && 
                    schema.paths[prop].schema && schema.paths[prop].schema.paths /*&& schema.paths[prop].schema.$isMongooseArray*/) {
                    if (prjObj[prop] == undefined) {
                        prjObj[prop] = {};
                    }
                    this._computePrjObjDeepExcl(prjObj[prop], prop, projection, schema.paths[prop].schema);
                } else if (schema.paths[prop].instance == 'Embedded' && 
                    schema.paths[prop].options && schema.paths[prop].options.type) {
                    if (prjObj[prop] == undefined) {
                        prjObj[prop] = {};
                    }
                    this._computePrjObjDeepExcl(prjObj[prop], prop, projection, schema.paths[prop].options.type);
                } else {
                    throw Error("Unsupported type: " + schema.paths[prop].type + ", prototype constructor: " + Object.getPrototypeOf(schema.paths[prop]).constructor.name);;
                }
            }
        }

        let res = "";
        //if (prjType == 1) {
            // if it's an inclusion projection
            for (let prop in prjObj) {
                if (res != "") {
                    res += ', ';
                }
                if (prjObj[prop] == 0 || prjObj[prop] == false) {            
                    continue;
                } else if (prjObj[prop] == 1 || prjObj[prop] == true) {            
                    res += "'" + prop + "': " + this._computeDbProp(prop);
                } else {
                    res += "'" + prop + "': " + this._computePrjDeep(prop, prjObj[prop], schema);
                }
            }
        //} else {
        

        // add _id if not specified or if specified as inclusion
        if (projection['_id'] == undefined || projection._id == 1) {
            res = "'_id':" + this._computeDbProp('_id') + ', ' + res;
        }

        res = '{' + res + '} as kvjson';

        return res;
    }

    _computePrjObjDeep(prjObj, prop, value) {
        let dotIndex = prop.indexOf('.');
        if ( dotIndex > 0) {
            let propBase = prop.substring(0, dotIndex);
            let propChild = prop.substring(dotIndex + 1);
            if (prjObj[propBase] == undefined)
                prjObj[propBase] = {};
            this._computePrjObjDeep(prjObj[propBase], propChild, value);
        } else {
            if (prjObj[prop] == undefined)
                prjObj[prop] = value;
            else
                Error("Duplicate property in projection: " + prop);
        }
        // return prjObj;
    }

    _computePrjDeep(propBase, propChild, schema) {
        let res = "";

        if (propChild instanceof Object) {
            for (let prop in propChild) {
                if (res != "") {
                    res += ', ';
                }
                if (prop.startsWith('$')) {
                    return this._computePrjOperators(prop, propChild[prop]);
                } else if (propChild[prop] == 0 || propChild[prop] == false) {
                    continue;
                } else if (propChild[prop] == 1 || propChild[prop] == true) {
                    res += "'" + prop + "': " + this._computeDbProp(propBase + '.' + prop) + "";
                } else {
                    res += "'" + prop + "': " + this._computePrjDeep(propBase + '.' + prop, propChild[prop], schema);
                }
            }
            let isArray = this._isSchemaArray(schema, propBase);
            res = isArray ? '[{' + res + '}]' : '{' + res + '}';
            return res;
        } else if (typeof(propChild) == 'number') {
            return propChild;
        } else if (typeof(propChild) == 'string') {
            if (propChild.startsWith('$')) {
                return this._computeDbProp(propChild.substring(1));
            }
            return "'" + propChild + "'";
        } else {
            throw Error("Unsupported type: " + propChild);
        }
    }
    
    _isSchemaArray(schema, path) {
        let schemaPropType = schema.path(path);
        if (!schemaPropType || !schemaPropType.instance) {
            return false;
        }
        return schemaPropType.instance === 'Array';
    }

    _computePrjObjDeepExcl(prjObj, baseProp, projection, schema) {
        if ( !schema || !schema.paths || typeof schema.paths != 'object') {
            throw Error("Schema is not provided for the projection. Got: " + JSON.stringify(schema));
        }
    
        for (let prop in schema.paths) {
            if (prop == '_id' || prop == 'id' || prop == '__v' ||
                projection[baseProp + "." + prop] == 0 || projection[baseProp + '.' + prop] == false) {
                continue;
            }

            if (schema.paths[prop].instance == 'Date' || schema.paths[prop].instance == 'ObjectId' || 
                    schema.paths[prop].instance == 'Number' || schema.paths[prop].instance == 'String' ||
                    (schema.paths[prop].instance == 'Array' && !schema.paths[prop].schema)) {
                    if (prjObj[prop] == undefined) {
                        prjObj[prop] = 1;
                    }
                } else if (schema.paths[prop].instance == undefined && 
                    schema.paths[prop].schema && schema.paths[prop].schema.paths /*&& schema.paths[prop].schema.$isMongooseArray*/) {
                        if (prjObj[prop] == undefined) {
                            prjObj[prop] = {};
                        }
                        this._computePrjObjDeepExcl(prjObj[prop], baseProp + "." + prop, projection, schema.paths[prop].schema);
                } else if (schema.paths[prop].instance == undefined && 
                    schema.paths[prop].options && schema.paths[prop].options.type) {
                        if (prjObj[prop] == undefined) {
                            prjObj[prop] = {};
                        }
                        this._computePrjObjDeepExcl(prjObj[prop], baseProp + "." + prop, projection, schema.paths[prop].options.type);
                } else {
                    throw Error("Unsupported type: " + schema.paths[prop].type + ", prototype constructor: " + Object.getPrototypeOf(schema.paths[prop]).constructor.name);;
            }
        }
    }

    _computePrjOperators(prop, params) {
        if (typeof(prop)!='string' || !prop.startsWith('$')) {
            throw Error("Invalid operator property: " + prop);
        }

        // Arithmetics
        if (prop == '$multiply') {
            if (!params instanceof Array) {
                throw Error("Invalid $multiply params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' * ') + ')';
        } else if (prop == '$divide') {
            if (!params instanceof Array) {
                throw Error("Invalid $divide params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' div ') + ')';
        } else if (prop == '$mod') {
            if (!params instanceof Array || params.length!= 2) {
                throw Error("Invalid $mod value: " + params);
            }
            let m = this._computePrjOperands(params[0]);
            let n = this._computePrjOperands(params[1])
            return '(' + m + '-(' + m + '/' + n + '*' + n + '))';
        } else if (prop == '$add') {
            if (!params instanceof Array) {
                throw Error("Invalid $add params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' + ') + ')';
        } else if (prop == '$subtract') {
            if (!params instanceof Array) {
                throw Error("Invalid $subtract params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' - ') + ')';
        } else if (prop == '$abs') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $abs params: " + params);
            }
            return 'abs(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$ceil') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $ceil params: " + params);
            }
            return 'ceil(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$floor') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $floor params: " + params);
            }
            return 'floor(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$round') {
            if (!params instanceof Array || params.length < 1 || params.length > 2) {
                throw Error("Invalid $round params: " + params);
            }
            return 'round(' + params.map(v => this._computePrjOperands(v)).join(', ') + ')';
        } else if (prop == '$trunc') {
            if (!params instanceof Array || params.length < 1 || params.length > 2) {
                throw Error("Invalid $trunc params: " + params);
            }
            return 'trunc(' + params.map(v => this._computePrjOperands(v)).join(', ') + ')';
        } else if (prop == '$exp') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $exp params: " + params);
            }
            return 'exp(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$log') {
            if (!params instanceof Array || params.length < 1 || params.length > 2) {
                throw Error("Invalid $log params: " + params);
            }
            return 'log(' + params.map(v => this._computePrjOperands(v)).join(', ') + ')';
        } else if (prop == '$ln') {
            if (!params instanceof Number || !params instanceof Object) {
                throw Error("Invalid $ln params: " + params);
            }
            return 'ln(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$log10') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $log10 params: " + params);
            }
            return 'log10(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$pow') {
            if (!params instanceof Array || params.length < 1 || params.length > 2) {
                throw Error("Invalid $pow params: " + params);
            }
            return 'power(' + params.map(v => this._computePrjOperands(v)).join(', ') + ')';
        } else if (prop == '$sqrt') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $sqrt params: " + params);
            }
            return 'sqrt(' + this._computePrjOperands(params) + ')';
        
        // Trigonometry
        } else if (prop == '$cos') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $cos params: " + params);
            }
            return 'cos(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$sin') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $sin params: " + params);
            }
            return 'sin(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$tan') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $atan params: " + params);
            }
            return 'tan(' + this._computePrjOperands(params) + ')';            
        } else if (prop == '$acos') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $acos params: " + params);
            }
            return 'acos(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$asin') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $asin params: " + params);
            }
            return 'asin(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$atan') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $atan params: " + params);
            }
            return 'atan(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$atan2') {
            if (!params instanceof Array || params.length != 2) {
                throw Error("Invalid $atan2 params: " + params);
            }
            return 'atan2(' + this._computePrjOperands(params[0]) + ', ' + this._computePrjOperands(params[1]) + ')';
        } else if (prop == '$radiansToDegrees') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $radiansToDegrees params: " + params);
            }
            return 'degrees(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$degreesToRadians') {
            if (!params instanceof Number || !params instanceof String || !params instanceof Object) {
                throw Error("Invalid $degreesToRadians params: " + params);
            }
            return 'radians(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$rand') {
            if (!params instanceof Object) {
                throw Error("Invalid $concat value: " + params);
            }
            return 'rand()';
        
        // Comparison
        } else if (prop == '$eq') {
            if (!params instanceof Array) {
                throw Error("Invalid $eq params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' = ') + ')';
        } else if (prop == '$ne') {
            if (!params instanceof Array) {
                throw Error("Invalid $ne params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' != ') + ')';
        } else if (prop == '$gt') {
            if (!params instanceof Array) {
                throw Error("Invalid $gt params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' > ') + ')';
        } else if (prop == '$gte') {
            if (!params instanceof Array) {
                throw Error("Invalid $gte params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' >= ') + ')';
        } else if (prop == '$lt') {
            if (!params instanceof Array) {
                throw Error("Invalid $lt params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' < ') + ')';
        } else if (prop == '$lte') {
            if (!params instanceof Array) {
                throw Error("Invalid $lte params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' <= ') + ')';

        // Logical
        } else if (prop == '$and') {
            if (!params instanceof Array) {
                throw Error("Invalid $and params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' AND ') + ')';
        } else if (prop == '$or') {
            if (!params instanceof Array) {
                throw Error("Invalid $or params: " + params);
            }
            return '(' + params.map(v => this._computePrjOperands(v)).join(' OR ') + ')';
        } else if (prop == '$not') {
            if (typeof(params) != 'string') {
                throw Error("Invalid $not params: " + params);
            }
            return '( NOT ' + this._computePrjOperands(params) + ')';

        // String functions
        } else if (prop == '$concat') {
            if (!params instanceof Array) {
                throw Error("Invalid $concat params: " + params);
            }
            return 'concat(' + params.map(v => this._computePrjOperands(v)).join(', ') + ')';
        } else if (prop == '$substrCP') {
            if (!params instanceof Array) {
                throw Error("Invalid $substrCP params: " + params);
            }
            return 'substring(' + params.map(v => this._computePrjOperands(v)).join(', ') + ')';
        } else if (prop == '$toUpper') {
            if (!params instanceof String || !params instanceof Object) {
                throw Error("Invalid $toUpper params: " + JSON.stringify(params));
            }
            return 'upper(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$toLower') {
            if (!params instanceof String || !params instanceof Object) {
                throw Error("Invalid $toLower params: " + JSON.stringify(params));
            }
            return 'lower(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$trim') {
            if (!params instanceof Object || !params['input']) {
                throw Error("Invalid $trim params: " + JSON.stringify(params));
            }
            return 'trim(' + this._computePrjOperands(params['input']) + ', "both"' + 
                (params['chars'] ? ', ' + this._computePrjOperands(params['chars']) : '') + ')';
        } else if (prop == '$ltrim') {
            if (!params instanceof Object || !params['input']) {
                throw Error("Invalid $ltrim params: " + JSON.stringify(params));
            }
            return 'trim(' + this._computePrjOperands(params['input']) + ', "leading"' + 
                (params['chars'] ? ', ' + this._computePrjOperands(params['chars']) : '') + ')';
        } else if (prop == '$rtrim') {
            if (!params instanceof Object || !params['input']) {
                throw Error("Invalid $rtrim params: " + JSON.stringify(params));
            }
            return 'trim(' + this._computePrjOperands(params['input']) + ', "trailing"' + 
                (params['chars'] ? ', ' + this._computePrjOperands(params['chars']) : '') + ')';
        } else if (prop == '$strLenCP') {
            if (!params instanceof String || !params instanceof Object) {
                throw Error("Invalid $strLenCP params: " + JSON.stringify(params));
            }
            return 'length(' + this._computePrjOperands(params) + ')';
        } else if (prop == '$indexOfCP') {
            if (!params instanceof Array || params.length < 2 || params.length > 3) {
                throw Error("Invalid $indexOfCP params: " + JSON.stringify(params));
            }
            return 'index_of(' + this._computePrjOperands(params[0]) + ', ' + 
                this._computePrjOperands(params[1]) + 
                (params.length == 3 ? ',' + this._computePrjOperands(params[2]) : '') + 
                ')';
        
        // Other
        // todo: look into array operations $filter, $first, $last, $slice, $elemMatch, $size, $indexOfArray, $reduce
        // todo: Date/Time functs

        } else {
            throw Error("Unsupported operator: " + prop);
        }
    }

    _computePrjOperands(value) {
        if (typeof(value) == 'string') {
            if (value.startsWith('$')) {
                return this._computeDbProp(value.substring(1));
            }
            return "'" + value + "'";
        } else if (typeof(value) == 'number') {
            return value;
        } else if (typeof(value) == 'boolean') {
            return value;
        } else if (typeof(value) == 'object' && 
            Object.keys(value).length == 1 && Object.keys(value)[0].startsWith('$')) {
            let prop = Object.keys(value)[0];
            return this._computePrjOperators(prop, value[prop]);
        }

        throw Error("Invalid operand value: " + value);
    }

    // todo ignores write concern and options altogether
    async insertMany(docs, options) {
        // console.log("   o insertMany " + this.colName + " : ");// + JSON.stringify(objects));
        let promises = [];
        for (let doc of docs) {
            promises.push(this.insertOne(doc, options));
        }
        
        let res = {
            acknoledged: true,
            insertedCount: 0,
            insertedIds: []
        };
        try {
            let rs = await Promise.all(promises);
            for (let r of rs) {
                if (r.acknoledged) {
                    res.insertedCount++;
                    res.insertedIds.push(r.insertedId);
                }   
            }
            return res;
        } catch (err) {
            throw err; 
        }
    }

    async createIndex(keys, options, schema) {
        this.log(LOG_LEVELS.FINNER, "OrcColl.createIndex model: " + JSON.stringify(schema));
        let idxName = '';
        let params = "";
        for (const [key, value] of Object.entries(keys)) {
            if (key.includes('*') || key.includes('$')) {
                throw Error("Orcoos does not support wildcard indexes, received: " + key);
            }
            if (value != 1) {
                throw Error("Orcoos supports indexes only on path values equal to 1, received: " + value);
            }
            idxName += '_' + key.replaceAll('.', '');

            let indexProperty = this._computeIndexProperty(key, schema);
            if (params.length > 0) {
                params += ", ";
            }
            params += indexProperty;
        }
        idxName = "idx_" + this.colName + idxName;
        let ddl = "CREATE INDEX IF NOT EXISTS " + idxName + " ON " + this.colName + 
            " (" + params + ")"
        this.log(LOG_LEVELS.INFO, "      o DLL: " + ddl);

        let result = await this.db.client.tableDDL(ddl,
            {
                complete: true
            });
        await this.db.client.forCompletion(result);

        return idxName;
    }

    _computeIndexProperty(prop, schema) {
        if ( !((prop instanceof String || typeof prop === "string" ) && 
                prop.length > 0)) {
            throw Error("Property is not a non-empty string: " + typeof prop);
        }
        
        if (!schema || typeof schema != 'object' || typeof schema.path != 'function') {
            throw Error("Schema is not provided for the index. Got: " + JSON.stringify(schema));
        }

        let steps = prop.split('.');
        let dbProp = "";
        let lastStepType = "";
        for (let index = 0; index < steps.length; index++) {
            let path = steps.slice(0, index + 1).join('.');
            let schemaPropType = schema.path(path);
            if (!schemaPropType || !schemaPropType.instance) {
                throw Error("No property named: " + step + " found for " + this.colName);
            }
            let [isArray, dbPropType] = this._computeDbType(schemaPropType);
            if (dbProp.length > 0) {
                dbProp += ".";
            }
            dbProp += steps[index] + (isArray? "[]" : "");
            lastStepType = dbPropType;
        }

        return "kvjson." + dbProp + " AS " + lastStepType;
    }
    
    _computeDbType(schemaPropType) {
        switch(schemaPropType.instance) {
            case 'Array':
                return [true, this._computeDbType(schemaPropType.caster)[1]];

            // All other cases are treated as ANYATOMIC for compatibility if user decides t change the type later
            case 'String': 
                // return [false, "STRING"];
            case 'Number':
                // return [false, "NUMBER"];
            case 'Boolean':
                // return [false, "BOOLEAN"];
            case 'Date':
                // return [false, 'STRING'];
            default:
                return [false, "ANYATOMIC"];
        }
    }

    listIndexes() {
        this.log(LOG_LEVELS.FINNER, "    o listIndexes " + this.colName);
        let tableName = this.colName;

        return new OrcoosArray(async() => {
            // console.log("    o listIndexes orcArray: " + this.colName);
            let result = await this.db.client.getIndexes(tableName);
            // console.log("    o listIndexes result: " + JSON.stringify(result));
            let res = result.map(v => {
                let idxKey = {};
                v.fields?.map(v => 
                    {
                        idxKey[v.substring(7).replaceAll('"', '')] = 1;
                    });

                return { name: v.indexName, key: idxKey};
            });
            // console.log("    o listIndexes res: " + JSON.stringify(res));
            return res;
        });
    }

    async dropIndex(idxName) {
        this.log(LOG_LEVELS.FINNER, "    o dropIndex " + this.colName + " idx: " + idxName);
        let ddl = "DROP INDEX IF EXISTS " + idxName + " ON " + this.colName;
        this.log(LOG_LEVELS.INFO, "      o DLL: " + ddl);

        let result = await this.db.client.tableDDL(ddl,
            {
                complete: true
            });
        await this.db.client.forCompletion(result);
        return result;
    }


    log(level, str) {
        if (this.db.options && this.db.options['debug'] >= level) {
            console.log(str);
        }
        if (level <= LOG_LEVELS.WARNING) {
            utils.warn(str);
        }
    }
}

class OrcoosFindCursor {
    constructor(db, statement, maxLimit = MAX_QUERY_RESULTS_LIMIT) {
        this.db = db;
        this.statement = statement;
        this.maxLimit = maxLimit;
        //return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosFindCursor." + m + "(" + JSON.stringify(args) + ")"));
    }
    
    async toArray() {
        let rows = [];
        let count = 0;
        try {
            this.gen = this.db.client.queryIterable(this.statement);
            for await (const b of this.gen) {
                //console.log('    o - add more ' + b.rows.length);
                if (count + b.rows.length > this.maxLimit) {
                    reject("Query results more than maxLimit: " + (count + b.rows.length));
                }
                rows.push(b.rows.map(r => OrcoosCollection._fixTypesAfterRead(r.kvjson ? r.kvjson : r)));
                count += b.rows.length;
            }
            //console.log('    o - done ' + rows.length);
            
            return [].concat(...rows);    
        } catch(e) {
            console.log("Error on statement: " + this.statement, ". ", e);
            throw e;
        }
    }
}

class OrcoosArray {
    constructor(f) {
        this.f = f;
    }
    
    async toArray() {
        return this.f();
    }
}

// function interceptMethodCalls(obj, fn) {
//     return new Proxy(obj, {
//         get(target, prop) { // (A)
//             if (typeof target[prop] === 'function') {
//                 return new Proxy(target[prop], {
//                     apply: (target, thisArg, argumentsList) => { // (B)
//                         fn(prop, argumentsList);
//                         return Reflect.apply(target, thisArg, argumentsList);
//                     }
//                 });
//             } else {
//                 return Reflect.get(target, prop);
//             }
//         }
//     });
// }
//exports.interceptMethodCalls = interceptMethodCalls;

// const _OrcoosClient = OrcoosClient;
//export { _OrcoosClient as OrcoosClient };
module.exports.OrcoosClient = OrcoosClient;

//exports.OrcoosDb = OrcoosDb;
// const _OrcoosCollection = OrcoosCollection;
//export { _OrcoosCollection as OrcoosCollection };
module.exports.OrcoosCollection = OrcoosCollection;
