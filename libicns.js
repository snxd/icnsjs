var fs = require('fs');
var _ = require('lodash');

exports.readItem = function(filePath, offset, next) {
	fs.open(filePath, 'r', function(status, fd) {
	    if (status) {
	        //console.log(status.message);
	        return next(status.message);
	    }
	    var buffer = new Buffer(8);
	    fs.read(fd, buffer, 0, 8, offset, function(err, num) {
	        if(err) {
	        	return next(err);
	        }

	        return next(null, buffer.toString('utf-8', 0, 4), buffer.readUInt32BE(4));
	    });
	});
};

exports.isValidIcns = function(filePath, next) {
	this.readItem(filePath, 0, function(err, label, size) {
		next(null, label === 'icns');
	});
};

exports.loadToc = function(filePath, next) {
	exports.readItem(filePath, 8, function(err, label, tocSize) {
		if(label.trim() !== 'TOC') {
			console.log(label);
			return next(new Error('Unable to find a valid TOC in file'));
		}

		var toc = [];

		fs.open(filePath, 'r', function(status, fd) {
		    if (status) {
		        //console.log(status.message);
		        return next(status.message);
		    }
		    var buffer = new Buffer(tocSize);
		    fs.read(fd, buffer, 0, tocSize, 8, function(err, num) {
		        if(err) {
		        	return next(err);
		        }

		        for(var i=8; i<tocSize; i+=8) {
		        	label = buffer.toString('utf-8', i, i+4);
		        	size = buffer.readUInt32BE(i+4);
		        	toc.push({format:label, size:size});
		        }

		        return next(null, toc);
		    });
		});
	});
};

exports.writePart = function(filePath, outputFile, offset, length) {
	fs.createReadStream(filePath, {start:offset, end:offset+length}).pipe(fs.createWriteStream(outputFile));
}

exports.printItem = function(filePath, offset) {
	this.readItem(filePath, offset, function(err, label, size) {
		if(err) {
			console.log('err ', err);
		}
		console.log(offset +' ', label, ': ', size, ' bytes');
	});
}

exports.printDetails = function(filePath) {
	_.map([0,1,2,3,4,5,6,7,8,9,10,11,12], function(n) {
		exports.printItem(filePath, n*8);
	});

	exports.printItem(filePath, 37836);
}

exports.doSimple = function() {
	exports.printDetails('./app.icns');
	exports.loadToc('./app.icns', function(err, toc) {
		console.log(toc);
	});
	//exports.writePart('./app.icns', './out.png', 37844, 25657);
}