'use strict';

/*!
 * Module dependencies.
 */

const OrcoosError = require('./OrcoosError');

/**
 * SyncIndexes Error constructor.
 *
 * @param {String} message
 * @param {String} errorsMap
 * @inherits OrcoosError
 * @api private
 */

class SyncIndexesError extends OrcoosError {
  constructor(message, errorsMap) {
    super(message);
    this.errors = errorsMap;
  }
}

Object.defineProperty(SyncIndexesError.prototype, 'name', {
  value: 'SyncIndexesError'
});


module.exports = SyncIndexesError;
