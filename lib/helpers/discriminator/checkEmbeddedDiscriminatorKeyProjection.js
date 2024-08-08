/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

module.exports = function checkEmbeddedDiscriminatorKeyProjection(userProjection, path, schema, selected, addedPaths) {
  const userProjectedInPath = Object.keys(userProjection).
    reduce((cur, key) => cur || key.startsWith(path + '.'), false);
  const _discriminatorKey = path + '.' + schema.options.discriminatorKey;
  if (!userProjectedInPath &&
      addedPaths.length === 1 &&
      addedPaths[0] === _discriminatorKey) {
    selected.splice(selected.indexOf(_discriminatorKey), 1);
  }
};
