/**
 * Export lib/ondbmongoose
 */

'use strict';

const ondbmongoose = require('./lib/');

module.exports = ondbmongoose;
module.exports.default = ondbmongoose;
module.exports.ondbmongoose = ondbmongoose;

// Re-export for ESM support
module.exports.cast = ondbmongoose.cast;
module.exports.STATES = ondbmongoose.STATES;
module.exports.setDriver = ondbmongoose.setDriver;
module.exports.set = ondbmongoose.set;
module.exports.get = ondbmongoose.get;
module.exports.createConnection = ondbmongoose.createConnection;
module.exports.connect = ondbmongoose.connect;
module.exports.disconnect = ondbmongoose.disconnect;
module.exports.startSession = ondbmongoose.startSession;
module.exports.pluralize = ondbmongoose.pluralize;
module.exports.model = ondbmongoose.model;
module.exports.deleteModel = ondbmongoose.deleteModel;
module.exports.modelNames = ondbmongoose.modelNames;
module.exports.plugin = ondbmongoose.plugin;
module.exports.connections = ondbmongoose.connections;
module.exports.version = ondbmongoose.version;
module.exports.OndbMongoose = ondbmongoose.OndbMongoose;
module.exports.Schema = ondbmongoose.Schema;
module.exports.SchemaType = ondbmongoose.SchemaType;
module.exports.SchemaTypes = ondbmongoose.SchemaTypes;
module.exports.VirtualType = ondbmongoose.VirtualType;
module.exports.Types = ondbmongoose.Types;
module.exports.Query = ondbmongoose.Query;
module.exports.Model = ondbmongoose.Model;
module.exports.Document = ondbmongoose.Document;
module.exports.ObjectId = ondbmongoose.ObjectId;
module.exports.isValidObjectId = ondbmongoose.isValidObjectId;
module.exports.isObjectIdOrHexString = ondbmongoose.isObjectIdOrHexString;
module.exports.syncIndexes = ondbmongoose.syncIndexes;
module.exports.Decimal128 = ondbmongoose.Decimal128;
module.exports.Mixed = ondbmongoose.Mixed;
module.exports.Date = ondbmongoose.Date;
module.exports.Number = ondbmongoose.Number;
module.exports.Error = ondbmongoose.Error;
module.exports.now = ondbmongoose.now;
module.exports.CastError = ondbmongoose.CastError;
module.exports.SchemaTypeOptions = ondbmongoose.SchemaTypeOptions;
module.exports.mongo = ondbmongoose.mongo;
module.exports.mquery = ondbmongoose.mquery;
module.exports.sanitizeFilter = ondbmongoose.sanitizeFilter;
module.exports.trusted = ondbmongoose.trusted;
module.exports.skipMiddlewareFunction = ondbmongoose.skipMiddlewareFunction;
module.exports.overwriteMiddlewareResult = ondbmongoose.overwriteMiddlewareResult;

module.exports.NoSQLConnectionString = ondbmongoose.NoSQLConnectionString;
module.exports.LOG_LEVEL = ondbmongoose.LOG_LEVEL;

// The following properties are not exported using ESM because `setDriver()` can mutate these
// module.exports.connection = ondbmongoose.connection;
// module.exports.Collection = ondbmongoose.Collection;
// module.exports.Connection = ondbmongoose.Connection;
