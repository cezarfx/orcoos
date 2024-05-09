'use strict';

/*!
 * Module dependencies.
 */

const OrcoosError = require('.');

class ParallelSaveError extends OrcoosError {
  /**
   * ParallelSave Error constructor.
   *
   * @param {Document} doc
   * @api private
   */
  constructor(doc) {
    const msg = 'Can\'t save() the same doc multiple times in parallel. Document: ';
    super(msg + doc._id);
  }
}

Object.defineProperty(ParallelSaveError.prototype, 'name', {
  value: 'ParallelSaveError'
});

/*!
 * exports
 */

module.exports = ParallelSaveError;
