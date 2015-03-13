var fs = require('fs');
var _ = require('lodash');

exports.readItem = function(filePath, offset) {
	var fd = fs.openSync(filePath, 'r');
    var buffer = new Buffer(8);
    fs.readSync(fd, buffer, 0, 8, offset);
    fs.closeSync(fd);

    return {label:buffer.toString('utf-8', 0, 4), size:buffer.readUInt32BE(4)};
};

exports.isValidIcns = function(filePath) {
	var header = this.readItem(filePath, 0);

	return header.label.trim() === 'icns';
};

exports.loadToc = function(filePath) {
	var tocHeader = this.readItem(filePath, 8);
	if(tocHeader.label.trim() !== 'TOC') {
		throw new Error('Unable to find a valid TOC in file');
	}

	var toc = [];

	var fd = fs.openSync(filePath, 'r');
	    
    var buffer = new Buffer(tocHeader.size);
    var num = fs.readSync(fd, buffer, 0, tocHeader.size, 8);
	var offset = 8;

    for(var i=0; i<tocHeader.size; i+=8) {
    	var label = buffer.toString('utf-8', i, i+4);
    	var size = buffer.readUInt32BE(i+4);
    	toc.push({format:label, size:size, offset:offset});
    	offset += size;
    }

    return toc;
};

exports.getIconReadStream = function(filePath, fetchIconType) {
	var toc = this.loadToc(filePath);
	var entry = _.where(toc, {format:fetchIconType});
	if(entry.length < 1) {
		throw new Error('Icon type not found:' + fetchIconType);
	}

	//offset for icon header
	entry[0].offset += 8;
	entry[0].size -= 8;

	//var stream = fs.createReadStream(filePath, {start:entry.offset, end:entry.offset+entry.size})		
	var iconRange = {start:entry[0].offset, end:entry[0].offset+entry[0].size};
	return fs.createReadStream(filePath, iconRange);
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
	var f = './app.icns';
	var self = this;
	//exports.printDetails('./app.icns');
	console.log('valid Icns:', this.isValidIcns(f));

	var toc = this.loadToc(f);
	console.log(toc);

	/*_.map(toc, function(item) {
		var fmt = item.format;
		if(fmt.trim() === 'TOC') return;

		self.getIconReadStream(f, fmt)
			.pipe(fs.createWriteStream(fmt + '-out.png'));
	});*/
	//exports.writePart('./app.icns', './out.png', 37844, 25657);
	var fmt = 'ic08';
	this.getIconReadStream(f, fmt).pipe(fs.createWriteStream(fmt + '-out.png'));
}

exports.doSimple();