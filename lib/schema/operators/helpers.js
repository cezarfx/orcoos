/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/*!
 * Module requirements.
 */

const SchemaNumber = require('../number');

/*!
 * ignore
 */

exports.castToNumber = castToNumber;
exports.castArraysOfNumbers = castArraysOfNumbers;

/*!
 * ignore
 */

function castToNumber(val) {
  return SchemaNumber.cast()(val);
}

function castArraysOfNumbers(arr, self) {
  arr.forEach(function(v, i) {
    if (Array.isArray(v)) {
      castArraysOfNumbers(v, self);
    } else {
      arr[i] = castToNumber.call(self, v);
    }
  });
}
