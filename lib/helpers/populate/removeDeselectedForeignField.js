/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const get = require('../get');
const mpath = require('mpath');
const parseProjection = require('../projection/parseProjection');

/*!
 * ignore
 */

module.exports = function removeDeselectedForeignField(foreignFields, options, docs) {
  const projection = parseProjection(get(options, 'select', null), true) ||
    parseProjection(get(options, 'options.select', null), true);

  if (projection == null) {
    return;
  }
  for (const foreignField of foreignFields) {
    if (!projection.hasOwnProperty('-' + foreignField)) {
      continue;
    }

    for (const val of docs) {
      if (val.$__ != null) {
        mpath.unset(foreignField, val._doc);
      } else {
        mpath.unset(foreignField, val);
      }
    }
  }
};
