/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const each = require('../helpers/each');

/*!
 * ignore
 */

module.exports = function removeSubdocs(schema) {
  const unshift = true;
  schema.s.hooks.pre('deleteOne', { document: true, query: false }, function removeSubDocsPreRemove(next) {
    if (this.$isSubdocument) {
      next();
      return;
    }
    if (this.$__ == null) {
      next();
      return;
    }

    const _this = this;
    const subdocs = this.$getAllSubdocs();

    each(subdocs, function(subdoc, cb) {
      subdoc.$__deleteOne(cb);
    }, function(error) {
      if (error) {
        return _this.$__schema.s.hooks.execPost('deleteOne:error', _this, [_this], { error: error }, function(error) {
          next(error);
        });
      }
      next();
    });
  }, null, unshift);
};
