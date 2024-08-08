/*-
 * Copyright (c) 2024 Oracle and/or its affiliates.  All rights reserved.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * https://oss.oracle.com/licenses/upl/
 * 
 * Copyright (c) 2010-2013 LearnBoost dev@learnboost.com Copyright (c) 2013-2021 Automattic
 *
 * Licensed under the MIT License as shown at
 * https://github.com/Automattic/mongoose/blob/master/LICENSE.md
 */

declare module 'ondbmongoose' {
  // import mongodb = require('mongodb');

  // type ClientSessionOptions = mongodb.ClientSessionOptions;
  // type ClientSession = mongodb.ClientSession;
type ClientSessionOptions = any; //mongodb.ClientSessionOptions;
type ClientSession = any; //mongodb.ClientSession;



  /**
   * _Requires MongoDB >= 3.6.0._ Starts a [MongoDB session](https://www.mongodb.com/docs/manual/release-notes/3.6/#client-sessions)
   * for benefits like causal consistency, [retryable writes](https://www.mongodb.com/docs/manual/core/retryable-writes/),
   * and [transactions](http://thecodebarbarian.com/a-node-js-perspective-on-mongodb-4-transactions.html).
   */
  function startSession(options?: ClientSessionOptions): Promise<ClientSession>;

  interface SessionOperation {
    /** Sets the session. Useful for [transactions](/docs/transactions.html). */
    // session(session: mongodb.ClientSession | null): this;
  }

  interface SessionStarter {

    /**
     * Starts a [MongoDB session](https://www.mongodb.com/docs/manual/release-notes/3.6/#client-sessions)
     * for benefits like causal consistency, [retryable writes](https://www.mongodb.com/docs/manual/core/retryable-writes/),
     * and [transactions](http://thecodebarbarian.com/a-node-js-perspective-on-mongodb-4-transactions.html).
     */
    startSession(options?: ClientSessionOptions): Promise<ClientSession>;
  }

  interface SessionOption {
    session?: ClientSession | null;
  }
}
