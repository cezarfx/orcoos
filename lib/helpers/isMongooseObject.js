/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const isMongooseArray = require('../types/array/isMongooseArray').isMongooseArray;
/**
 * Returns if `v` is a mongoose object that has a `toObject()` method we can use.
 *
 * This is for compatibility with libs like Date.js which do foolish things to Natives.
 *
 * @param {Any} v
 * @api private
 */

module.exports = function(v) {
  return (
    v != null && (
      isMongooseArray(v) || // Array or Document Array
      v.$__ != null || // Document
      v.isMongooseBuffer || // Buffer
      v.$isMongooseMap // Map
    )
  );
};
