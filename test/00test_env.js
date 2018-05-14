'use strict';

const	fs	= require('fs'),
	tmpdir	= require('os').tmpdir(),
	rimraf	= require('rimraf'),
	unzip	= require('unzip'),
	async	= require('async'),
	test	= require('tape');

test('Extract test environment to tmp folder', function (t) {
	const testEnvPath = tmpdir + '/test_environment',
		tasks	= [];

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

		readStream = fs.createReadStream(__dirname + '/../test_environment.zip').pipe(unzip.Extract({'path': tmpdir}));

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