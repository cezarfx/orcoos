/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const isTextIndex = require('./isTextIndex');

module.exports = function applySchemaCollation(indexKeys, indexOptions, schemaOptions) {
  if (isTextIndex(indexKeys)) {
    return;
  }

  if (schemaOptions.hasOwnProperty('collation') && !indexOptions.hasOwnProperty('collation')) {
    indexOptions.collation = schemaOptions.collation;
  }
};
