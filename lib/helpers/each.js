/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

module.exports = function each(arr, cb, done) {
  if (arr.length === 0) {
    return done();
  }

  let remaining = arr.length;
  let err = null;
  for (const v of arr) {
    cb(v, function(_err) {
      if (err != null) {
        return;
      }
      if (_err != null) {
        err = _err;
        return done(err);
      }

      if (--remaining <= 0) {
        return done();
      }
    });
  }
};
