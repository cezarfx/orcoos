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

// import ondbmongoose, { cast, STATES, setDriver, set, get, createConnection, connect, disconnect, startSession, pluralize, model, deleteModel, modelNames, plugin, connections, version, Orcoos, Schema, SchemaType, SchemaTypes, VirtualType, Types, Query, Model, Document, ObjectId, isValidObjectId, isObjectIdOrHexString, syncIndexes, Decimal128, Mixed, Date, Number, Error, now, CastError, SchemaTypeOptions, mongo, mquery, sanitizeFilter, trusted, skipMiddlewareFunction, overwriteMiddlewareResult } from './src/types/index';
import ondbmongoose from './src/types/index';

/**
 * The default export for OndbMongoose.
 */
export default ondbmongoose;
// // Re-export for ESM support
// export const cast = cast;
// export const STATES = STATES;
// export const setDriver = setDriver;
// export const set = set;
// export const get = get;
export const createConnection = ondbmongoose.createConnection;
/**
 * Connects to an Oracle NoSQL Database using a {@link ConnectionString} instance.
 * @param {ConnectionString} connectionString - The connection string to connect with.
 * @param {ConnectionOptions} [options] - The options to connect with.
 *   Note: other connection related options supported by Node SDK, this includes consistency, durability, timeout, etc. Note: the property names in the options are the ones defined in the Connection String. For ex: options.numberLib not dbNumber.
 *   Note: If options.* fields are defined they will override the respective options from Connection String.
 * @returns {Promise<Connection>} A promise that resolves to a {@link Connection} instance.
 * @example
 *   // Connect to a local instance of NoSQL DB cloudsim running on port 8081.
 *   await connect('nosqldb+cloud+http://cloudsim@127.0.0.1:8081/');
 * @example
 *   // Connect to a local instance of NoSQL DB on premises running on port 8082.
 *   await connect('nosqldb+on_prem+http://127.0.0.1:8082/');
 */
export const connect = ondbmongoose.connect;
/**
 * Disconnects from an Oracle NoSQL Database.
 */
export const disconnect = ondbmongoose.disconnect;
// export const startSession = startSession;
// export const pluralize = pluralize;
export const model = ondbmongoose.model;
// export const deleteModel = deleteModel;
// export const modelNames = modelNames;
// export const plugin = plugin;
// export const connections = connections;
export const version = ondbmongoose.version;
export const Orcoos = ondbmongoose.Orcoos;
export const Schema = ondbmongoose.Schema;
// export const SchemaType = SchemaType;
// export const SchemaTypes = SchemaTypes;
// export const VirtualType = VirtualType;
// export const Types = Types;
// export const Query = Query;
export const Model = ondbmongoose.Model;
export const Document = ondbmongoose.Document;
export const ObjectId = ondbmongoose.ObjectId;
// export const isValidObjectId = isValidObjectId;
// export const isObjectIdOrHexString = isObjectIdOrHexString;
// export const syncIndexes = syncIndexes;
export const Decimal128 = ondbmongoose.Decimal128;
// export const Mixed = Mixed;
export const Date = ondbmongoose.Date;
export const Number = ondbmongoose.Number;
export const Error = ondbmongoose.Error;
export const now = ondbmongoose.now;
export const CastError = ondbmongoose.CastError;
export const SchemaTypeOptions = ondbmongoose.SchemaTypeOptions;
// export const mongo = mongo;
// export const mquery = mquery;
// export const sanitizeFilter = sanitizeFilter;
// export const trusted = trusted;
// export const skipMiddlewareFunction = skipMiddlewareFunction;
// export const overwriteMiddlewareResult = overwriteMiddlewareResult;

export const NoSQLConnectionString = ondbmongoose.NoSQLConnectionString;
export const LOG_LEVEL = ondbmongoose.LOG_LEVEL;