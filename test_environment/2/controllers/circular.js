'use strict';

exports = module.exports = function (req, res, cb) {
	res.data	= {'boll': {}};
	res.data.boll	= res.data;
	cb();
};
