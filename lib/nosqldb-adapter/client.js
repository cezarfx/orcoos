const nosqldb = require('oracle-nosqldb');

class OrcoosClient {
    constructor(uri, options) {
        this.uri = uri;
        this.options = options;
        this.client = new nosqldb.NoSQLClient({
            serviceType: nosqldb.ServiceType.KVSTORE,
            endpoint: uri
        });

        // this.client.listTables().then( (r) => {
        //   console.log("NoSQL tables:");
        //   r.tables.forEach(console.log)
        // });
        return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosClient." + m + "(" + JSON.stringify(args) + ")"));
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
        return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosDb." + m + "(" + JSON.stringify(args) + ")"));
    }

    collection(colName) {
        //console.log('   o collection:' + colName);
        let col = this._collections[colName];
        if (!col) {
            col = new OrcoosCollection(this, colName);
            this._collections[colName] = col;
        }
        return col;
    }

    createCollection(colName, options) {
        let stmt = 'CREATE TABLE IF NOT EXISTS ' + colName + '(kvid STRING, kvjson JSON, PRIMARY KEY(kvid))';
        let result = this.client.tableDDL(stmt,
            {
                complete: true,
                tableLimits: {
                    readUnits: 20,
                    writeUnits: 10,
                    storageGB: 1
                }
            });
        //console.log("     - " + JSON.stringify(result));
        console.log('     o Create table: ' + colName + "    " + stmt + "   " + JSON.stringify(result));
        return new OrcoosCollection(this, colName);
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

        return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosCollection." + m + "(" + JSON.stringify(args) + ")"));
    }

    insertOne(obj, saveOptions) {
        //console.log("    o insertOne " + this.colName + " : " + JSON.stringify(obj));

        let kvid = "" + obj._id;
        let row = { kvid: kvid, kvjson: obj };
        row.kvjson._id = kvid;
        return this.db.client.put(this.colName, row)
            .then((r) => {
                //console.log('    > insertOne: ' + JSON.stringify(r.success));
                return { acknoledged: r.success, insertedId: kvid };
            });
    }

    findOne(conditions, findOptions) {
        //console.log("    o findOne " + this.colName + " : " + JSON.stringify(conditions));

        if (conditions._id) {
            return this.db.client.get(this.colName, { kvid: ("" + conditions._id) })
                .then((r) => {
                    //console.log('    > findOne: ' + JSON.stringify(r));
                    if (r && r.row) {
                        return r.row.kvjson;
                    } else {
                        return null;
                    }
                });
        }
        throw new Error("NYI");
    }

    deleteOne(where, options) {
        if (where._id) {
            return this.db.client.delete(this.colName, {kvid: "" + where._id})
                .then((r, e) => r.success);
        }
        throw new Error("NYI");
    }
    
    nosqlQuery(statement) {
      console.log("    o nosqlQuery stmt: " + statement);
      return new OrcoosFindCursor(this.db.client.queryIterable(stmt));
    }

    find(filter, options) {
      //console.log("    o find " + this.colName + " : " + JSON.stringify(filter) + ", " + JSON.stringify(options));
      let where = this._computeWhere(filter);
      let stmt = 'SELECT * from ' + this.colName + ' t' + where;
      console.log("      Q: " + stmt);
      return new OrcoosFindCursor(this.db.client.queryIterable(stmt));
    }

    // findOne(filter, options) {
    //     //console.log("    o find " + this.colName + " : " + JSON.stringify(filter) + ", " + JSON.stringify(options));
    //     let where = this._computeWhere(filter);
    //     let stmt = 'SELECT * from ' + this.colName + ' t' + where + " LIMIT 1";
    //     console.log("      Q: " + stmt);
    //     return new OrcoosFindCursor(this.db.client.queryIterable(stmt));
    // }

    _computeWhere(query) {
        if (!query || this.isEmptyObject(query)) {
          return '';
        }
    
        if (!(query instanceof Object)) {
          console.log('Error: Unexpected input value for where expression: ' + JSON.stringify(query));
          throw Error('Unexpected input value for where expression: ' + JSON.stringify(query));
        }
    
        if (query._id && (typeof query._id === "string" || query._id instanceof String)) {
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
          console.log('Error: Unexpected input value for a comparison expression: ' + JSON.stringify(compObj));
          throw Error('Unexpected input value for a comparison expression: ' + JSON.stringify(compObj));
        }
        let res = '';
        for (const prop in compObj) {
          let propValue = compObj[prop];
          if (res !== '') {
            res += ' AND ';
          }
          if (this.isEmptyObject(propValue)) {
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
              console.log('Error: Unexpected array value for a comparison expression: ' + JSON.stringify(compObj));
              throw Error('Unexpected array value for a comparison expression: ' + JSON.stringify(compObj));
            }
          } else if (propValue instanceof Object && Object.keys(propValue).length > 0) {
            let firstProp = Object.keys(propValue)[0];
            switch (firstProp) {
              case "$gt":
                res += '(t.kvjson."' + prop + '" > ' + this._computeLiteral(propValue[firstProp]) + ')';
                break;
              case "$gte":
                res += '(t.kvjson."' + prop + '" >= ' + this._computeLiteral(propValue[firstProp]) + ')';
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
                if (firstProp && !firstProp.startsWith('$') && propValue[firstProp] instanceof Object &&
                    propValue[firstProp]['$regex'] && propValue[firstProp]['$options'] && propValue[firstProp]['$options'] == 'i') {
                  res += '( contains(t.kvid."' + prop + '", ' + JSON.stringify(propValue[firstProp]['$regex']) + ') )';
                } else {
                  console.log('Error: Unexpected regex value for a comparison expression: ' + JSON.stringify(propValue));
                  throw Error('Unexpected regex value for a comparison expression: ' + JSON.stringify(propValue));
                }
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
              default:
                console.log('Error: Unexpected property value for a comparison expression: ' + JSON.stringify(propValue));
                throw Error('Unexpected property value for a comparison expression: ' + JSON.stringify(propValue));
            }
          } else if (propValue instanceof String || typeof propValue === "string" || 
                propValue instanceof Date || 
                propValue instanceof Number || typeof propValue === 'number') {
            if (prop == '_id') {
              res += '(t.kvid = ' + this._computeLiteral(propValue) + ')';
            } else {
              res += '(t.kvjson."' + prop + '" = ' + this._computeLiteral(propValue) + ')';
            }
          }
        }
        if (res == "") {
          return "";
        }
        return '(' + res + ')';
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

    isEmptyObject(obj) {
        return obj && typeof obj === 'object' && 
            Object.keys(obj).length === 0 &&
            !(obj instanceof Date);
    }

    nosqlQuery(statement) {
        console.log("    o nosqlQuery stmt: " + statement);
        return new OrcoosFindCursor(this.db.client.queryIterable(statement));
    }
}

class OrcoosFindCursor {
    constructor(gen) {
        this.gen = gen;
        this.maxLimit = 200;
        return interceptMethodCalls(this, (m, args) => console.log("    _._ OrcoosFindCursor." + m + "(" + JSON.stringify(args) + ")"));
    }

    async toArray() {
        let rows = [];
        let count = 0;
        for await (const b of this.gen) {
            //console.log('    - add more ' + b.rows.length);
            if (count + b.rows.length > this.maxLimit) {
                reject("Query results more than maxLimit: " + (count + b.rows.length));
            }
            rows.push(b.rows.flatMap(r => r.kvjson));
            count += b.rows.length;
        }
        //console.log('    - done ' + rows.length);

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
exports.OrcoosClient = OrcoosClient;
exports.OrcoosCollection = OrcoosCollection;