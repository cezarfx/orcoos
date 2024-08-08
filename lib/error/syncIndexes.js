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

/**
 * SyncIndexes Error constructor.
 *
 * @param {String} message
 * @param {String} errorsMap
 * @inherits MongooseError
 * @api private
 */

class SyncIndexesError extends MongooseError {
  constructor(message, errorsMap) {
    super(message);
    this.errors = errorsMap;
  }
}

Object.defineProperty(SyncIndexesError.prototype, 'name', {
  value: 'SyncIndexesError'
});


module.exports = SyncIndexesError;
