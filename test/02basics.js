'use strict';

const request = require('request');
const path = require('path');
const async = require('async');
const test = require('tape');
const Api = require(__dirname + '/../index.js');
const fs = require('fs');
const testEnvPath = path.normalize(__dirname + '/../test_environment');

test('Get a response from a controller', t => {
	const tasks = [];
	const api = new Api({
		routerOptions: { basePath: testEnvPath + '/1' }
	});

	tasks.push(cb => {
		api.start(cb);
	});

	// Try 200 request
	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/webb', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, '{"v": "1.3.2"}');
			cb();
		});
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, err => {
		if (err) throw err;
		t.end();
	});
});

test('Get a response from a controller, ignoring url parameters', t => {
	const tasks = [];
	const api = new Api({
		routerOptions: { basePath: testEnvPath + '/1' }
	});

	tasks.push(cb => {
		api.start(cb);
	});

	// Try 200 request
	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/webb?boll', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, '{"v": "1.3.2"}');
			cb();
		});
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, err => {
		if (err) throw err;
		t.end();
	});
});

test('Get controller without version mappings', t => {
	const tasks = [];
	const api = new Api({
		// To get better test coverage, send in specific middleware array
		baseOptions: {
			middleware: []
		},

		routerOptions: {
			basePath: testEnvPath + '/2',

			// We do this explicitly to get better test coverage
			controllersPath: 'controllers',
			routes: []
		}
	});

	tasks.push(cb => {
		api.start(cb);
	});

	// Try 200 request
	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/foo', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, '{"foo":"bar"}');
			cb();
		});
	});

	// Try another to test the cache
	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/foo', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, '{"foo":"bar"}');
			cb();
		});
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, err => {
		if (err) throw err;
		t.end();
	});
});

test('Specific version request', t => {
	const tasks = [];
	const api = new Api({
		routerOptions: { basePath: testEnvPath + '/1' }
	});

	tasks.push(cb => {
		api.start(cb);
	});

	// Try 200 request
	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/0.2/wepp', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, '{"v":"0.2.0"}');
			cb();
		});
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, err => {
		if (err) throw err;
		t.end();
	});
});

test('Get specific version of README.md', t => {
	const tasks = [];
	const api = new Api({
		routerOptions: {basePath: testEnvPath + '/1'}
	});

	tasks.push(cb => {
		api.start(cb);
	});

	// Try 200 request for README.md
	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/0.2/?dal', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, 'This is old 0.2.0\n');
			cb();
		});
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, err => {
		if (err) throw err;
		t.end();
	});
});

test('Start without options', t => {
	const tasks = [];
	const api = new Api();

	tasks.push(cb => {
		api.start(cb);
	});

	// Try 200 request for README.md
	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, fs.readFileSync(__dirname + '/../README.md').toString());
			cb();
		});
	});

	// One more to get cached version
	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, fs.readFileSync(__dirname + '/../README.md').toString());
			cb();
		});
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, err => {
		if (err) throw err;
		t.end();
	});
});

test('Start without options or cb', t => {
	const tasks = [];
	const api = new Api();

	tasks.push(cb => {
		api.start(cb);
	});

	// Try 200 request for README.md
	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, fs.readFileSync(__dirname + '/../README.md').toString());
			cb();
		});
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, err => {
		if (err) throw err;
		t.end();
	});
});

test('Start with log in options sets log in router, reqParser and base', t => {
	const tasks = [];
	const LUtils = require('larvitutils');
	const lUtils = new LUtils();
	const log = new lUtils.Log({logLevel: 'info'});
	const api = new Api({ log });

	tasks.push(cb => {
		api.start(cb);
	});

	tasks.push(cb => {
		t.strictEqual(api.log, log);
		t.strictEqual(api.router.log, log);
		t.strictEqual(api.reqParser.log, log);
		t.strictEqual(api.base.log, log);
		cb();
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, err => {
		if (err) throw err;
		t.end();
	});
});

test('Start log in router, reqParser and base options overrides the one created in lib', t => {
	const tasks = [];
	const LUtils = require('larvitutils');
	const lUtils = new LUtils();
	const log = new lUtils.Log({logLevel: 'info'});
	const api = new Api({
		routerOptions: { log },
		baseOptions: { log },
		reqParserOptions: { log }
	});

	tasks.push(cb => {
		api.start(cb);
	});

	tasks.push(cb => {
		t.notStrictEqual(api.log, log);
		t.strictEqual(api.router.log, log);
		t.strictEqual(api.reqParser.log, log);
		t.strictEqual(api.base.log, log);
		cb();
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, err => {
		if (err) throw err;
		t.end();
	});
});
