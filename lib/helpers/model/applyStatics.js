/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

/**
 * Register statics for this model
 * @param {Model} model
 * @param {Schema} schema
 * @api private
 */
module.exports = function applyStatics(model, schema) {
  for (const i in schema.statics) {
    model[i] = schema.statics[i];
  }
};
