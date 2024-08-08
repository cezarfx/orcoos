/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const isBsonType = require('../isBsonType');

module.exports = function areDiscriminatorValuesEqual(a, b) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b;
  }
  if (isBsonType(a, 'ObjectId') && isBsonType(b, 'ObjectId')) {
    return a.toString() === b.toString();
  }
  return false;
};
