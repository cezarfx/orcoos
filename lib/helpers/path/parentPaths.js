/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const dotRE = /\./g;
module.exports = function parentPaths(path) {
  if (path.indexOf('.') === -1) {
    return [path];
  }
  const pieces = path.split(dotRE);
  const len = pieces.length;
  const ret = new Array(len);
  let cur = '';
  for (let i = 0; i < len; ++i) {
    cur += (cur.length !== 0) ? '.' + pieces[i] : pieces[i];
    ret[i] = cur;
  }

  return ret;
};
