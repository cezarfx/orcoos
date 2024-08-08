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

const MongooseError = require('.');

class VersionError extends MongooseError {
  /**
   * Version Error constructor.
   *
   * @param {Document} doc
   * @param {Number} currentVersion
   * @param {Array<String>} modifiedPaths
   * @api private
   */
  constructor(doc, currentVersion, modifiedPaths) {
    const modifiedPathsStr = modifiedPaths.join(', ');
    super('No matching document found for id "' + doc._id +
      '" version ' + currentVersion + ' modifiedPaths "' + modifiedPathsStr + '"');
    this.version = currentVersion;
    this.modifiedPaths = modifiedPaths;
  }
}


Object.defineProperty(VersionError.prototype, 'name', {
  value: 'VersionError'
});

/*!
 * exports
 */

module.exports = VersionError;
