'use strict';

const request = require('request');
const async = require('async');
const test = require('tape');
const path = require('path');
const Api = require(__dirname + '/../index.js');
const testEnvPath = path.normalize(__dirname + '/../test_environment');

test('Try getting a secret file', t => {
	const tasks = [];
	const api = new Api({ routerOptions: { basePath: testEnvPath + '/1' }});

	// Start server
	tasks.push(cb => {
		api.start(cb);
	});

	// Try getting secret file
	tasks.push(cb => {
		const url = 'http://localhost:' + api.base.httpServer.address().port + '/../../../../secret_folder/bang';
		request(url, (err, response, body) => {
			if (err) return cb(err);
			t.equal(response.statusCode, 404);
			t.equal(body, '"URL endpoint not found"');
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
