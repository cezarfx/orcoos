declare class NativeError extends global.Error { }

declare module 'ondbmongoose' {
  //import mongodb = require('mongodb');
  import nosqldb = require('oracle-nosqldb');


  type CastError = Error.CastError;
  type SyncIndexesError = Error.SyncIndexesError;

  class OrcoosError extends global.Error {
    constructor(msg: string);

    /** The type of error. "OrcoosError" for generic errors. */
    name: string;

    static messages: any;

    static Messages: any;
  }

  class Error extends OrcoosError { }

  namespace Error {

    export class CastError extends OrcoosError {
      name: 'CastError';
      stringValue: string;
      kind: string;
      value: any;
      path: string;
      reason?: NativeError | null;
      model?: any;

      constructor(type: string, value: any, path: string, reason?: NativeError, schemaType?: SchemaType);
    }
    export class SyncIndexesError extends OrcoosError {
      name: 'SyncIndexesError';
      errors?: Record<string, nosqldb.NoSQLError>;

      constructor(type: string, value: any, path: string, reason?: NativeError, schemaType?: SchemaType);
    }

    export class DivergentArrayError extends OrcoosError {
      name: 'DivergentArrayError';
    }

    export class MissingSchemaError extends OrcoosError {
      name: 'MissingSchemaError';
    }

    export class DocumentNotFoundError extends OrcoosError {
      name: 'DocumentNotFoundError';
      result: any;
      numAffected: number;
      filter: any;
      query: any;
    }

    export class ObjectExpectedError extends OrcoosError {
      name: 'ObjectExpectedError';
      path: string;
    }

    export class ObjectParameterError extends OrcoosError {
      name: 'ObjectParameterError';
    }

    export class OverwriteModelError extends OrcoosError {
      name: 'OverwriteModelError';
    }

    export class ParallelSaveError extends OrcoosError {
      name: 'ParallelSaveError';
    }

    export class ParallelValidateError extends OrcoosError {
      name: 'ParallelValidateError';
    }

    export class MongooseServerSelectionError extends OrcoosError {
      name: 'MongooseServerSelectionError';
    }

    export class StrictModeError extends OrcoosError {
      name: 'StrictModeError';
      isImmutableError: boolean;
      path: string;
    }

    export class ValidationError extends OrcoosError {
      name: 'ValidationError';

      errors: { [path: string]: ValidatorError | CastError };
      addError: (path: string, error: ValidatorError | CastError) => void;

      constructor(instance?: OrcoosError);
    }

    export class ValidatorError extends OrcoosError {
      name: 'ValidatorError';
      properties: {
        message: string,
        type?: string,
        path?: string,
        value?: any,
        reason?: any
      };
      kind: string;
      path: string;
      value: any;
      reason?: OrcoosError | null;

      constructor(properties: {
        message?: string,
        type?: string,
        path?: string,
        value?: any,
        reason?: any
      });
    }

    export class VersionError extends OrcoosError {
      name: 'VersionError';
      version: number;
      modifiedPaths: Array<string>;

      constructor(doc: Document, currentVersion: number, modifiedPaths: Array<string>);
    }

    export class StrictPopulateError extends OrcoosError {
      name: 'StrictPopulateError';
      path: string;
    }
  }
}
