'use strict';

const	request	= require('request'),
	async	= require('async'),
	test	= require('tape'),
	Api	= require(__dirname + '/../index.js');

test('404 for old version', function (t) {
	const	tasks	= [];

	let	api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			'routerOptions':	{'basePath': __dirname + '/../test_environment/1'}
		}, cb);
	});

	// Try 404 request
	tasks.push(function (cb) {
		request('http://localhost:' + api.lBase.httpServer.address().port + '/wepp', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	404);
			t.equal(body,	'"URL endpoint not found"');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		api.lBase.httpServer.close(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('404 for non existing url', function (t) {
	const	tasks	= [];

	let	api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			'routerOptions':	{'basePath': __dirname + '/../test_environment/1'}
		}, cb);
	});

	// Try 404 request
	tasks.push(function (cb) {
		request('http://localhost:' + api.lBase.httpServer.address().port + '/turbojugend', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	404);
			t.equal(body,	'"URL endpoint not found"');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		api.lBase.httpServer.close(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('500 error when controller is borked', function (t) {
	const	tasks	= [];

	let	api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			'routerOptions':	{'basePath': __dirname + '/../test_environment/2'}
		});
		cb(); // Running this outside to get better test coverage
	});

	// Try broken request
	tasks.push(function (cb) {
		request('http://localhost:' + api.lBase.httpServer.address().port + '/broken', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	500);
			t.equal(body,	'"Internal server error: this should happend"');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		api.lBase.httpServer.close(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('500 error if something is wrong with the README file', function (t) {
	const	tasks	= [];

	let	api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			'routerOptions':	{'basePath': __dirname + '/../test_environment/4'}
		}, cb);
	});

	// Try broken request
	tasks.push(function (cb) {
		request('http://localhost:' + api.lBase.httpServer.address().port + '/lurk', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	500);
			t.equal(body.substring(0, 49),	'"Internal server error: EACCES: permission denied');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		api.lBase.httpServer.close(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});

test('500 error when controller data is circular', function (t) {
	const	tasks	= [];

	let	api;

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			'routerOptions':	{'basePath': __dirname + '/../test_environment/2'}
		});
		cb(); // Running this outside to get better test coverage
	});

	// Try broken request
	tasks.push(function (cb) {
		request('http://localhost:' + api.lBase.httpServer.address().port + '/circular', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	500);
			t.equal(body,	'"Internal server error: Converting circular structure to JSON"');
			cb();
		});
	});

	// Close server
	tasks.push(function (cb) {
		api.lBase.httpServer.close(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});
