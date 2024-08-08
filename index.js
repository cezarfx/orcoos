/*
 * Copyright (c) 2024 Oracle and/or its affiliates.  All rights reserved.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl/
 * 
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

/**
 * Export lib/ondbmongoose
 */

'use strict';

//import ondbmongoose, { cast, STATES, setDriver, set, get, createConnection, connect, disconnect, startSession, pluralize, model, deleteModel, modelNames, plugin, connections, version, Orcoos, Schema, SchemaType, SchemaTypes, VirtualType, Types, Query, Model, Document, ObjectId, isValidObjectId, isObjectIdOrHexString, syncIndexes, Decimal128, Mixed, Date, Number, Error, now, CastError, SchemaTypeOptions, mongo, mquery, sanitizeFilter, trusted, skipMiddlewareFunction, overwriteMiddlewareResult } from './lib';
//export default ondbmongoose;
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
module.exports.Orcoos = ondbmongoose.Orcoos;
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

// The following properties are not exported using ESM because `setDriver()` can mutate these
// module.exports.connection = ondbmongoose.connection;
// module.exports.Collection = ondbmongoose.Collection;
// module.exports.Connection = ondbmongoose.Connection;
