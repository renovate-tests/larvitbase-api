'use strict';

const	topLogPrefix = 'larvitbase-api: ./index.js: ',
	ReqParser	= require('larvitreqparser'),
	Router	= require('larvitrouter'),
	semver	= require('semver'),
	LBase	= require('larvitbase'),
	path	= require('path'),
	Lfs	= require('larvitfs'),
	log	= require('winston'),
	fs	= require('fs');

function Api(options) {
	const	logPrefix	= topLogPrefix + 'Api() - ',
		that	= this;

	let	controllersFullPath,
		lfs;

	if ( ! options) {
		options	= {};
	}

	that.options	= options;

	if ( ! that.options.routerOptions)	{ that.options.routerOptions	= {};	}
	if ( ! that.options.routerOptions.controllersPath)	{ that.options.routerOptions.controllersPath	= 'controllers';	}
	if ( ! that.options.routerOptions.basePath)	{ that.options.routerOptions.basePath	= process.cwd();	}
	if ( ! Array.isArray(that.options.routerOptions.routes))	{ that.options.routerOptions.routes	= [];	}

	if ( ! that.options.lBaseOptions) that.options.lBaseOptions	= {};

	if ( ! Array.isArray(options.lBaseOptions.middleware)) {
		options.lBaseOptions.middleware	= [];
	}

	that.middleware	= options.lBaseOptions.middleware;

	// Instantiate lfs
	lfs	= new Lfs({'basePath': that.options.routerOptions.basePath});

	// Resolve apiVersions
	controllersFullPath	= path.join(that.options.routerOptions.basePath, that.options.routerOptions.controllersPath);
	if (fs.existsSync(controllersFullPath)) {
		that.apiVersions = fs.readdirSync(controllersFullPath).filter(function (file) {
			let	versionStr	= semver.clean(String(file) + '.0');

			if (
				fs.statSync(controllersFullPath + '/' + file).isDirectory()
				&& semver.valid(versionStr) !== null
			) {
				return true;
			} else {
				return false;
			}
		});
	} else {
		that.apiVersions	= [];
		log.info(logPrefix + 'No controllers folder detected');
	}

	// Sort apiVersions
	that.apiVersions.sort(function (a, b) {
		return semver.gt(a + '.0', b + '.0');
	});

	// Instantiate the router
	that.router	= new Router(that.options.routerOptions);

	// Instantiate the request parser
	that.reqParser	= new ReqParser(that.options.reqParserOptions);

	that.middleware.push(function (req, res, cb) {
		that.reqParser.parse(req, res, cb);
	});

	// Default to the latest version of the API
	that.middleware.push(function (req, res, cb) {
		if ( ! semver.valid(req.url.split('/')[1] + '.0') && that.apiVersions.length) {
			req.url	= '/' + that.apiVersions[that.apiVersions.length - 1] + req.url;
		}
		req.apiVersion	= req.url.split('/')[1];
		req.urlBase	= req.url.split('?')[0];
		cb();
	});

	// Route the request
	that.middleware.push(function (req, res, cb) {
		let	readmeFile	= false;

		// Check if url is matching a directory that contains a README.md

		// Request directly on root, existing README.md in root
		if (req.urlBase === '/' && lfs.getPathSync(path.join(that.options.routerOptions.basePath, '/README.md'))) {
			readmeFile	= path.join(that.options.routerOptions.basePath, '/README.md');

		// README exists on exactly the version URL requested
		} else if (lfs.getPathSync(path.join(req.urlBase, '/README.md').substring(1))) {
			readmeFile	= lfs.getPathSync(path.join(req.urlBase, '/README.md').substring(1));
		} else if (lfs.getPathSync(path.join('controllers/', req.urlBase, '/README.md'))) {
			readmeFile	= lfs.getPathSync(path.join('controllers/', req.urlBase, '/README.md'));

		// Get readme directly from root, if it is missing in version folders
		// AND requested url is exactly a version-url
		} else if (semver.valid(req.url.split('/')[1] + '.0') && lfs.getPathSync('README.md') && req.urlBase === '/' + req.urlBase.split('/')[1] + '/') {
			readmeFile	= lfs.getPathSync('README.md');

		// Get hard coded string if root or version-url is requested and README.md is missing
		// AND requested url is exactly a version-url
		} else if (req.urlBase === '/' || semver.valid(req.url.split('/')[1] + '.0') && req.urlBase === '/' + req.url.split('/')[1] + '/') {
			return res.end('API is up and running. This API contains no README.md');
		}

		// If a readme file is found, send that to the browser and end the request
		if (readmeFile) {
			res.setHeader('Content-Type', 'text/markdown; charset=UTF-8');
			return fs.readFile(readmeFile, function (err, data) {
				if (err) return cb(err);
				res.end(data);
			});
		}

		that.router.resolve(req.urlBase, function (err, result) {
			req.routed	= result;
			cb(err);
		});
	});

	// Run controller
	that.middleware.push(function (req, res, cb) {
		if ( ! req.routed.controllerFullPath) {
			res.statusCode	= 404;
			res.data	= '"URL endpoint not found"';
			cb();
		} else {
			require(req.routed.controllerFullPath)(req, res, cb);
		}
	});

	// Output JSON to client
	that.middleware.push(function (req, res, cb) {
		let	sendData	= res.data;

		res.setHeader('Content-Type', 'application/json; charset=UTF-8');

		try {
			if (typeof sendData !== 'string' && ! Buffer.isBuffer(sendData)) {
				sendData	= JSON.stringify(sendData);
			}
		} catch (err) {
			return cb(err);
		}

		res.end(sendData);
		cb();
	});

	// Clean up if file storage is used by parser
	that.middleware.push(function (req, res, cb) {
		that.reqParser.clean(req, res, cb);
	});
};

Api.prototype.start = function start(cb) {
	const	that	= this;

	that.lBase	= new LBase(that.options.lBaseOptions, cb);

	that.lBase.on('error', function (err, req, res) {
		res.statusCode	= 500;
		res.end('"Internal server error: ' + err.message + '"');
	});
};

Api.prototype.stop = function (cb) {
	const	that	= this;
	that.lBase.httpServer.close(cb);
};

exports = module.exports = Api;
