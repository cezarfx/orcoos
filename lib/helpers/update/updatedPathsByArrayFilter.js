/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const modifiedPaths = require('./modifiedPaths');

module.exports = function updatedPathsByArrayFilter(update) {
  if (update == null) {
    return {};
  }
  const updatedPaths = modifiedPaths(update);

  return Object.keys(updatedPaths).reduce((cur, path) => {
    const matches = path.match(/\$\[[^\]]+\]/g);
    if (matches == null) {
      return cur;
    }
    for (const match of matches) {
      const firstMatch = path.indexOf(match);
      if (firstMatch !== path.lastIndexOf(match)) {
        throw new Error(`Path '${path}' contains the same array filter multiple times`);
      }
      cur[match.substring(2, match.length - 1)] = path.
        substring(0, firstMatch - 1).
        replace(/\$\[[^\]]+\]/g, '0');
    }
    return cur;
  }, {});
};
