import { ObjectId } from 'bson';
import { NoSQLClient, ServiceType, TableState } from 'oracle-nosqldb';

const OBJECTID_ENABLED = false;
const OBJECTID_PREFIX = "_obid_";

class OrcoosClient {
    constructor(uri, options) {
        this.uri = uri;
        this.options = options;
        this.client = new NoSQLClient({
            serviceType: ServiceType.KVSTORE,
            endpoint: uri
        });
        
        console.log("   o OrcoosClient() client " + (this.client != null));

        // this.client.listTables().then( (r) => {
        //   console.log("    o NoSQL tables:");
        //   r.tables.forEach(console.log)
        // });
        //return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosClient." + m + "(" + JSON.stringify(args) + ")"));
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

class OrcoosDb {
    _collections = {};
    constructor(client, options, dbName) {
        this.client = client;
        this.options = options;
        this.dbName = dbName;
        //return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosDb." + m + "(" + JSON.stringify(args) + ")"));
    }
    
    collection(colName) {
        console.log('   o Db.collection():' + colName);
        let col = this._collections[colName];
        if (!col) {
            col = new OrcoosCollection(this, colName);
            //col = await this.createCollection(colName, null);
            this._collections[colName] = col;
        }
        return col;
    }
    
    async createCollection(colName, options) {
        console.log('   o Db.createCollection(' + colName + ")");
        let col = this.collection(colName);
        if (col._created) {
            return col;
        }
        
        try {
            let table = await this.client.getTable(colName);
            if (table && table.tableState == TableState.ACTIVE) {
                console.log("     o Db.createCollection() Table " + colName + " already exists.");
                col._created = true;
                return col;
            }
        } catch (e) {
            // ignore NoSQLError TABLE_NOT_FOUND
            console.log("Warning client.getTable: " + e);
        }
        
        try {
            let stmt = 'CREATE TABLE IF NOT EXISTS ' + colName + '(kvid STRING, kvjson JSON, PRIMARY KEY(kvid))';
            let result = await this.client.tableDDL(stmt,
            {
                complete: true,
                tableLimits: {
                    readUnits: 20,
                    writeUnits: 10,
                    storageGB: 1
                }
            });
            console.log("     o - " + JSON.stringify(result));
            console.log('     o Db.createCollection() Create table: ' + colName + "    " + stmt + "   " + JSON.stringify(result));
            col._created = true;
            return col;
        } catch (e) {
            console.error("Error create table: " + colName + '  ' + e);
            throw e;
        }
    }
}


/*
Methods collection must implement:
'find',
'findOne',
'updateMany',
'updateOne',
'replaceOne',
'count',
'distinct',
'findOneAndDelete',
'findOneAndUpdate',
'aggregate',
'findCursor',
'deleteOne',
'deleteMany',
'nosqlQuery'
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
    
    async insertOne(obj, saveOptions) {
        console.log("    o insertOne " + this.colName + " : " + JSON.stringify(obj));
        
        let kvid = "" + obj._id;
        let row = { kvid: kvid };
        row['kvjson'] = OrcoosCollection._fixTypesBeforeInsert(obj);
        try {
            let r = await this.db.client.put(this.colName, row);
            console.log('    o insertOne: ' + JSON.stringify(r.success));
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
        console.log("    o findOne " + this.colName + " cond: " + JSON.stringify(conditions) + 
        " o: " + JSON.stringify(findOptions));
        
        if (conditions._id) {
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
        console.log("      o Q: " + stmt);
        
        for await (const b of this.db.client.queryIterable(stmt)) {
            if (b && b.rows && b.rows.length > 0)
            return OrcoosCollection._fixTypesAfterRead(b.rows[0].kvjson);
        }
        
        return null;
    }
    
    deleteOne(where, options) {
        console.log("    o findOne " + this.colName + " where: " + JSON.stringify(where) + 
        " o: " + JSON.stringify(options));
        
        if (where._id) {
            return this.db.client.delete(this.colName, {kvid: where._id.toString()})
            .then((r, e) => r.success);
        }
        throw new Error("deleteOne() 'where' param must contain _id field.");
    }
    
    // todo cezar: generate queries with bind vars, prepare, cache prepared, bind vars and execute
    async _queryPromise(client, stmt, maxLimit = 200) {
        return new Promise( async function (resolve, reject) {
            try {
                let gen = client.queryIterable(stmt);
                let rows = [];
                let count = 0;
                for await (const b of gen) {
                    //console.log('    o - add more ' + b.rows.length);
                    if (count + b.rows.length > maxLimit) {
                        reject("Query results more than maxLimit: " + (count + b.rows.length));
                    }
                    rows.push(b.rows.map(r => OrcoosCollection._fixTypesAfterRead(r)));
                    count += b.rows.length;
                }
                //console.log('    o - done ' + rows.length);
                resolve([].concat(...rows));
            } catch(err) {
                reject("Error executing query: " + err);
            }
        });
    }
    
    async deleteMany(filter, options) {
        console.log("    o deleteMany " + this.colName + " : " + JSON.stringify(filter) + ", " + JSON.stringify(options));
        let where = this._computeWhere(filter);
        let stmt = 'DELETE FROM ' + this.colName + ' t' + where;
        // works
        // const r = await this._queryPromise(this.db.client, stmt);
        // return { result: { n: r[0].numRowsDeleted } };
        
        // let client = this.db.client;
        // return new Promise( async function(resolve, reject) {  
        //   try {               
        //       console.log("      o Q: " + stmt);
        //       let qp = client.queryIterable(stmt, {});
        
        //       for await (let b of qp) {
        //           if (b.rows.length > 0) {
        //               // console.log('    o - deleteMany resolved to: ' + (b.rows[0]['numRowsDeleted']));
        //               resolve(b.rows[0]['numRowsDeleted']);
        //           }
        //       }
        //       reject("Error: no response from deleteMany query.");
        //   } catch(error) {
        //       reject("Error: deleteMany query: " + error);
        //   }
        // });
        
        let client = this.db.client; 
        try {               
            console.log("      o Q: " + stmt);
            let qp = client.queryIterable(stmt, {});
            
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
    
    count(filter, options) {
        console.log("    o count " + this.colName + " : " + JSON.stringify(filter) + ", " + JSON.stringify(options));
        
        let where = this._computeWhere(filter);
        let stmt = 'SELECT count(*) FROM ' + this.colName + ' t' + where;
        let client = this.db.client;
        
        return new Promise( async function(resolve, reject) {  
            try {               
                console.log("      o count Q: " + stmt);
                let qp = client.queryIterable(stmt, {});
                
                for await (let b of qp) {
                    if (b.rows.length > 0) {
                        //console.log('    o - count resolved to: ' + (b.rows[0]['Column_1']));
                        resolve(b.rows[0]['Column_1']);
                    }
                }
                reject("Error: no response from count query.");
            } catch(error) {
                reject("Error: count query: " + error);
            }
        });
    }
    
    async updateOne(filter, update, options) {
        // https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/#mongodb-method-db.collection.updateOne
        console.log("    o updateOne " + this.colName + " filter: " + JSON.stringify(filter) + 
        " update: " + JSON.stringify(update) + 
        " options: " + JSON.stringify(options));
        
        if (filter && filter._id) {
            let r = await this.db.client.get(this.colName, { kvid: ("" + filter._id) });
            if (r && r.row) {
                let modifiedCount = 0;
                // row from DB in r.row
                // update r.row
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
                
                // todo: These should be done atomically on the server with an UPDATE query
                for (let key in update) {
                    if (key == "$set" && update[key] instanceof Object) {
                        for (let setKey in update[key]) {
                            r.row.kvjson[setKey] = update[key][setKey];
                            modifiedCount++;
                        }
                    } else if (key == "$unset" && update[key] instanceof Object) {
                        for (let setKey in update[key]) {
                            delete r.row.kvjson[setKey];
                            modifiedCount++;
                        }
                    } else if (key == "$currentDate" && update[key] instanceof Object) {
                        for (let setKey in update[key]) {
                            r.row.kvjson[setKey] = Date.now().toISOString();
                            modifiedCount++;
                        }
                    } else if (key == "$inc" && update[key] instanceof Object) {
                        for (let setKey in update[key]) {
                            r.row.kvjson[setKey] += update[key][setKey];
                            modifiedCount++;
                        }
                    } else if (key == "$min" && update[key] instanceof Object) {
                        for (let setKey in update[key]) {
                            if (update[key][setKey] < r.row.kvjson[setKey] ) {
                                r.row.kvjson[setKey] = update[key][setKey];
                                modifiedCount++;
                            }
                        }
                    } else if (key == "$max" && update[key] instanceof Object) {
                        for (let setKey in update[key]) {
                            if (update[key][setKey] > r.row.kvjson[setKey]) {
                                r.row.kvjson[setKey] = update[key][setKey];
                                modifiedCount++;
                            }
                        }
                    } else if (key == "$mul" && update[key] instanceof Object) {
                        for (let setKey in update[key]) {
                            r.row.kvjson[setKey] *= update[key][setKey];
                            modifiedCount++;
                        }
                    } else if (key == "$rename" && update[key] instanceof Object) {
                        for (let setKey in update[key]) {
                            let val = r.row.kvjson[setKey];
                            delete r.row.kvjson[setKey];
                            r.row.kvjson[update[key][setKey]] = val;
                            modifiedCount++;
                        }
                    } else {
                        throw new Error("Operator '" + key + "' not implemented.");
                    }
                }
                
                let putRes = await this.db.client.put(this.colName, r.row);
                return {
                    matchedCount: 1,
                    modifiedCount: modifiedCount,                    
                    upsertedId: r.row.kvid,
                    acknoledged: putRes.success};
            } else {
                // row doesn't exist
                return null;
            }
        } else {
            // doesn't contain _id
            throw new Error("updateOne() filter param doesn't contain _id field.");
        }
    }
    
    async updateMany(filter, update, options) {
        // https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/#mongodb-method-db.collection.updateOne
        console.log("    o updateMany " + this.colName + " filter: " + JSON.stringify(filter) + 
        " update: " + JSON.stringify(update) + 
        " options: " + JSON.stringify(options));

        if (!filter || !filter._id) {
            throw new Error("updateMany() filter param doesn't contain _id field.");
        }

        let updateClause = this._computeUpdateClause(update);
        let where = this._computeWhere(filter);
        let stmt = 'UPDATE ' + this.colName + ' AS t ' + updateClause + where;
        console.log("      o Q: " + stmt);
        
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
                    updateClause += ', SET ' + this._computeDbProp(setKey) + ' = ' + this._computeLiteral(update[key][setKey]);
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
                    updateClause += ', PUT ' + this._computeDbProp(update[key][setKey]) + ' ' + this._computeDbProp(setKey);
                    updateClause += ', REMOVE ' + this._computeDbProp(setKey);
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
        console.log("    o findOneAndDelete " + this.colName + " filter: " + JSON.stringify(filter) + 
        " o: " + JSON.stringify(options));
        
        if (filter && filter._id) {
            let where = this._computeWhere(filter);
            let stmt = 'DELETE FROM ' + this.colName + ' t' + where + " RETURNING *";
            console.log("      o Q: " + stmt);
            
            const r = await this._queryPromise(this.db.client, stmt);
            return {value: (r && r[0] ? r[0].kvjson : null)};
            //return new OrcoosFindCursor(this.db.client.queryIterable(stmt));
        }
        throw new Error("findOneAndDelete() filter param doesn't contain _id field.");
    }
    
    async findOneAndUpdate(filter, update, options) {
        console.log("    o findOneAndUpdate " + this.colName + " filter: " + JSON.stringify(filter) + 
        " update: " + JSON.stringify(update) + " o: " + JSON.stringify(options));
        
        if (filter && filter._id) {
            let where = this._computeWhere(filter);
            let updateClause = this._computeUpdateClause(update);
            let stmt = 'UPDATE ' + this.colName + ' AS t ' + updateClause + where + " RETURNING *";
            console.log("      o Q: " + stmt);
            
            const r = await this._queryPromise(this.db.client, stmt);
            return {value: (r && r[0] ? r[0].kvjson : null)};
            //return new OrcoosFindCursor(this.db.client.queryIterable(stmt));
        }
        throw new Error("findOneAndDelete() filter param doesn't contain _id field.");
    }
    
    // todo
    distinct(field, query, options) {
        console.log("    o distinct " + this.colName + " fied: " + JSON.stringify(field) + 
        " q: " + JSON.stringify(query) + " o: " + JSON.stringify(options));
        
        throw new Error("distinct not implemented");
    }
    
    replaceOne(filter, replacement, options) {
        console.log("    o replaceOne " + this.colName + " filter: " + JSON.stringify(filter) + 
        " replcmt: " + JSON.stringify(replacement) + " o: " + JSON.stringify(options));
        
        if (!filter || !filter._id) {
            throw new Error("replaceOne() filter param doesn't contain _id field.");
        }
        
        let kvid = "" + filter._id;
        let row = { kvid: kvid, kvjson: replacement };
        row.kvjson._id = kvid;
        return this.db.client.putIfPresent(this.colName, row)
        .then((r) => {
            //console.log('    o > putIfPresent: ' + JSON.stringify(r.success));
            let mc = r.success ? 1 : 0;
            return { acknoledged: r.success, upsertedId: filter._id, matchedCount: mc, modifiedCount: mc};
        });
    }
    
    // todo Can we do anything here?
    aggregate(pipeline, options) {
        console.log("    o aggregate " + this.colName + " pipeline: " + JSON.stringify(pipeline) + 
        " o: " + JSON.stringify(options));
        
        throw new Error("aggregate() not implemented");
    }
    
    nosqlQuery(statement) {
        console.log("    o nosqlQuery stmt: " + statement);
        return new OrcoosFindCursor(this.db.client.queryIterable(statement));
    }
    
    find(filter, options) {
        console.log("    o find " + this.colName + " : " + JSON.stringify(filter) + ", " + JSON.stringify(options));
        let projection = "*"; //todo
        let where = this._computeWhere(filter);
        let stmt = 'SELECT ' + projection + ' FROM ' + this.colName + ' t' + where;
        console.log("      o Q: " + stmt);
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
        
        if (query._id && (typeof query._id === "string" || query._id instanceof String || 
        query._id instanceof ObjectId)) {
            return ' WHERE (t.kvid = ' + JSON.stringify(query._id) + ')';
        } else {
            let cond = this._computeCompExp(query);
            if (cond == "") {
                return "";
            }
            return ' WHERE ' + cond;
        }
    }
    
    _computeCompExp(compObj) {
        if (!compObj || !(compObj instanceof Object)) {
            console.log('o Error: Unexpected input value for a comparison expression: ' + JSON.stringify(compObj));
            throw Error('Unexpected input value for a comparison expression: ' + JSON.stringify(compObj));
        }
        let res = '';
        for (const prop in compObj) {
            let propValue = compObj[prop];
            if (res !== '') {
                res += ' AND ';
            }
            if (this._isEmptyObject(propValue)) {
                res += 'true'; //not sure what {} means
            } else if (propValue instanceof Array) {
                if (prop == "$or") {
                    res += '(';
                    for (let i = 0; i < propValue.length; i++) {
                        if (i > 0) {
                            res += ' OR ';
                        }
                        res += this._computeCompExp(propValue[i]);
                    }
                    res += ')';
                } else {
                    console.log('o Error: Unexpected array value for a comparison expression: ' + JSON.stringify(compObj));
                    throw Error('Unexpected array value for a comparison expression: ' + JSON.stringify(compObj));
                }
            } else if (propValue instanceof Object && Object.keys(propValue).length > 0) {
                let firstProp = Object.keys(propValue)[0];
                switch (firstProp) {
                case "$gt":
                    res += '(t.kvjson."' + prop + '" > ' + this._computeLiteral(propValue[firstProp]) + ')';
                    break;
                case "$gte":
                    res += '(' + this._computeDbProp(prop) + ' >= ' + this._computeLiteral(propValue[firstProp]) + ')';
                    break;
                case "$lt":
                    res += '(t.kvjson."' + prop + '" < ' + this._computeLiteral(propValue[firstProp]) + ')';
                    break;
                case "$lte":
                    res += '(t.kvjson."' + prop + '" <= ' + this._computeLiteral(propValue[firstProp]) + ')';
                    break;
                case "$ne":
                    res += '(t.kvjson."' + prop + '" != ' + this._computeLiteral(propValue[firstProp]) + ')';
                    break;
                case "$exists":
                    res += '(' + (propValue[firstProp] == false ? 'NOT ' : '') + 'EXISTS t.kvjson."' + prop +'")';
                    break;
                case"$regex":
                    if (propValue[firstProp] instanceof Object &&
                        propValue[firstProp]['$regex'] && 
                        propValue[firstProp]['$options'] && propValue[firstProp]['$options'] == 'i') {
                        res += '( contains(t.kvid."' + prop + '", ' + JSON.stringify(propValue[firstProp]['$regex']) + ') )';
                    } else if (propValue.$regex instanceof String || 
                        typeof propValue.$regex === "string") {
                            res += '( contains(' + this._computeDbProp(prop) + ', ' + JSON.stringify(propValue.$regex) + ') )';
                    } else {
                        console.log('o Error: Unexpected regex value for a comparison expression: ' + JSON.stringify(propValue));
                        throw Error('Unexpected regex value for a comparison expression: ' + JSON.stringify(propValue));
                    }
                    break;
                case "$in":
                case "$nin":
                    if (propValue[firstProp] instanceof Array && propValue[firstProp].length > 0) {
                        let kvProp = (prop == '_id' ? 't.kvid' : 't.kvjson."' + prop + '"');
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
                                res += '(' + kvProp + inRes + ' OR EXISTS (' + kvProp + '[$element' + inRes + '])';
                            }
                            if (containsNull) {
                                res += ' OR NOT EXISTS ' + kvProp;
                            }
                        } else {
                            if (inValCount > 0) {
                                res += ' NOT (' + kvProp + inRes + ' OR EXISTS (' + kvProp + '[$element' + inRes + '])';
                            }
                            if (containsNull) {
                                res += ' OR EXISTS ' + kvProp;
                            }
                        }
                        res += ')';
                    } else {
                        // skip if this case: $in: []
                    }
                    break;
                case "$or":
                    res += '(';
                    for (let i = 0; i < propValue['$or'].length; i++) {
                        if (i > 0) {
                            res += ' OR ';
                        }
                        res += this._computeCompExp(propValue['$or'][i]);
                    }
                    res += ')';
                    break;
                case "$and": // not sure if this exists
                    res += '(';
                    for (let i = 0; i < propValue['$and'].length; i++) {
                        if (i > 0) {
                            res += ' AND ';
                        }
                        res += this._computeCompExp(propValue['$and'][i]);
                    }
                    res += ')';
                    break;
                case "$size":
                    res += '( size([' + this._computeDbProp(prop) + ']) = ' + propValue['$size'] + ' )'; 
                    break;
                default:
                    console.log('o Error: Unexpected property value for a comparison expression: ' + JSON.stringify(propValue));
                    throw Error('Unexpected property value for a comparison expression: ' + JSON.stringify(propValue));
                }
            } else if (propValue instanceof String || typeof propValue === "string" || 
            propValue instanceof Date || 
            propValue instanceof Number || typeof propValue === 'number' ||
            propValue instanceof ObjectId) {
                if (prop == '_id') {
                    res += '(t.kvid = ' + this._computeLiteral(propValue) + ')';
                } else {
                    let trProp = prop.split('.').map(p => '"' + p + '"[]').join('.');
                    res += '(t.kvjson.' + trProp + ' =any ' + this._computeLiteral(propValue) + ')';
                }
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
            let trProp = prop.split('.').map(p => '"' + p + '"[]').join('.');
            return 't.kvjson.' + trProp;
        }
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
        console.log("   o insertMany " + this.colName + " : ");// + JSON.stringify(objects));
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
}

class OrcoosFindCursor {
    constructor(gen) {
        this.gen = gen;
        this.maxLimit = 200;
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

function interceptMethodCalls(obj, fn) {
    return new Proxy(obj, {
        get(target, prop) { // (A)
            if (typeof target[prop] === 'function') {
                return new Proxy(target[prop], {
                    apply: (target, thisArg, argumentsList) => { // (B)
                        fn(prop, argumentsList);
                        return Reflect.apply(target, thisArg, argumentsList);
                    }
                });
            } else {
                return Reflect.get(target, prop);
            }
        }
    });
}
//exports.interceptMethodCalls = interceptMethodCalls;
const _OrcoosClient = OrcoosClient;
export { _OrcoosClient as OrcoosClient };
//exports.OrcoosDb = OrcoosDb;
const _OrcoosCollection = OrcoosCollection;
export { _OrcoosCollection as OrcoosCollection };