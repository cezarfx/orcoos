/**
 * Export lib/orcoos
 *
 */

'use strict';

const orcoos = require('./lib/');

module.exports = orcoos;
module.exports.default = orcoos;
module.exports.orcoos = orcoos;

// Re-export for ESM support
module.exports.cast = orcoos.cast;
module.exports.STATES = orcoos.STATES;
module.exports.setDriver = orcoos.setDriver;
module.exports.set = orcoos.set;
module.exports.get = orcoos.get;
module.exports.createConnection = orcoos.createConnection;
module.exports.connect = orcoos.connect;
module.exports.disconnect = orcoos.disconnect;
module.exports.startSession = orcoos.startSession;
module.exports.pluralize = orcoos.pluralize;
module.exports.model = orcoos.model;
module.exports.deleteModel = orcoos.deleteModel;
module.exports.modelNames = orcoos.modelNames;
module.exports.plugin = orcoos.plugin;
module.exports.connections = orcoos.connections;
module.exports.version = orcoos.version;
module.exports.Orcoos = orcoos.Orcoos;
module.exports.Schema = orcoos.Schema;
module.exports.SchemaType = orcoos.SchemaType;
module.exports.SchemaTypes = orcoos.SchemaTypes;
module.exports.VirtualType = orcoos.VirtualType;
module.exports.Types = orcoos.Types;
module.exports.Query = orcoos.Query;
module.exports.Model = orcoos.Model;
module.exports.Document = orcoos.Document;
module.exports.ObjectId = orcoos.ObjectId;
module.exports.isValidObjectId = orcoos.isValidObjectId;
module.exports.isObjectIdOrHexString = orcoos.isObjectIdOrHexString;
module.exports.syncIndexes = orcoos.syncIndexes;
module.exports.Decimal128 = orcoos.Decimal128;
module.exports.Mixed = orcoos.Mixed;
module.exports.Date = orcoos.Date;
module.exports.Number = orcoos.Number;
module.exports.Error = orcoos.Error;
module.exports.now = orcoos.now;
module.exports.CastError = orcoos.CastError;
module.exports.SchemaTypeOptions = orcoos.SchemaTypeOptions;
module.exports.mongo = orcoos.mongo;
module.exports.mquery = orcoos.mquery;
module.exports.sanitizeFilter = orcoos.sanitizeFilter;
module.exports.trusted = orcoos.trusted;
module.exports.skipMiddlewareFunction = orcoos.skipMiddlewareFunction;
module.exports.overwriteMiddlewareResult = orcoos.overwriteMiddlewareResult;

// The following properties are not exported using ESM because `setDriver()` can mutate these
// module.exports.connection = orcoos.connection;
// module.exports.Collection = orcoos.Collection;
// module.exports.Connection = orcoos.Connection;
