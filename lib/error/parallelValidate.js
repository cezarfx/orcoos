/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/*!
 * Module dependencies.
 */

const MongooseError = require('./mongooseError');


class ParallelValidateError extends MongooseError {
  /**
   * ParallelValidate Error constructor.
   *
   * @param {Document} doc
   * @api private
   */
  constructor(doc) {
    const msg = 'Can\'t validate() the same doc multiple times in parallel. Document: ';
    super(msg + doc._id);
  }
}

Object.defineProperty(ParallelValidateError.prototype, 'name', {
  value: 'ParallelValidateError'
});

/*!
 * exports
 */

module.exports = ParallelValidateError;
