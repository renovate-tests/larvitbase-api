[![Build Status](https://travis-ci.org/larvit/larvitbase-api.svg)](https://travis-ci.org/larvit/larvitbase-api) [![Dependencies](https://david-dm.org/larvit/larvitbase-api.svg)](https://david-dm.org/larvit/larvitbase-api.svg)
[![Coverage Status](https://coveralls.io/repos/github/larvit/larvitbase-api/badge.svg)](https://coveralls.io/github/larvit/larvitbase-api)

# larvitbase-api

REST http API base framework based on [larvitbase](https://github.com/larvit/larvitbase)

## Installation

```bash
npm i larvitbase-api
```

## Basic usage

In the file index.js:

```javascript
const Api = require('larvitbase-api');

let api;

api = new Api({
	'lBaseOptions':	{'httpOptions': 8001},	// sent to larvitbase
	'routerOptions':	{},	// sent to larvitrouter
	'reqParserOptions': {}, // sent to larvitReqParser
});

api.start(function (err) {}); // callback

// Exposed stuff
//api.lBase	- larvitbase instance
//api.options	- the options sent in when instanciated
//api.apiVersions	- resolved versions of the API (subfolders to controllers folder)

//api.stop() // close httpServer
```

Then just start the file from shell:

```bash
node index.js
```

This will provide the following:

### Show the README.md on /

Will print your apps README.md when the browser targets http://localhost:8001/

### Run controllers

Will run controllers in your apps "controllers/X.X"-folder (or node_module/xxx/controllers/X.X, see [larvitfs](https://github.com/larvit/larvitfs) for details on the virtual filesystem the routing module uses for this). For example /foo will run the controller controllers/1.2/foo.js, given that 1.2 is the latest version. For details about how to write controllers, see [larvitbase](https://github.com/larvit/larvitbase).

It is also possible to request a specific version fo the API. Consider:

* /foo -> controllers/1.2/foo.js
* /1.2/foo -> controllers/1.2/foo.js
* /1.0/foo -> controllers/1.0/foo.js

#### Valid versions

We are using [semver](https://www.npmjs.com/package/semver) where we do the following:

1. Run .clean() to change for example "v2.1" to "2.1"
2. Add a patch version, so "2.1" becomes "2.1.0" (this is because patches should never change the API, just fix bugs and issues without changing spec)
3. Check the result with .valid()

### Output raw JSON

Will write everything stored in res.data as JSON directly to the browser as application/json (except for the README.md, that is sent as text/markdown).
