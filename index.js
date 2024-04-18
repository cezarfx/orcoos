/**
 * Export lib/orcoos
 *
 */

'use strict';

//import orcoos, { cast, STATES, setDriver, set, get, createConnection, connect, disconnect, startSession, pluralize, model, deleteModel, modelNames, plugin, connections, version, Orcoos, Schema, SchemaType, SchemaTypes, VirtualType, Types, Query, Model, Document, ObjectId, isValidObjectId, isObjectIdOrHexString, syncIndexes, Decimal128, Mixed, Date, Number, Error, now, CastError, SchemaTypeOptions, mongo, mquery, sanitizeFilter, trusted, skipMiddlewareFunction, overwriteMiddlewareResult } from './lib';
//export default orcoos;
// // Re-export for ESM support
// export const cast = cast;
// export const STATES = STATES;
// export const setDriver = setDriver;
// export const set = set;
// export const get = get;
// export const createConnection = createConnection;
// export const connect = connect;
// export const disconnect = disconnect;
// export const startSession = startSession;
// export const pluralize = pluralize;
// export const model = model;
// export const deleteModel = deleteModel;
// export const modelNames = modelNames;
// export const plugin = plugin;
// export const connections = connections;
// export const version = version;
// export const Orcoos = Orcoos;
// export const Schema = Schema;
// export const SchemaType = SchemaType;
// export const SchemaTypes = SchemaTypes;
// export const VirtualType = VirtualType;
// export const Types = Types;
// export const Query = Query;
// export const Model = Model;
// export const Document = Document;
// export const ObjectId = ObjectId;
// export const isValidObjectId = isValidObjectId;
// export const isObjectIdOrHexString = isObjectIdOrHexString;
// export const syncIndexes = syncIndexes;
// export const Decimal128 = Decimal128;
// export const Mixed = Mixed;
// export const Date = Date;
// export const Number = Number;
// export const Error = Error;
// export const now = now;
// export const CastError = CastError;
// export const SchemaTypeOptions = SchemaTypeOptions;
// export const mongo = mongo;
// export const mquery = mquery;
// export const sanitizeFilter = sanitizeFilter;
// export const trusted = trusted;
// export const skipMiddlewareFunction = skipMiddlewareFunction;
// export const overwriteMiddlewareResult = overwriteMiddlewareResult;

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

module.exports.NoSQLConnectionString = orcoos.NoSQLConnectionString;

// The following properties are not exported using ESM because `setDriver()` can mutate these
// module.exports.connection = orcoos.connection;
// module.exports.Collection = orcoos.Collection;
// module.exports.Connection = orcoos.Connection;
