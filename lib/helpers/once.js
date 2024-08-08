/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

module.exports = function once(fn) {
  let called = false;
  return function() {
    if (called) {
      return;
    }
    called = true;
    return fn.apply(null, arguments);
  };
};
