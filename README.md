# Orcoos SDK

Orcoos SDK is a [Oracle NoSQL DB](https://www.oracle.com/database/nosql/) object modeling tool designed to work in an asynchronous environment. Orcoos works with [Node.js](https://nodejs.org/en/) 22+. Orcoos is modeled after [Mongoose](https://mongoosejs.com/), using the same API and adds functionality to allow executing native Oracle NoSQL DB queries.

## Installation

First install [Node.js](http://nodejs.org/) and [Oracle NoSQL DB](https://www.oracle.com/database/technologies/nosql-database-server-downloads.html), then:

```sh
$ npm install orcoos
```

Note: For examples in the ./examples dir to work npm link must be used. See https://docs.npmjs.com/cli/v8/commands/npm-link or below under Dev Instalation.

### Development installation

When developing the Orcoos SDK use the following installation steps:

Clone from GitHub (requires git):
```sh
  $ git clone https://github.com/cezarfx/orcoos.git
  $ cd orcoos
```

Install dependencies (requires NodeJS >= 22 and npm >= 10.8, if behind proxy use additional npm arg: --proxy=http://www-proxy:80):
```sh
  $ npm install
```

Run tests, must have a Oracle NoSQL DB instance (kvlite and proxy) running on http://localhost:8080:
```sh
  $ npm test
```

Run a single test:
```sh
  $ node ./node_modules/mocha/bin/mocha.js --require ts-node/register test/main.test.ts
```

Run tests on cloudsim, must have a Oracle NoSQL cloudsim instance running on http://localhost:8081:
```sh
  $ npm test-cloudsim
```

Localy link the orcoos npm package:
```sh
  $ npm link
```

Run examples, must have a Oracle NoSQL DB instance (kvlite and proxy) running on http://localhost:8080:
```sh
  $ cd examples/typescript
  $ npm link orcoos
  $ npm start

  $ cd ../javascript
  $ npm link orcoos
  $ npm start
```

Or run them all, tests and examples:
```sh
  $ cd ../..
  $ npm run all
```

## Documentation

The official documentation website is [TBD](https://github.com/cezarfx/orcoos).

## Examples

### Importing

```javascript
// Using Node.js `require()`
const orcoos = require('orcoos');

// Using ES6 imports
import orcoos from 'orcoos';
```

### Overview

#### Connecting to Oracle NoSQL DB

First, we need to define a connection. If your app uses only one database, you should use `orcoos.connect`. If you need to create additional connections, use `orcoos.createConnection`.

Both `connect` and `createConnection` take a connection string `nosqldb://` URI.

```js
await orcoos.connect('nosqldb+on_prem_http://localhost:8080/');
```

Once connected, the `open` event is fired on the `Connection` instance. If you're using `orcoos.connect`, the `Connection` is `orcoos.connection`. Otherwise, `orcoos.createConnection` return value is a `Connection`.

To enable logging to get insight into what query Orcoos SDK generates use the option logLevel, with one of values: NONE 0, SEVERE: 1, WARNING: 2, INFO: 3, CONFIG: 4, FINE: 5, FINNER: 6.

```js
await orcoos.connect('nosqldb+on_prem_http://localhost:8080/', {logLevel: 3});
```

**Note:** _If the local connection fails then try using 127.0.0.1 instead of localhost. Sometimes issues may arise when the local hostname has been changed._

**Note:** _If the connection string specifies a compartment or namespace, the expected compartment or namespace must already exist. Example: 'nosqldb+on_prem_http://localhost:8080/dev'._

**Important!** Orcoos buffers all the commands until it's connected to the database. This means that you don't have to wait until it connects to Oracle NoSQL DB in order to define models, run queries, etc.

#### Defining a Model

Models are defined through the `Schema` interface.

```js
const Schema = orcoos.Schema;
const ObjectId = Schema.ObjectId;

const BlogPost = new Schema({
  author: ObjectId,
  title: String,
  body: String,
  date: Date
});
```

Aside from defining the structure of your documents and the types of data you're storing, a Schema handles the definition of:

* [Validators](http://mongoosejs.com/docs/validation.html) (async and sync)
* [Defaults](http://mongoosejs.com/docs/api/schematype.html#schematype_SchemaType-default)
* [Getters](http://mongoosejs.com/docs/api/schematype.html#schematype_SchemaType-get)
* [Setters](http://mongoosejs.com/docs/api/schematype.html#schematype_SchemaType-set)
* [Indexes](http://mongoosejs.com/docs/guide.html#indexes)
* [Middleware](http://mongoosejs.com/docs/middleware.html)
* [Methods](http://mongoosejs.com/docs/guide.html#methods) definition
* [Statics](http://mongoosejs.com/docs/guide.html#statics) definition
* [Plugins](http://mongoosejs.com/docs/plugins.html)
* [pseudo-JOINs](http://mongoosejs.com/docs/populate.html)

The following example shows some of these features:

```js
const Comment = new Schema({
  name: { type: String, default: 'hahaha' },
  age: { type: Number, min: 18, index: true },
  bio: { type: String, match: /[a-z]/ },
  date: { type: Date, default: Date.now },
  buff: Buffer
});

// a setter
Comment.path('name').set(function (v) {
  return capitalize(v);
});

// middleware
Comment.pre('save', function (next) {
  notify(this.get('email'));
  next();
});
```

Take a look at the [`example`](./examples/typescript/demo-orcoos.ts) for an a detailed usage.

#### Accessing a Model

Once we define a model through `orcoos.model('ModelName', mySchema)`, we can access it through the same function

```js
const MyModel = orcoos.model('ModelName');
```

Or just do it all at once

```js
const MyModel = orcoos.model('ModelName', mySchema);
```

The first argument is the _singular_ name of the collection your model is for. **Orcoos automatically looks for the _plural_ version of your model name.** For example, if you use

```js
const MyModel = orcoos.model('Ticket', mySchema);
```

Then `MyModel` will use the __tickets__ collection, not the __ticket__ collection. For more details read the [model docs](https://mongoosejs.com/docs/api/mongoose.html#mongoose_Mongoose-model).

Once we have our model, we can then instantiate it, and save it:

```js
const instance = new MyModel();
instance.my.key = 'hello';
instance.save(function (err) {
  //
});
```

Or we can find documents from the same collection

```js
MyModel.find({}, function (err, docs) {
  // docs.forEach
});
```

You can also `findOne`, `findById`, `update`, etc.

```js
const instance = await MyModel.findOne({ ... });
console.log(instance.my.key);  // 'hello'
```

For more details check out [the docs](http://mongoosejs.com/docs/queries.html).

**Important!** If you opened a separate connection using `orcoos.createConnection()` but attempt to access the model through `orcoos.model('ModelName')` it will not work as expected since it is not hooked up to an active db connection. In this case access your model through the connection you created:

```js
const conn = orcoos.createConnection('your connection string');
const MyModel = conn.model('ModelName', schema);
const m = new MyModel;
m.save(); // works
```

vs

```js
const conn = orcoos.createConnection('your connection string');
const MyModel = orcoos.model('ModelName', schema);
const m = new MyModel;
m.save(); // does not work b/c the default connection object was never connected
```

#### Embedded Documents

In the first example snippet, we defined a key in the Schema that looks like:

```
comments: [Comment]
```

Where `Comment` is a `Schema` we created. This means that creating embedded documents is as simple as:

```js
// retrieve my model
const BlogPost = orcoos.model('BlogPost');

// create a blog post
const post = new BlogPost();

// create a comment
post.comments.push({ title: 'My comment' });

post.save(function (err) {
  if (!err) console.log('Success!');
});
```

The same goes for removing them:

```js
BlogPost.findById(myId, function (err, post) {
  if (!err) {
    post.comments[0].remove();
    post.save(function (err) {
      // do something
    });
  }
});
```

Embedded documents enjoy all the same features as your models. Defaults, validators, middleware. Whenever an error occurs, it's bubbled to the `save()` error callback, so error handling is a snap!


#### Middleware

See the [docs](http://mongoosejs.com/docs/middleware.html) page.

##### Intercepting and mutating method arguments

You can intercept method arguments via middleware.

For example, this would allow you to broadcast changes about your Documents every time someone `set`s a path in your Document to a new value:

```js
schema.pre('set', function (next, path, val, typel) {
  // `this` is the current Document
  this.emit('set', path, val);

  // Pass control to the next pre
  next();
});
```

Moreover, you can mutate the incoming `method` arguments so that subsequent middleware see different values for those arguments. To do so, just pass the new values to `next`:

```js
.pre(method, function firstPre (next, methodArg1, methodArg2) {
  // Mutate methodArg1
  next("altered-" + methodArg1.toString(), methodArg2);
});

// pre declaration is chainable
.pre(method, function secondPre (next, methodArg1, methodArg2) {
  console.log(methodArg1);
  // => 'altered-originalValOfMethodArg1'

  console.log(methodArg2);
  // => 'originalValOfMethodArg2'

  // Passing no arguments to `next` automatically passes along the current argument values
  // i.e., the following `next()` is equivalent to `next(methodArg1, methodArg2)`
  // and also equivalent to, with the example method arg
  // values, `next('altered-originalValOfMethodArg1', 'originalValOfMethodArg2')`
  next();
});
```

##### Schema gotcha

`type`, when used in a schema has special meaning within Orcoos. If your schema requires using `type` as a nested property you must use object notation:

```js
new Schema({
  broken: { type: Boolean },
  asset: {
    name: String,
    type: String // uh oh, it broke. asset will be interpreted as String
  }
});

new Schema({
  works: { type: Boolean },
  asset: {
    name: String,
    type: { type: String } // works. asset is an object with a type property
  }
});
```

### Driver Access

Orcoos is built on top of the [Oracle NoSQL DB NodeJs SDK](https://github.com/oracle/nosql-node-sdk). Each model keeps a reference to a [native Oracle NoSQL DB SDK table](https://oracle.github.io/nosql-node-sdk/pages/tables.html). The table object can be accessed using `YourModel.collection`. However, using the collection object directly bypasses all orcoos features, including hooks, validation, etc. The one
notable exception that `YourModel.collection` still buffers
commands. As such, `YourModel.collection.find()` will **not**
return a cursor.

### API Docs

Find the API docs [here](http://mongoosejs.com/docs/api/mongoose.html).

### Related Projects

#### Node SDK for Oracle NoSQL DB

- [nosql-node-sdk](https://github.com/oracle/nosql-node-sdk/)


## Help

* Open an issue in the [Issues](https://github.com/cezarfx/orcoos/issues) page.

When requesting help please be sure to include as much detail as possible,
including version of the SDK and **simple**, standalone example code as needed.

## Contributing

This project welcomes contributions from the community. Before submitting a pull request, please [review our contribution guide](./CONTRIBUTING.md)

## Security

Please consult the [security tab](https://github.com/cezarfx/orcoos/security).

## License

### MIT License

Copyright (c) 2010-2013 LearnBoost dev@learnboost.com 
Copyright (c) 2013-2021 Automattic
Copyright (c) 2024 Cezar Andrei cezarandrei.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
