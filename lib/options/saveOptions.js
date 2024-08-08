/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const clone = require('../helpers/clone');

class SaveOptions {
  constructor(obj) {
    if (obj == null) {
      return;
    }
    Object.assign(this, clone(obj));
  }
}

module.exports = SaveOptions;
