/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

module.exports = handleTimestampOption;

/*!
 * ignore
 */

function handleTimestampOption(arg, prop) {
  if (arg == null) {
    return null;
  }

  if (typeof arg === 'boolean') {
    return prop;
  }
  if (typeof arg[prop] === 'boolean') {
    return arg[prop] ? prop : null;
  }
  if (!(prop in arg)) {
    return prop;
  }
  return arg[prop];
}
