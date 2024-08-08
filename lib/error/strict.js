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


class StrictModeError extends MongooseError {
  /**
   * Strict mode error constructor
   *
   * @param {String} path
   * @param {String} [msg]
   * @param {Boolean} [immutable]
   * @inherits MongooseError
   * @api private
   */
  constructor(path, msg, immutable) {
    msg = msg || 'Field `' + path + '` is not in schema and strict ' +
      'mode is set to throw.';
    super(msg);
    this.isImmutableError = !!immutable;
    this.path = path;
  }
}

Object.defineProperty(StrictModeError.prototype, 'name', {
  value: 'StrictModeError'
});

module.exports = StrictModeError;
