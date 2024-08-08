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


class MissingSchemaError extends MongooseError {
  /**
   * MissingSchema Error constructor.
   */
  constructor() {
    super('Schema hasn\'t been registered for document.\n'
      + 'Use mongoose.Document(name, schema)');
  }
}

Object.defineProperty(MissingSchemaError.prototype, 'name', {
  value: 'MongooseError'
});

/*!
 * exports
 */

module.exports = MissingSchemaError;
