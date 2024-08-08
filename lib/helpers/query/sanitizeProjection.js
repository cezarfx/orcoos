/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

module.exports = function sanitizeProjection(projection) {
  if (projection == null) {
    return;
  }

  const keys = Object.keys(projection);
  for (let i = 0; i < keys.length; ++i) {
    if (typeof projection[keys[i]] === 'string') {
      projection[keys[i]] = 1;
    }
  }
};
