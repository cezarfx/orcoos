/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/**
 * Determines if `arg` is a flat object.
 *
 * @param {Object|Array|String|Function|RegExp|any} arg
 * @api private
 * @return {Boolean}
 */

module.exports = function isSimpleValidator(obj) {
  const keys = Object.keys(obj);
  let result = true;
  for (let i = 0, len = keys.length; i < len; ++i) {
    if (typeof obj[keys[i]] === 'object' && obj[keys[i]] !== null) {
      result = false;
      break;
    }
  }

  return result;
};
