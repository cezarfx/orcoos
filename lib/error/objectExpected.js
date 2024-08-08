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


class ObjectExpectedError extends MongooseError {
  /**
   * Strict mode error constructor
   *
   * @param {string} type
   * @param {string} value
   * @api private
   */
  constructor(path, val) {
    const typeDescription = Array.isArray(val) ? 'array' : 'primitive value';
    super('Tried to set nested object field `' + path +
      `\` to ${typeDescription} \`` + val + '`');
    this.path = path;
  }
}

Object.defineProperty(ObjectExpectedError.prototype, 'name', {
  value: 'ObjectExpectedError'
});

module.exports = ObjectExpectedError;
