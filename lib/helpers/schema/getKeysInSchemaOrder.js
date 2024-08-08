/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const get = require('../get');

module.exports = function getKeysInSchemaOrder(schema, val, path) {
  const schemaKeys = path != null ? Object.keys(get(schema.tree, path, {})) : Object.keys(schema.tree);
  const valKeys = new Set(Object.keys(val));

  let keys;
  if (valKeys.size > 1) {
    keys = new Set();
    for (const key of schemaKeys) {
      if (valKeys.has(key)) {
        keys.add(key);
      }
    }
    for (const key of valKeys) {
      if (!keys.has(key)) {
        keys.add(key);
      }
    }
    keys = Array.from(keys);
  } else {
    keys = Array.from(valKeys);
  }

  return keys;
};
