'use strict';

const fs = require('fs');
const tmpdir = require('os').tmpdir();
const rimraf = require('rimraf');
const unzip = require('unzip');
const async = require('async');
const test = require('tape');

test('Extract test environment to tmp folder', function (t) {
	const testEnvPath = tmpdir + '/test_environment';
	const tasks = [];

	if (fs.existsSync(testEnvPath) && fs.lstatSync(testEnvPath).isDirectory) {
		tasks.push(function (cb) {
			rimraf(testEnvPath, function (err) {
				if (err) throw err;
				t.equal(fs.existsSync(testEnvPath), false);
				cb();
			});
		});
	}

	tasks.push(function (cb) {
		let readStream;

		readStream = fs.createReadStream(__dirname + '/../test_environment.zip').pipe(unzip.Extract({path: tmpdir})); // eslint-disable-line

		readStream.on('close', function () {
			t.equal(fs.existsSync(testEnvPath), true);
			t.equal(fs.lstatSync(testEnvPath).isDirectory(), true);
			cb();
		});

		readStream.on('error', function (err) {
			if (err) throw err;
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});
