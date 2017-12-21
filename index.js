'use strict';

const	logPrefix = 'larvitbase-api ./index.js - ',
	Router	= require('larvitrouter'),
	semver	= require('semver'),
	LBase	= require('larvitbase'),
	Lfs	= require('larvitfs'),
	log	= require('winston'),
	url	= require('url'),
	fs	= require('fs');

function Api(options, cb) {
	const	that	= this;

	let	controllersFullPath,
		lfs;

	that.options	= options;

	if ( ! cb) cb = function () {};

	if ( ! that.options.routerOptions)	{ that.options.routerOptions	= {};	}
	if ( ! that.options.routerOptions.controllersPath)	{ that.options.routerOptions.controllersPath	= 'controllers';	}
	if ( ! that.options.routerOptions.basePath)	{ that.options.routerOptions.basePath	= process.cwd();	}
	if ( ! Array.isArray(that.options.routerOptions.routes))	{ that.options.routerOptions.routes	= [];	}

	if ( ! that.options.lBaseOptions) that.options.lBaseOptions = {};

	if ( ! Array.isArray(that.options.lBaseOptions.middleware)) {
		that.options.lBaseOptions.middleware	= [];
	}

	// Instantiate lfs
	lfs	= new Lfs({'basePath': that.options.routerOptions.basePath});

	// Resolve apiVersions
	controllersFullPath	= that.options.routerOptions.basePath + '/' + that.options.routerOptions.controllersPath;
	that.apiVersions	= fs.readdirSync(controllersFullPath).filter(function (file) {
		if (
			fs.statSync(controllersFullPath + '/' + file).isDirectory()
			&& semver.clean(semver.valid(file)) !== null
		) {
			return true;
		} else {
			return false;
		}
	});

	// Sort apiVersions
	that.apiVersions.sort(function (a, b) {
		return semver.gt(a, b);
	});

	// Instantiate the router
	that.router	= new Router(that.options.routerOptions);

	// Default to the latest version of the API
	that.options.lBaseOptions.middleware.push(function (req, res, cb) {
		if ( ! semver.valid(req.url.split('/')[1]) && that.apiVersions.length) {
			req.url	= '/' + that.apiVersions[that.apiVersions.length - 1] + req.url;
		}
		cb();
	});

	// Parse url (Vill man kanske göra det i base ist?)
	that.options.lBaseOptions.middleware.push(function (req, res, cb) {
		let protocol,
			host;

		if (req.connection && req.connection.encrypted) {
			protocol	= 'https';
		} else {
			protocol	= 'http';
		}

		if (req.headers && req.headers.host) {
			host	= req.headers.host;
		} else {
			host	= 'localhost';
		}

		req.urlParsed = url.parse(protocol + '://' + host + req.url, true);
		cb();
	});

	// Route the request
	that.options.lBaseOptions.middleware.push(function (req, res, cb) {
		let	readmeFile	= false;

		// Check if url is matching a directory that contains a README.md
		if (req.url === '/' && lfs.getPathSync(that.options.routerOptions.basePath + '/README.md')) {
			readmeFile	= that.options.routerOptions.basePath + '/README.md';
		} else if (lfs.getPathSync('controllers' + req.url + '/README.md')) {
			readmeFile	= lfs.getPathSync('controllers' + req.url + '/README.md');
		}

		// If a readme file is found, send that to the browser and end the request
		if (readmeFile) {
			res.setHeader('Content-Type', 'text/markdown; charset=UTF-8');
			return fs.readFile(readmeFile, function (err, data) {
				if (err) return cb(err);
				res.end(data);
			});
		}

		that.router.resolve(req.urlParsed.pathname, function (err, result) {
			req.routed	= result;
			cb(err);
		});
	});

	// Run controller
	that.options.lBaseOptions.middleware.push(function (req, res, cb) {
		if ( ! req.routed.controllerFullPath) {
			res.statusCode	= 404;
			res.data	= 'URL endpoint not found';
		} else {
			require(req.routed.controllerFullPath)(req, res, cb);
		}
	});

	// Output JSON to client
	that.options.lBaseOptions.middleware.push(function (req, res, cb) {
		res.setHeader('Content-Type', 'application/json; charset=UTF-8');
		res.end(res.data); // här måste det vara en sträng. Ska vi fixa här, i controllers eller base?
		cb();
	});

	that.lBase = new LBase(that.options.lBaseOptions, function (err) {
		if (err) return cb(err);
		log.info(logPrefix + 'API is up and running!');
		cb();
	});

	that.lBase.on('error', function (err, req, res) {
		res.statusCode = 500;
		res.end('Internal server error: ' + err.message);
	});
}

exports = module.exports = Api;
