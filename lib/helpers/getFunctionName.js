/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const functionNameRE = /^function\s*([^\s(]+)/;

module.exports = function(fn) {
  return (
    fn.name ||
    (fn.toString().trim().match(functionNameRE) || [])[1]
  );
};
