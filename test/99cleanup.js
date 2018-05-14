'use strict';

const rimraf = require('rimraf'),
	tmpdir	= require('os').tmpdir(),
	test	= require('tape'),
	fs	= require('fs');

test('Remove test_environment folder', function (t) {
	const testEnvPath	= tmpdir + '/test_environment';

	if (fs.existsSync(testEnvPath)) {
		rimraf(testEnvPath, function (err) {
			if (err) throw err;
			t.equal(fs.existsSync(testEnvPath), false);
			t.end();
		});
	} else {
		t.end();
	}
});