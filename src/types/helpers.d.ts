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
  import mongodb = require('mongodb');

  /**
   * Mongoose uses this function to get the current time when setting
   * [timestamps](/docs/guide.html#timestamps). You may stub out this function
   * using a tool like [Sinon](https://www.npmjs.com/package/sinon) for testing.
   */
  function now(): NativeDate;

  /**
   * Tells `sanitizeFilter()` to skip the given object when filtering out potential query selector injection attacks.
   * Use this method when you have a known query selector that you want to use.
   */
  function trusted<T>(obj: T): T;

  /**
   * Returns true if the given value is a Mongoose ObjectId (using `instanceof`) or if the
   * given value is a 24 character hex string, which is the most commonly used string representation
   * of an ObjectId.
   */
  function isObjectIdOrHexString(v: mongodb.ObjectId): true;
  function isObjectIdOrHexString(v: mongodb.ObjectId | string): boolean;
  function isObjectIdOrHexString(v: any): false;

  /**
   * Returns true if Mongoose can cast the given value to an ObjectId, or
   * false otherwise.
   */
  function isValidObjectId(v: mongodb.ObjectId | Types.ObjectId): true;
  function isValidObjectId(v: any): boolean;
}
