'use strict';

/*!
 * Module dependencies.
 */

const OrcoosError = require('./OrcoosError');


class ParallelValidateError extends OrcoosError {
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
