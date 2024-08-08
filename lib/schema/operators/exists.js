/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const castBoolean = require('../../cast/boolean');

/*!
 * ignore
 */

module.exports = function(val) {
  const path = this != null ? this.path : null;
  return castBoolean(val, path);
};
