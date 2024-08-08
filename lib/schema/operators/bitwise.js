/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

/*!
 * Module requirements.
 */

'use strict';

const CastError = require('../../error/cast');

/*!
 * ignore
 */

function handleBitwiseOperator(val) {
  const _this = this;
  if (Array.isArray(val)) {
    return val.map(function(v) {
      return _castNumber(_this.path, v);
    });
  } else if (Buffer.isBuffer(val)) {
    return val;
  }
  // Assume trying to cast to number
  return _castNumber(_this.path, val);
}

/*!
 * ignore
 */

function _castNumber(path, num) {
  const v = Number(num);
  if (isNaN(v)) {
    throw new CastError('number', num, path);
  }
  return v;
}

module.exports = handleBitwiseOperator;
