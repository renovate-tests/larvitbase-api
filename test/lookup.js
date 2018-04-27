'use strict';

const	request	= require('request'),
	async	= require('async'),
	test	= require('tape'),
	Api	= require(__dirname + '/../index.js');

test('User controller from a dependency', function (t) {
	const	tasks	= [];

	let	api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			'routerOptions':	{'basePath': __dirname + '/../test_environment/5'}
		});

		cb();
	});

	tasks.push(function (cb) {
		api.start(cb);
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.lBase.httpServer.address().port + '/woo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body,	'{"woo":"untz"}');
			cb();
		});
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.lBase.httpServer.address().port + '/foo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body,	'{"foo":"bar"}');
			cb();
		});
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.lBase.httpServer.address().port + '/boo', function (err, response) {
			if (err) return cb(err);
			t.equal(response.statusCode,	404);
			cb();
		});
	});

	tasks.push(function (cb) {
		request('http://localhost:' + api.lBase.httpServer.address().port + '/v1.0/schloo', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body,	'{"woo":"buntz"}');
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
