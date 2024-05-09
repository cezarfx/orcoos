/*!
 * Module dependencies.
 */

'use strict';

const OrcoosError = require('.');

class ObjectParameterError extends OrcoosError {
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
