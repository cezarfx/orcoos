/*-
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

'use strict';

const getConstructorName = require('../getConstructorName');

const nonSSLMessage = 'Client network socket disconnected before secure TLS ' +
  'connection was established';

module.exports = function isSSLError(topologyDescription) {
  if (getConstructorName(topologyDescription) !== 'TopologyDescription') {
    return false;
  }

  const descriptions = Array.from(topologyDescription.servers.values());
  return descriptions.length > 0 &&
    descriptions.every(descr => descr.error && descr.error.message.indexOf(nonSSLMessage) !== -1);
};
