'use strict';

const topLogPrefix = 'larvitbase-api: ./index.js: ';
const ReqParser = require('larvitreqparser');
const Router = require('larvitrouter');
const semver = require('semver');
const LBase = require('larvitbase');
const path = require('path');
const Lfs = require('larvitfs');
const fs = require('fs');
const LUtils = require('larvitutils');

function Api(options) {
	const logPrefix = topLogPrefix + 'Api() - ';

	this.routeCache = {};

	if (!options) {
		options = {};
	}

	this.options = options;

	if (!options.log) {
		const lUtils = new LUtils();
		options.log = new lUtils.Log();
	}
	const log = this.log = options.log;

	if (!options.routerOptions) { options.routerOptions = {}; }
	if (!options.routerOptions.controllersPath) { options.routerOptions.controllersPath = 'controllers'; }
	if (!options.routerOptions.basePath) { options.routerOptions.basePath = process.cwd(); }
	if (!Array.isArray(options.routerOptions.routes)) { options.routerOptions.routes = []; }

	if (!options.baseOptions) options.baseOptions = {};
	if (!Array.isArray(options.baseOptions.middleware)) {
		options.baseOptions.middleware = [];
	}

	if (!options.reqParserOptions) { options.reqParserOptions = {}; }

	if (!options.baseOptions.log) { options.baseOptions.log = log; }
	if (!options.routerOptions.log) { options.routerOptions.log = log; }
	if (!options.reqParserOptions.log) { options.reqParserOptions.log = log; }

	this.middleware = options.baseOptions.middleware;

	// Instantiate lfs
	const lfs = new Lfs({ basePath: options.routerOptions.basePath });
	const altControllerPaths = lfs.getPathsSync('controllers');

	// Resolve apiVersions
	const controllersFullPath = path.join(options.routerOptions.basePath, options.routerOptions.controllersPath);
	if (fs.existsSync(controllersFullPath)) {
		this.apiVersions = fs.readdirSync(controllersFullPath).filter(file => {
			let versionStr = semver.clean(String(file) + '.0');

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
		this.apiVersions = [];
		log.info(logPrefix + 'No controllers folder detected');
	}

	// Sort apiVersions
	this.apiVersions.sort((a, b) => semver.gt(a + '.0', b + '.0'));

	// Instantiate the router
	this.router = new Router(options.routerOptions);

	// Instantiate the request parser
	this.reqParser = new ReqParser(options.reqParserOptions);

	this.middleware.push((req, res, cb) => {
		this.reqParser.parse(req, res, cb);
	});

	// Default to the latest version of the API
	this.middleware.push((req, res, cb) => {
		if (!semver.valid(req.url.split('/')[1] + '.0') && this.apiVersions.length) {
			req.url = '/' + this.apiVersions[this.apiVersions.length - 1] + req.url;
		}
		req.apiVersion = req.url.split('/')[1];
		req.urlBase = req.url.split('?')[0];
		cb();
	});

	// Route the request
	this.middleware.push((req, res, cb) => {
		let readmeFile = false;

		// Use cache first
		if (this.routeCache[req.urlBase]) {
			const rc = this.routeCache[req.urlBase];

			if (rc.type === 'readme') {
				res.setHeader('Content-Type', 'text/markdown; charset=UTF-8');
				res.end(rc.data);

				return;
			} else {
				req.routed = this.routeCache[req.urlBase];

				return cb();
			}
		}

		// Clean cache if more than 1000 entries to avoid ddos or such
		if (Object.keys(this.routeCache).length > 1000) {
			this.routeCache = {};
		}

		// Check if url is matching a directory that contains a README.md

		// Request directly on root, existing README.md in root
		if (req.urlBase === '/' && lfs.getPathSync(path.join(options.routerOptions.basePath, '/README.md'))) {
			readmeFile = path.join(options.routerOptions.basePath, '/README.md');
		// README exists on exactly the version URL requested
		} else if (lfs.getPathSync(path.join(req.urlBase, '/README.md').substring(1))) {
			readmeFile = lfs.getPathSync(path.join(req.urlBase, '/README.md').substring(1));
		} else if (lfs.getPathSync(path.join('controllers/', req.urlBase, '/README.md'))) {
			readmeFile = lfs.getPathSync(path.join('controllers/', req.urlBase, '/README.md'));

		// Get readme directly from root, if it is missing in version folders
		// AND requested url is exactly a version-url
		} else if (semver.valid(req.url.split('/')[1] + '.0') && lfs.getPathSync('README.md') && req.urlBase === '/' + req.urlBase.split('/')[1] + '/') {
			readmeFile = lfs.getPathSync('README.md');

		// Get hard coded string if root or version-url is requested and README.md is missing
		// AND requested url is exactly a version-url
		} else if (req.urlBase === '/' || (semver.valid(req.url.split('/')[1] + '.0') && req.urlBase === '/' + req.url.split('/')[1] + '/')) {
			return res.end('API is up and running. This API contains no README.md');
		}

		// If a readme file is found, send this to the browser and end the request
		if (readmeFile) {
			res.setHeader('Content-Type', 'text/markdown; charset=UTF-8');

			return fs.readFile(readmeFile, (err, data) => {
				if (err) return cb(err);

				this.routeCache[req.urlBase] = {
					type: 'readme',
					data: data
				};
				res.end(data);
			});
		}

		this.router.resolve(req.urlBase, (err, result) => {
			if (err) return cb(err);

			// If nothing is found, check in the alternative controller paths
			if (Object.keys(result).length === 0) {
				for (let i = 0; altControllerPaths[i] !== undefined; i++) {
					let stat;

					if (!fs.existsSync(altControllerPaths[i])) continue;

					stat = fs.statSync(altControllerPaths[i]);

					if (stat.isDirectory()) {
						const urlBase = path.join(altControllerPaths[i], req.urlBase);

						// Security check for relative paths above the alternative controller path
						if (!urlBase.startsWith(altControllerPaths[1])) {
							log.info(logPrefix + 'SECURITY! Intruder detection, path above the controller path is trying to be obtained, via: "' + req.urlBase + '"');
							break;
						}

						// Check if file exists without version no in the controllers path
						if (fs.existsSync(path.join(altControllerPaths[i], req.urlBase) + '.js')) {
							req.routed = {
								controllerFullPath: path.join(altControllerPaths[i], req.urlBase) + '.js',
								controllerPath: req.urlBase
							};
							this.routeCache[req.urlBase] = req.routed; // Add to cache
							break;
						}
					}
				}
			}

			if (!req.routed) {
				this.routeCache[req.urlBase] = result;
				req.routed = result;
			}

			cb();
		});
	});

	// Run controller
	this.middleware.push((req, res, cb) => {
		if (!req.routed.controllerFullPath) {
			res.statusCode = 404;
			res.data = '"URL endpoint not found"';
			cb();
		} else {
			require(req.routed.controllerFullPath)(req, res, cb);
		}
	});

	// Output JSON to client
	this.middleware.push((req, res, cb) => {
		let sendData = res.data;

		res.setHeader('Content-Type', 'application/json; charset=UTF-8');

		try {
			if (typeof sendData !== 'string' && !Buffer.isBuffer(sendData)) {
				sendData = JSON.stringify(sendData);
			}
		} catch (err) {
			return cb(err);
		}

		res.end(sendData);
		cb();
	});

	// Clean up if file storage is used by parser
	this.middleware.push((req, res, cb) => {
		this.reqParser.clean(req, res, cb);
	});
};

Api.prototype.start = function start(cb) {
	const options = this.options;

	this.base = new LBase(options.baseOptions);

	this.base.start(cb);

	this.base.on('error', (err, req, res) => {
		res.statusCode = 500;
		res.end('"Internal server error: ' + err.message + '"');
	});
};

Api.prototype.stop = function (cb) {
	this.base.httpServer.close(cb);
};

exports = module.exports = Api;
