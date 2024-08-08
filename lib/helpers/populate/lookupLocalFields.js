/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

module.exports = function lookupLocalFields(cur, path, val) {
  if (cur == null) {
    return cur;
  }

  if (cur._doc != null) {
    cur = cur._doc;
  }

  if (arguments.length >= 3) {
    if (typeof cur !== 'object') {
      return void 0;
    }
    if (val === void 0) {
      return void 0;
    }
    if (cur instanceof Map) {
      cur.set(path, val);
    } else {
      cur[path] = val;
    }
    return val;
  }


  // Support populating paths under maps using `map.$*.subpath`
  if (path === '$*') {
    return cur instanceof Map ?
      Array.from(cur.values()) :
      Object.keys(cur).map(key => cur[key]);
  }

  if (cur instanceof Map) {
    return cur.get(path);
  }

  return cur[path];
};
