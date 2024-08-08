/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

/*!
 * Module dependencies.
 */

'use strict';

const MongooseError = require('.');


/**
 * If `eachAsync()` is called with `continueOnError: true`, there can be
 * multiple errors. This error class contains an `errors` property, which
 * contains an array of all errors that occurred in `eachAsync()`.
 *
 * @api private
 */

class EachAsyncMultiError extends MongooseError {
  /**
   * @param {String} connectionString
   */
  constructor(errors) {
    let preview = errors.map(e => e.message).join(', ');
    if (preview.length > 50) {
      preview = preview.slice(0, 50) + '...';
    }
    super(`eachAsync() finished with ${errors.length} errors: ${preview}`);

    this.errors = errors;
  }
}

Object.defineProperty(EachAsyncMultiError.prototype, 'name', {
  value: 'EachAsyncMultiError'
});

/*!
 * exports
 */

module.exports = EachAsyncMultiError;
