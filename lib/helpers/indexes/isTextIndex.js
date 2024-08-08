/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/**
 * Returns `true` if the given index options have a `text` option.
 */

module.exports = function isTextIndex(indexKeys) {
  let isTextIndex = false;
  for (const key of Object.keys(indexKeys)) {
    if (indexKeys[key] === 'text') {
      isTextIndex = true;
    }
  }

  return isTextIndex;
};
