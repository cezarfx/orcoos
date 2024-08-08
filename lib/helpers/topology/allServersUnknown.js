/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const getConstructorName = require('../getConstructorName');

module.exports = function allServersUnknown(topologyDescription) {
  if (getConstructorName(topologyDescription) !== 'TopologyDescription') {
    return false;
  }

  const servers = Array.from(topologyDescription.servers.values());
  return servers.length > 0 && servers.every(server => server.type === 'Unknown');
};
