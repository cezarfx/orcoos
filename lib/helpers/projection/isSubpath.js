/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/**
 * Determines if `path2` is a subpath of or equal to `path1`
 *
 * @param {string} path1
 * @param {string} path2
 * @return {Boolean}
 * @api private
 */

module.exports = function isSubpath(path1, path2) {
  return path1 === path2 || path2.startsWith(path1 + '.');
};
