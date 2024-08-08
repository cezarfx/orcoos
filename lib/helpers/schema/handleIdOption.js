/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const addAutoId = require('./addAutoId');

module.exports = function handleIdOption(schema, options) {
  if (options == null || options._id == null) {
    return schema;
  }

  schema = schema.clone();
  if (!options._id) {
    schema.remove('_id');
    schema.options._id = false;
  } else if (!schema.paths['_id']) {
    addAutoId(schema);
    schema.options._id = true;
  }

  return schema;
};
