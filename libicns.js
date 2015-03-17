var fs = require('fs');
var _ = require('lodash');
var magick = require('imagemagick-stream');

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

exports.isPng = function(filePath, offset) {
	var fd = fs.openSync(filePath, 'r');
    var buffer = new Buffer(8);
    var magicPNG = [0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A];
    fs.readSync(fd, buffer, 0, 8, offset);
    fs.closeSync(fd);

    return _.isEqual(magicPNG, buffer.toJSON());
}

exports.loadToc = function(filePath) {
	var tocHeader = this.readItem(filePath, 8);
	if(tocHeader.label.trim() !== 'TOC') {
		return this.loadTocManual(filePath);
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

exports.loadTocManual = function(filePath) {
	var fileHeader = this.readItem(filePath, 0);
	//var tocHeader = this.readItem(filePath, 8);
	var toc = [];
	var offset = 8;

	while(offset < fileHeader.size) {
		var entry = this.readItem(filePath, offset);
		toc.push({format:entry.label, size:entry.size, offset:offset});
		offset += entry.size;
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

	if(true || this.isPng(filePath, iconRange.start)) {
		return fs.createReadStream(filePath, iconRange);
	}
	else {

			var format = magick().outputFormat('PNG');
			
		return fs.createReadStream(filePath, iconRange).pipe(format);


		
	}
	
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
	//var f = './app3.icns';
	var self = this;
	//exports.printDetails('./app.icns');
	//console.log('valid Icns:', this.isValidIcns(f));

	//_.map(['./app.icns', './app2.icns'], function(f) {console.log(f, self.loadToc(f))});

	//console.log(this.isPng('./app.icns', 37836 + 8));

	/*_.map(toc, function(item) {
		var fmt = item.format;
		if(fmt.trim() === 'TOC') return;

		self.getIconReadStream(f, fmt)
			.pipe(fs.createWriteStream(fmt + '-out.png'));
	});*/
	//exports.writePart('./app.icns', './out.png', 37844, 25657);
	var fmt = 'ic08';
	_.map(['./app2.icns'], function(f) {
		try {
			self.getIconReadStream(f, fmt).pipe(fs.createWriteStream(f + '-' + fmt + '-out.png'));
		}
		catch(ex) {
			console.log("ex", ex);
		}
		
	});

}

//exports.doSimple();