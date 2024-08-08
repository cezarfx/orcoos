/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const isDefiningProjection = require('./isDefiningProjection');

/**
 * Determines if `path` is excluded by `projection`
 *
 * @param {Object} projection
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

module.exports = function isPathExcluded(projection, path) {
  if (projection == null) {
    return false;
  }

  if (path === '_id') {
    return projection._id === 0;
  }

  const paths = Object.keys(projection);
  let type = null;

  for (const _path of paths) {
    if (isDefiningProjection(projection[_path])) {
      type = projection[path] === 1 ? 'inclusive' : 'exclusive';
      break;
    }
  }

  if (type === 'inclusive') {
    return projection[path] !== 1;
  }
  if (type === 'exclusive') {
    return projection[path] === 0;
  }
  return false;
};
