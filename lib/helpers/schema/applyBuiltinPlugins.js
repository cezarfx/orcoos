/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const builtinPlugins = require('../../plugins');

module.exports = function applyBuiltinPlugins(schema) {
  for (const plugin of Object.values(builtinPlugins)) {
    plugin(schema, { deduplicate: true });
  }
  schema.plugins = Object.values(builtinPlugins).
    map(fn => ({ fn, opts: { deduplicate: true } })).
    concat(schema.plugins);
};
