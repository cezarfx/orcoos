/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/*!
 * ignore
 */

module.exports = function(val) {
  if (Array.isArray(val)) {
    if (!val.every(v => typeof v === 'number' || typeof v === 'string')) {
      throw new Error('$type array values must be strings or numbers');
    }
    return val;
  }

  if (typeof val !== 'number' && typeof val !== 'string') {
    throw new Error('$type parameter must be number, string, or array of numbers and strings');
  }

  return val;
};
