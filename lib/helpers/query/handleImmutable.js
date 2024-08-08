/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const StrictModeError = require('../../error/strict');

module.exports = function handleImmutable(schematype, strict, obj, key, fullPath, ctx) {
  if (schematype == null || !schematype.options || !schematype.options.immutable) {
    return false;
  }
  let immutable = schematype.options.immutable;

  if (typeof immutable === 'function') {
    immutable = immutable.call(ctx, ctx);
  }
  if (!immutable) {
    return false;
  }

  if (strict === false) {
    return false;
  }
  if (strict === 'throw') {
    throw new StrictModeError(null,
      `Field ${fullPath} is immutable and strict = 'throw'`);
  }

  delete obj[key];
  return true;
};
