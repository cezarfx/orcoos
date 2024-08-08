/*-
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

declare module 'ondbmongoose' {

  type MongooseDocumentMiddleware = 'validate' | 'save' | 'remove' | 'updateOne' | 'deleteOne' | 'init';
  type MongooseQueryMiddleware = 'count' | 'estimatedDocumentCount' | 'countDocuments' | 'deleteMany' | 'deleteOne' | 'distinct' | 'find' | 'findOne' | 'findOneAndDelete' | 'findOneAndRemove' | 'findOneAndReplace' | 'findOneAndUpdate' | 'remove' | 'replaceOne' | 'update' | 'updateOne' | 'updateMany';
  type DocumentOrQueryMiddleware = 'updateOne' | 'deleteOne' | 'remove';

  type MiddlewareOptions = {
    /**
      * Enable this Hook for the Document Methods
      * @default true
      */
    document?: boolean,
    /**
      * Enable this Hook for the Query Methods
      * @default true
      */
    query?: boolean,
    /**
      * Explicitly set this function to be a Error handler instead of based on how many arguments are used
      * @default false
      */
    errorHandler?: boolean
  };
  type SchemaPreOptions = MiddlewareOptions;
  type SchemaPostOptions = MiddlewareOptions;

  type PreMiddlewareFunction<ThisType = any> = (this: ThisType, next: CallbackWithoutResultAndOptionalError) => void | Promise<void>;
  type PreSaveMiddlewareFunction<ThisType = any> = (this: ThisType, next: CallbackWithoutResultAndOptionalError, opts: SaveOptions) => void | Promise<void>;
  type PostMiddlewareFunction<ThisType = any, ResType = any> = (this: ThisType, res: ResType, next: CallbackWithoutResultAndOptionalError) => void | Promise<void>;
  type ErrorHandlingMiddlewareFunction<ThisType = any, ResType = any> = (this: ThisType, err: NativeError, res: ResType, next: CallbackWithoutResultAndOptionalError) => void;
  type ErrorHandlingMiddlewareWithOption<ThisType = any, ResType = any> = (this: ThisType, err: NativeError, res: ResType | null, next: CallbackWithoutResultAndOptionalError) => void | Promise<void>;
}
