/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const get = require('../get');

module.exports = function applyWriteConcern(schema, options) {
  const writeConcern = get(schema, 'options.writeConcern', {});
  if (Object.keys(writeConcern).length != 0) {
    options.writeConcern = {};
    if (!('w' in options) && writeConcern.w != null) {
      options.writeConcern.w = writeConcern.w;
    }
    if (!('j' in options) && writeConcern.j != null) {
      options.writeConcern.j = writeConcern.j;
    }
    if (!('wtimeout' in options) && writeConcern.wtimeout != null) {
      options.writeConcern.wtimeout = writeConcern.wtimeout;
    }
  }
  else {
    if (!('w' in options) && writeConcern.w != null) {
      options.w = writeConcern.w;
    }
    if (!('j' in options) && writeConcern.j != null) {
      options.j = writeConcern.j;
    }
    if (!('wtimeout' in options) && writeConcern.wtimeout != null) {
      options.wtimeout = writeConcern.wtimeout;
    }
  }
};
