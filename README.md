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
const App = require('larvitbase-api');
new App({
	'httpOptions': 8001
});
```

Then just start the file from shell:

```bash
node index.js
```

This will provide the following:

* Will print your apps README.md when the browser targets http://localhost:8001/
* Will run controllers in your apps "controllers"-folder (or node_module/xxx/controllers, see [larvitfs](https://github.com/larvit/larvitfs) for details on the virtual filesystem the routing module uses for this). For example /foo will run the controller controllers/foo.js, for details about how to write controllers, see [larvitbase](https://github.com/larvit/larvitbase).
* Will write everything stored in res.data as JSON directly to the browser (except for the README.md, that is sent as text/markdown)
