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
   * @param {String} name
   * @api private
   */
  constructor(name) {
    const msg = 'Schema hasn\'t been registered for model "' + name + '".\n'
            + 'Use mongoose.model(name, schema)';
    super(msg);
  }
}

Object.defineProperty(MissingSchemaError.prototype, 'name', {
  value: 'MissingSchemaError'
});

/*!
 * exports
 */

module.exports = MissingSchemaError;
