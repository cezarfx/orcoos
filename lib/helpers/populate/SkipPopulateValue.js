/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

module.exports = function SkipPopulateValue(val) {
  if (!(this instanceof SkipPopulateValue)) {
    return new SkipPopulateValue(val);
  }

  this.val = val;
  return this;
};
