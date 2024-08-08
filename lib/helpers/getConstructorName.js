/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/**
 * If `val` is an object, returns constructor name, if possible. Otherwise returns undefined.
 * @api private
 */

module.exports = function getConstructorName(val) {
  if (val == null) {
    return void 0;
  }
  if (typeof val.constructor !== 'function') {
    return void 0;
  }
  return val.constructor.name;
};
