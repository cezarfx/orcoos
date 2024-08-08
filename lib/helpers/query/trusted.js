/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const trustedSymbol = Symbol('mongoose#trustedSymbol');

exports.trustedSymbol = trustedSymbol;

exports.trusted = function trusted(obj) {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }
  obj[trustedSymbol] = true;
  return obj;
};
