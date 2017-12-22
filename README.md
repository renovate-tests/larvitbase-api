[![Build Status](https://travis-ci.org/larvit/larvitbase-api.svg)](https://travis-ci.org/larvit/larvitbase-api) [![Dependencies](https://david-dm.org/larvit/larvitbase-api.svg)](https://david-dm.org/larvit/larvitbase-api.svg)
[![Coverage Status](https://coveralls.io/repos/larvit/larvitbase-api/badge.svg)](https://coveralls.io/github/larvit/larvitbase-api)

# larvitbase-api

REST http API baes framework based on [larvitbase](https://github.com/larvit/larvitbase)

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
	'routerOptions':	{}	// sent to larvitrouter
});

// Exposed stuff
//api.lBase	- larvitbase instance
//api.options	- the options sent in when instanciated
//api.apiVersions	- resolved versions of the API (subfolders to controllers folder)
```

Then just start the file from shell:

```bash
node index.js
```

This will provide the following:

### Show the README.md on /

Will print your apps README.md when the browser targets http://localhost:8001/

### Run controllers

Will run controllers in your apps "controllers/vX.X"-folder (or node_module/xxx/controllers/vX.X, see [larvitfs](https://github.com/larvit/larvitfs) for details on the virtual filesystem the routing module uses for this). For example /foo will run the controller controllers/v1.2/foo.js, given that v1.2 is the latest version. For details about how to write controllers, see [larvitbase](https://github.com/larvit/larvitbase).

It is also possible to request a specific version fo the API. Consider:

* /foo -> controllers/v1.2/foo.js
* /v1.2/foo -> controllers/v1.2/foo.js
* /v1.0/foo -> controllers/v1.0/foo.js

### Output raw JSON

Will write everything stored in res.data as JSON directly to the browser as application/json (except for the README.md, that is sent as text/markdown).
