/*!
 * Module dependencies.
 */

'use strict';

const OrcoosError = require('.');


class MissingSchemaError extends OrcoosError {
  /**
   * MissingSchema Error constructor.
   */
  constructor() {
    super('Schema hasn\'t been registered for document.\n'
      + 'Use mongoose.Document(name, schema)');
  }
}

Object.defineProperty(MissingSchemaError.prototype, 'name', {
  value: 'OrcoosError'
});

/*!
 * exports
 */

module.exports = MissingSchemaError;
