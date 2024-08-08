/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

module.exports = function addAutoId(schema) {
  const _obj = { _id: { auto: true } };
  _obj._id[schema.options.typeKey] = 'ObjectId';
  schema.add(_obj);
};
