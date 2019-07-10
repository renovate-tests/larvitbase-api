'use strict';

const request = require('request');
const async = require('async');
const path = require('path');
const test = require('tape');
const Api = require(__dirname + '/../index.js');
const testEnvPath = path.normalize(__dirname + '/../test_environment');

test('Use a controller from a dependency', function (t) {
	const tasks = [];

	let api;

	// Start server
	tasks.push(cb => {
		api = new Api({
			routerOptions: {basePath: testEnvPath + '/5'}
		});

		cb();
	});

	tasks.push(cb => {
		api.start(cb);
	});

	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/woo', function (err, response) {
			if (err) return cb(err);
			t.equal(response.statusCode, 404);
			cb();
		});
	});

	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/foo', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, '{"foo":"bar"}');
			cb();
		});
	});

	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/boo', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(JSON.parse(body).version, '1.0');
			cb();
		});
	});

	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/v1.0/boo', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(JSON.parse(body).version, '1.0');
			cb();
		});
	});

	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/v1.0/schloo', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200);
			t.equal(body, '{"woo":"buntz"}');
			cb();
		});
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('User controller from a dependency, with version', function (t) {
	const tasks = [];

	const api = new Api({ routerOptions: { basePath: testEnvPath + '/6' } });

	// Start server
	tasks.push(cb => {
		api.start(cb);
	});

	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/foo', (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 200, 'Should get 200 for http://localhost:' + api.base.httpServer.address().port + '/foo');
			t.equal(JSON.parse(body).version, '1.2', 'The resulting version should be 1.2');
			cb();
		});
	});

	tasks.push(cb => {
		request('http://localhost:' + api.base.httpServer.address().port + '/boo', function (err, response) {
			if (err) return cb(err);
			t.equal(response.statusCode, 404);
			cb();
		});
	});

	// Close server
	tasks.push(cb => {
		api.stop(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});
