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


class OverwriteModelError extends MongooseError {
  /**
   * OverwriteModel Error constructor.
   * @param {String} name
   * @api private
   */
  constructor(name) {
    super('Cannot overwrite `' + name + '` model once compiled.');
  }
}

Object.defineProperty(OverwriteModelError.prototype, 'name', {
  value: 'OverwriteModelError'
});

/*!
 * exports
 */

module.exports = OverwriteModelError;
