'use strict';

const	freeport	= require('freeport'),
	request	= require('request'),
	async	= require('async'),
	test	= require('tape'),
	log	= require('winston'),
	Api	= require(__dirname + '/../index.js');

// Set up winston
log.remove(log.transports.Console);
/**/log.add(log.transports.Console, {
	'level':	'warn',
	'colorize':	true,
	'timestamp':	true,
	'json':	false
});/**/

test('Get README.md on /', function (t) {
	const	tasks	= [];

	let	port,
		api;

	t.timeoutAfter(200);

	// Get free port
	tasks.push(function (cb) {
		freeport(function (err, result) {
			port	= result;
			cb(err);
		});
	});

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			'lBaseOptions':	{'httpOptions': port},
			'routerOptions':	{'basePath': __dirname + '/../test_environment/1'}
		}, cb);
	});

	// Try 200 request for README.md
	tasks.push(function (cb) {
		request('http://localhost:' + port + '/', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body,	'This is it\n');
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

test('Get 200 OK and hard coded string when README.md not found', function (t) {
	const	tasks	= [];

	let	port,
		api;

	t.timeoutAfter(200);

	// Get free port
	tasks.push(function (cb) {
		freeport(function (err, result) {
			port	= result;
			cb(err);
		});
	});

	// Start server
	tasks.push(function (cb) {
		api = new Api({
			'lBaseOptions':	{'httpOptions': port},
			'routerOptions':	{'basePath': __dirname + '/../test_environment/2'}
		}, cb);
	});

	// Try 200 request for README.md
	tasks.push(function (cb) {
		request('http://localhost:' + port + '/', function (err, response, body) {
			if (err) return cb(err);
			t.equal(response.statusCode,	200);
			t.equal(body,	'API is up and running. This API contains no README.md');
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
