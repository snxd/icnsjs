var fs = require('fs');
var _ = require('lodash');

exports.readItem = function(filePath, offset, length, next) {
	fs.open(filePath, 'r', function(status, fd) {
	    if (status) {
	        //console.log(status.message);
	        return next(status.message);
	    }
	    var buffer = new Buffer(length);
	    fs.read(fd, buffer, 0, length, offset, function(err, num) {
	        if(err) {
	        	return next(err);
	        }

	        return next(null, buffer.toString('utf-8', 0, 4), buffer.readUInt32BE(4));
	    });
	});
};

exports.isValidIcns = function(filePath, next) {
	this.readItem(filePath, 0, 8, function(err, label, size) {

	});
};

exports.fileSize = function(filePath, next) {
	fs.open(filePath, 'r', function(status, fd) {
	    if (status) {
	        //console.log(status.message);
	        return next(status.message);
	    }
	    console.log('test');
	    var buffer = new Buffer(4);
	    fs.read(fd, buffer, 0, 4, 4, function(err, num) {
	        if(err) {
	        	return next(err);
	        }

	        return next(null, buffer.readUInt32BE(0));
	    });
	});
};

exports.readTOC = function(filePath, offset, next) {
	fs.open(filePath, 'r', function(status, fd) {
	    if (status) {
	        //console.log(status.message);
	        return next(status.message);
	    }
	    var buffer = new Buffer(4);
	    fs.read(fd, buffer, 0, 4, 4, function(err, num) {
	        if(err) {
	        	return next(err);
	        }

	        return next(null, buffer.readUInt32BE(0));
	    });
	});
};

exports.writePart = function(filePath, outputFile, offset, length) {
	fs.createReadStream(filePath, {start:offset, end:offset+length}).pipe(fs.createWriteStream(outputFile));
}

exports.printItem = function(filePath, offset, length) {
	this.readItem(filePath, offset, length, function(err, label, size) {
		if(err) {
			console.log('err ', err);
		}
		console.log(offset +' ', label, ': ', size, ' bytes');
	});
}

exports.printDetails = function(filePath) {
	_.map([0,1,2,3,4,5,6,7,8,9,10,11,12], function(n) {
		exports.printItem(filePath, n*8, 8);
	});

	exports.printItem(filePath, 37836, 8);
}