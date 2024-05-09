/*!
 * Module dependencies.
 */

'use strict';

const OrcoosError = require('.');

class StrictPopulateError extends OrcoosError {
  /**
   * Strict mode error constructor
   *
   * @param {String} path
   * @param {String} [msg]
   * @inherits OrcoosError
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
