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

		fs.open(filePath, 'r', function(err, fd) {
		    if (err) {
		        //console.log(status.message);
		        return next(err.message);
		    }
		    var buffer = new Buffer(tocSize);
		    fs.read(fd, buffer, 0, tocSize, 8, function(err, num) {
		        if(err) {
		        	return next(err);
		        }

		        var offset = 8;

		        for(var i=0; i<tocSize; i+=8) {
		        	label = buffer.toString('utf-8', i, i+4);
		        	size = buffer.readUInt32BE(i+4);
		        	toc.push({format:label, size:size, offset:offset});
		        	offset += size;
		        }

		        return next(null, toc);
		    });
		});
	});
};

exports.getPngReadStream = function(filePath, fetchIconType, next) {
	exports.loadToc(filePath, function(err, toc) {
		entry = _.where(toc, {format:fetchIconType});
		if(entry.length < 1) {
			return next('Icon type not found:' + fetchIconType);
		}

		//offset for icon header
		entry[0].offset += 8;
		entry[0].size -= 8;

		//var stream = fs.createReadStream(filePath, {start:entry.offset, end:entry.offset+entry.size})		
		var iconRange = {start:entry[0].offset, end:entry[0].offset+entry[0].size};
		console.log(iconRange);
		next(null, fs.createReadStream(filePath, iconRange));
	});
}

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

exports.doSimple = function() {
	//exports.printDetails('./app.icns');
	exports.loadToc('./app.icns', function(err, toc) {
		console.log(toc);
	});
	//exports.writePart('./app.icns', './out.png', 37844, 25657);
	var fmt = 'ic08';
	exports.getPngReadStream('./app.icns', fmt, function(err, stream) {
		if(err) {
			return console.log('err:', err);
		}
		stream.pipe(fs.createWriteStream(fmt + '-out.png'));
	});
}

exports.doSimple();