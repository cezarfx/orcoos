/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/*!
 * ignore
 */

module.exports = function addIdGetter(schema) {
  // ensure the documents receive an id getter unless disabled
  const autoIdGetter = !schema.paths['id'] &&
    schema.paths['_id'] &&
    schema.options.id;
  if (!autoIdGetter) {
    return schema;
  }

  schema.virtual('id').get(idGetter);

  return schema;
};

/**
 * Returns this documents _id cast to a string.
 * @api private
 */

function idGetter() {
  if (this._id != null) {
    return String(this._id);
  }

  return null;
}
