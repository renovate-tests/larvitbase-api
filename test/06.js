'use strict';

const freeport = require('freeport');
const request = require('request');
const tmpdir = require('os').tmpdir();
const async = require('async');
const test = require('tape');
const Api = require(__dirname + '/../index.js');
const testEnvPath = tmpdir + '/test_environment';

test('Get README.md on /', function (t) {
	const tasks = [];

	let api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			routerOptions: {basePath: testEnvPath + '/1'}
		});

		cb();
	});

	tasks.push(function (cb) {
		api.start(cb);
	});

	// Try 200 request for README.md
	tasks.push(function (cb) {
		request('http://localhost:' + api.base.httpServer.address().port + '/', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, 'This is it\n');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		api.stop(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get 200 OK and hard coded string when README.md not found', function (t) {
	const tasks = [];

	let port;
	let api;

	// Get random free port to use manually when starting server to test that
	tasks.push(function (cb) {
		freeport(function (err, result) {
			port = result;
			cb(err);
		});
	});

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			baseOptions: {httpOptions: port},
			routerOptions: {basePath: testEnvPath + '/2'}
		});

		cb();
	});

	tasks.push(function (cb) {
		api.start(cb);
	});

	// Try 200 request for README.md
	tasks.push(function (cb) {
		request('http://localhost:' + port + '/', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, 'API is up and running. This API contains no README.md');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		api.stop(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('Get specific version of README.md', function (t) {
	const tasks = [];

	let api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			routerOptions: {basePath: testEnvPath + '/1'}
		});

		cb();
	});

	tasks.push(function (cb) {
		api.start(cb);
	});

	// Try 200 request for README.md
	tasks.push(function (cb) {
		request('http://localhost:' + api.base.httpServer.address().port + '/0.2/', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, 'This is old 0.2.0\n');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		api.stop(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});
