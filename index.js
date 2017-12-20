'use strict';

const	Router	= require('larvitrouter'),
	semver	= require('semver'),
	LBase	= require('larvitbase'),
	Lfs	= require('larvitfs'),
	fs	= require('fs');

function Api(options) {
	const	that	= this;

	let	controllersFullPath,
		lfs;

	that.options	= options;

	if ( ! that.options.routerOptions)	{ that.options.routerOptions	= {};	}
	if ( ! that.options.routerOptions.controllersPath)	{ that.options.routerOptions.controllersPath	= 'controllers';	}
	if ( ! that.options.routerOptions.basePath)	{ that.options.routerOptions.basePath	= process.cwd();	}
	if ( ! Array.isArray(that.options.routerOptions.routes))	{ that.options.routerOptions.routes	= [];	}

	if ( ! Array.isArray(that.options.middleware)) {
		that.options.middleware	= [];
	}

	// Instantiate lfs
	lfs	= new Lfs({'basePath': that.options.routerOptions.basePath});

	// Resolve apiVersions
	controllersFullPath	= that.options.routerOptions.basePath + '/' + that.options.routerOptions.controllersPath;
	that.apiVersions	= fs.readdirSync(controllersFullPath).filter(function (file) {
		if (
			fs.statSync(controllersFullPath + '/' + file).isDirectory()
			&& semver.valid(file)
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
	that.options.middleware.push(function (req, res, cb) {
		if ( ! semver.valid(req.url.split('/')[1]) && that.apiVersions.length) {
			req.url	= '/' + that.apiVersions[that.apiVersions.length - 1] + req.url;
		}
		cb();
	});

	// Route the request
	that.options.middleware.push(function (req, res, cb) {
		let	readmeFile	= false;

		// Check if url is matching a directory that contains a README.md
		if (req.url === '/' && lfs.getPathSync(that.options.routerOptions.basePath + '/README.md')) {
			readmeFile	= that.options.routerOptions.basePath + '/README.md';
		} else if (lfs.getPath('controllers' + req.url + '/README.md')) {
			readmeFile	= lfs.getPath('controllers' + req.url + '/README.md');
		}

		// If a readme file is found, send that to the browser and end the request
		if (readmeFile) {
			res.setHeader('Content-Type', 'text/markdown; charset=UTF-8');
			return fs.readFile(readmeFile, function (err, data) {
				if (err) return cb(err);
				res.end(data);
			});
		}

		that.router.resolve(req.url, function (err, result) {
			req.routed	= result;
			cb(err);
		});
	});

	// Run controller
	that.options.middleware.push(function (req, res, cb) {
		if ( ! req.routed.controllerFullPath) {
			res.statusCode	= 404;
			res.data	= 'URL endpoint not found';
		} else {
			require(req.routed.controllerFullPath)(req, res, cb);
		}
	});

	// Output JSON to client
	that.options.middleware.push(function (req, res, cb) {
		res.setHeader('Content-Type', 'application/json; charset=UTF-8');
		res.end(res.data);
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
