/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const specialKeys = new Set([
  '$ref',
  '$id',
  '$db'
]);

module.exports = function isOperator(path) {
  return (
    path[0] === '$' &&
    !specialKeys.has(path)
  );
};
