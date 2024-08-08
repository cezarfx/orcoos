/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

module.exports = function pushNestedArrayPaths(paths, nestedArray, path) {
  if (nestedArray == null) {
    return;
  }

  for (let i = 0; i < nestedArray.length; ++i) {
    if (Array.isArray(nestedArray[i])) {
      pushNestedArrayPaths(paths, nestedArray[i], path + '.' + i);
    } else {
      paths.push(path + '.' + i);
    }
  }
};
