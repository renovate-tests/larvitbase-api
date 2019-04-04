'use strict';

const request = require('request');
const tmpdir = require('os').tmpdir();
const async = require('async');
const test = require('tape');
const Api = require(__dirname + '/../index.js');
const testEnvPath = tmpdir + '/test_environment';

test('Use a controller from a dependency', function (t) {
	const tasks = [];

	let api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			routerOptions: {basePath: testEnvPath + '/5'}
		});

		cb();
	});

	tasks.push(function (cb) {
		api.start(cb);
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.base.httpServer.address().port + '/woo', function (err, response) {
			if (err) return cb(err);
			t.equal(response.statusCode, 404);
			cb();
		});
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.base.httpServer.address().port + '/foo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, '{"foo":"bar"}');
			cb();
		});
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.base.httpServer.address().port + '/boo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(JSON.parse(body).version, '1.0');
			cb();
		});
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.base.httpServer.address().port + '/v1.0/boo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(JSON.parse(body).version, '1.0');
			cb();
		});
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.base.httpServer.address().port + '/v1.0/schloo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, '{"woo":"buntz"}');
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

test('User controller from a dependency, with version', function (t) {
	const tasks = [];

	let api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			routerOptions: {basePath: testEnvPath + '/6'}
		});

		cb();
	});

	tasks.push(function (cb) {
		api.start(cb);
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.base.httpServer.address().port + '/foo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(JSON.parse(body).version, '1.2');
			cb();
		});
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.base.httpServer.address().port + '/boo', function (err, response) {
			if (err) return cb(err);
			t.equal(response.statusCode, 404);
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
