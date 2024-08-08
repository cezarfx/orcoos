/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const getDiscriminatorByValue = require('./getDiscriminatorByValue');

/**
 * Find the correct constructor, taking into account discriminators
 * @api private
 */

module.exports = function getConstructor(Constructor, value) {
  const discriminatorKey = Constructor.schema.options.discriminatorKey;
  if (value != null &&
      Constructor.discriminators &&
      value[discriminatorKey] != null) {
    if (Constructor.discriminators[value[discriminatorKey]]) {
      Constructor = Constructor.discriminators[value[discriminatorKey]];
    } else {
      const constructorByValue = getDiscriminatorByValue(Constructor.discriminators, value[discriminatorKey]);
      if (constructorByValue) {
        Constructor = constructorByValue;
      }
    }
  }

  return Constructor;
};
