// import orcoos, { cast, STATES, setDriver, set, get, createConnection, connect, disconnect, startSession, pluralize, model, deleteModel, modelNames, plugin, connections, version, Orcoos, Schema, SchemaType, SchemaTypes, VirtualType, Types, Query, Model, Document, ObjectId, isValidObjectId, isObjectIdOrHexString, syncIndexes, Decimal128, Mixed, Date, Number, Error, now, CastError, SchemaTypeOptions, mongo, mquery, sanitizeFilter, trusted, skipMiddlewareFunction, overwriteMiddlewareResult } from './src/types/index';
import orcoos from './src/types/index';

/**
 * The default export for Orcoos.
 */
export default orcoos;
// // Re-export for ESM support
// export const cast = cast;
// export const STATES = STATES;
// export const setDriver = setDriver;
// export const set = set;
// export const get = get;
export const createConnection = orcoos.createConnection;
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
export const connect = orcoos.connect;
/**
 * Disconnects from an Oracle NoSQL Database.
 */
export const disconnect = orcoos.disconnect;
// export const startSession = startSession;
// export const pluralize = pluralize;
export const model = orcoos.model;
// export const deleteModel = deleteModel;
// export const modelNames = modelNames;
// export const plugin = plugin;
// export const connections = connections;
export const version = orcoos.version;
export const Orcoos = orcoos.Orcoos;
export const Schema = orcoos.Schema;
// export const SchemaType = SchemaType;
// export const SchemaTypes = SchemaTypes;
// export const VirtualType = VirtualType;
// export const Types = Types;
// export const Query = Query;
export const Model = orcoos.Model;
export const Document = orcoos.Document;
export const ObjectId = orcoos.ObjectId;
// export const isValidObjectId = isValidObjectId;
// export const isObjectIdOrHexString = isObjectIdOrHexString;
// export const syncIndexes = syncIndexes;
export const Decimal128 = orcoos.Decimal128;
// export const Mixed = Mixed;
export const Date = orcoos.Date;
export const Number = orcoos.Number;
export const Error = orcoos.Error;
export const now = orcoos.now;
export const CastError = orcoos.CastError;
export const SchemaTypeOptions = orcoos.SchemaTypeOptions;
// export const mongo = mongo;
// export const mquery = mquery;
// export const sanitizeFilter = sanitizeFilter;
// export const trusted = trusted;
// export const skipMiddlewareFunction = skipMiddlewareFunction;
// export const overwriteMiddlewareResult = overwriteMiddlewareResult;

export const NoSQLConnectionString = orcoos.NoSQLConnectionString;
export const LOG_LEVEL = orcoos.LOG_LEVEL;