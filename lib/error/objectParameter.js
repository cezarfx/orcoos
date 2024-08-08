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

class ObjectParameterError extends MongooseError {
  /**
   * Constructor for errors that happen when a parameter that's expected to be
   * an object isn't an object
   *
   * @param {Any} value
   * @param {String} paramName
   * @param {String} fnName
   * @api private
   */
  constructor(value, paramName, fnName) {
    super('Parameter "' + paramName + '" to ' + fnName +
      '() must be an object, got ' + value.toString());
  }
}


Object.defineProperty(ObjectParameterError.prototype, 'name', {
  value: 'ObjectParameterError'
});

module.exports = ObjectParameterError;
