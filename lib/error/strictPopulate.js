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

class StrictPopulateError extends MongooseError {
  /**
   * Strict mode error constructor
   *
   * @param {String} path
   * @param {String} [msg]
   * @inherits MongooseError
   * @api private
   */
  constructor(path, msg) {
    msg = msg || 'Cannot populate path `' + path + '` because it is not in your schema. ' + 'Set the `strictPopulate` option to false to override.';
    super(msg);
    this.path = path;
  }
}

Object.defineProperty(StrictPopulateError.prototype, 'name', {
  value: 'StrictPopulateError'
});

module.exports = StrictPopulateError;
