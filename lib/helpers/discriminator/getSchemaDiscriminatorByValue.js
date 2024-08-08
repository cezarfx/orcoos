/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const areDiscriminatorValuesEqual = require('./areDiscriminatorValuesEqual');

/**
 * returns discriminator by discriminatorMapping.value
 *
 * @param {Schema} schema
 * @param {string} value
 * @api private
 */

module.exports = function getSchemaDiscriminatorByValue(schema, value) {
  if (schema == null || schema.discriminators == null) {
    return null;
  }
  for (const key of Object.keys(schema.discriminators)) {
    const discriminatorSchema = schema.discriminators[key];
    if (discriminatorSchema.discriminatorMapping == null) {
      continue;
    }
    if (areDiscriminatorValuesEqual(discriminatorSchema.discriminatorMapping.value, value)) {
      return discriminatorSchema;
    }
  }
  return null;
};
