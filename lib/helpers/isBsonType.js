/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/**
 * Get the bson type, if it exists
 * @api private
 */

function isBsonType(obj, typename) {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    obj._bsontype === typename
  );
}

module.exports = isBsonType;
