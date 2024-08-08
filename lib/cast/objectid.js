/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const isBsonType = require('../helpers/isBsonType');
const ObjectId = require('../types/objectid');

module.exports = function castObjectId(value) {
  if (value == null) {
    return value;
  }

  if (isBsonType(value, 'ObjectId')) {
    return value;
  }

  if (value._id) {
    if (isBsonType(value._id, 'ObjectId')) {
      return value._id;
    }
    if (value._id.toString instanceof Function) {
      return new ObjectId(value._id.toString());
    }
  }

  if (value.toString instanceof Function) {
    return new ObjectId(value.toString());
  }

  return new ObjectId(value);
};
