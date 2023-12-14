import { ObjectId } from 'bson';
import { NoSQLClient, ServiceType, TableState } from 'oracle-nosqldb';

const OBJECTID_ENABLED = false;
const OBJECTID_PREFIX = "_obid_";
const MAX_QUERY_RESULTS_LIMIT = 1000;

/**
 * DB connection obhect for the rest of the code. 
 * It contains in this.client the handle to Oracle NoSQL DB.
 */
class OrcoosClient {
    constructor(uri, options) {
        this.uri = uri;
        this.options = options;
        this.client = new NoSQLClient({
            serviceType: ServiceType.KVSTORE,
            endpoint: uri
        });
        
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
                this.log(5, "     o OCol.createTable() Table " + tableName + " already exists.");
                this._created = true;
                return;
            }
        } catch (e) {
            // ignore NoSQLError TABLE_NOT_FOUND
            console.log("Warning client.getTable: " + e);
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
            this.log(3, '     o OCol.createTable() DDL: ' + tableName + 
                 "    " + stmt);
            this._created = true;
            return;
        } catch (e) {
            console.error("Error create table: " + tableName + '  ' + e);
            throw e;
        }
    }
    
    async insertOne(obj, saveOptions) {
        // this.log(6, "    o insertOne " + this.colName + " : " + JSON.stringify(obj));
        
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
        this.log(1, "      o Q: " + stmt);

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
            this.log(1, "      o Q: " + stmt);
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
        this.log(1, "      o count Q: " + stmt);
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
            this.log(1, "      o Q: " + stmt);
    
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
        this.log(1, "      o Q: " + stmt);

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
            this.log(1, "      o Q: " + stmt);
            
            const r = await this._queryPromise(this.db.client, stmt);
            return {value: (r && r[0] ? r[0].kvjson : null)};
            //return new OrcoosFindCursor(this.db.client.queryIterable(stmt));
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
            this.log(1, "      o Q: " + stmt);
            

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
        console.log("    o distinct " + this.colName + " fied: " + JSON.stringify(field) + 
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
            this.log(1, '    o > putIfPresent: ' + JSON.stringify(r.success));
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
        this.log(1, "    o nosqlQuery stmt: " + statement);
        await this._checkTableIsCreated();
        return new OrcoosFindCursor(this.db.client.queryIterable(statement));
    }
    
    async find(filter, options) {
        // console.log("    o find " + this.colName + " : " + JSON.stringify(filter) + ", " + JSON.stringify(options));
        let projection = "*"; //todo
        let where = this._computeWhere(filter);
        let stmt = 'SELECT ' + projection + ' FROM ' + this.colName + ' t' + where;
        this.log(1, "      o Q: " + stmt);
        await this._checkTableIsCreated();
        return new OrcoosFindCursor(this.db.client.queryIterable(stmt));
    }
    
    _computeWhere(query) {
        if (!query || this._isEmptyObject(query)) {
            return '';
        }
        
        if (!(query instanceof Object)) {
            console.log('o Error: Unexpected input value for where expression: ' + JSON.stringify(query));
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
            console.log('o Error: Unexpected input value for a comparison expression: ' + JSON.stringify(compObj));
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
                    throw Error("Unknown top lebel operator: " + prop);
                }
            } else if (propValue instanceof Object && Object.keys(propValue).length > 0) {
                // todo: this must be a for loop for ex: {storeLocation: {$eq: "NY", $gte: "N"}}
                //let firstProp = Object.keys(propValue)[0];
                let lres = '';
                for (const firstProp in propValue) {
                    if (lres !== '') {
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
                    case"$regex":
                        if (propValue[firstProp] instanceof Object &&
                            propValue[firstProp]['$regex'] && 
                            propValue[firstProp]['$options'] && propValue[firstProp]['$options'] == 'i') {
                            lres += '( contains(t.kvid."' + prop + '", ' + JSON.stringify(propValue[firstProp]['$regex']) + ') )';
                        } else if (propValue.$regex instanceof String || 
                            typeof propValue.$regex === "string") {
                                lres += '( contains(' + this._computeDbProp(prop) + ', ' + JSON.stringify(propValue.$regex) + ') )';
                        } else {
                            console.log('o Error: Unexpected regex value for a comparison expression: ' + JSON.stringify(propValue));
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
                        console.log('o Error: Unexpected property value for a comparison expression: ' + JSON.stringify(propValue));
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
            return 't.kvjson' + trProp;
        }
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
    
    
    // todo
    async createIndex(keys, options, commitQuorum) {
        let s = '';
        for (const [key, value] of Object.entries(keys)) {
            //console.log(`${key}: ${value}`);
            s += '_' + key;
        }
        return "idx_" + s;
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

    log(level, str) {
        if (this.db.options && this.db.options['debug'] >= level) {
            console.log(str);
        }
    }
}

class OrcoosFindCursor {
    constructor(gen, maxLimit = MAX_QUERY_RESULTS_LIMIT) {
        this.gen = gen;
        this.maxLimit = maxLimit;
        //return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosFindCursor." + m + "(" + JSON.stringify(args) + ")"));
    }
    
    async toArray() {
        let rows = [];
        let count = 0;
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
const _OrcoosClient = OrcoosClient;
export { _OrcoosClient as OrcoosClient };
//exports.OrcoosDb = OrcoosDb;
const _OrcoosCollection = OrcoosCollection;
export { _OrcoosCollection as OrcoosCollection };