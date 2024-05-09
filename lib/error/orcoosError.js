'use strict';

/*!
 * ignore
 */

class OrcoosError extends Error { }

Object.defineProperty(OrcoosError.prototype, 'name', {
  value: 'OrcoosError'
});

module.exports = OrcoosError;
