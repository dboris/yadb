/* OS dependent file operation */

if (typeof chrome !== 'undefined' && chrome.fileSystem) {
  var fs = require('./html5fs');
  var Buffer = function () {
    return ""
  };
  var html5fs = true;
} else {
  var fs = require('fs');
}

var signature_size = 1;

var unpack_int = function (ar, count, reset) {
  count = count || ar.length;
  /*
  if (typeof ijs_unpack_int == 'function') {
    var R = ijs_unpack_int(ar, count, reset)
    return R
  };
  */
  var r = [],
    i = 0,
    v = 0;
  do {
    var shift = 0;
    do {
      v += ((ar[i] & 0x7F) << shift);
      shift += 7;
    } while (ar[++i] & 0x80);
    r.push(v);
    if (reset) v = 0;
    count--;
  } while (i < ar.length && count);
  return {
    data: r,
    adv: i
  };
}

var Open = function (path, opts, opencb) {
  opts = opts || {};

  var readSignature = function (pos, cb) {
    var buf = new Buffer(signature_size);
    var that = this;
    fs.read(this.handle, buf, 0, signature_size, pos, function (err, len, buffer) {
      if (html5fs) var signature = String.fromCharCode((new Uint8Array(buffer))[0])
      else var signature = buffer.toString('utf8', 0, signature_size);
      cb.apply(that, [signature]);
    });
  }

  //this is quite slow
  //wait for StringView +ArrayBuffer to solve the problem
  //https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/ylgiNY_ZSV0
  //if the string is always ucs2
  //can use Uint16 to read it.
  //http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
  var decodeutf8 = function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;
    for (var i = 0; i < utftext.length; i++) {
      if (utftext.charCodeAt(i) > 127) break;
    }
    if (i >= utftext.length) return utftext;

    while (i < utftext.length) {

      c = utftext.charCodeAt(i);

      if (c < 128) {
        string += utftext[i];
        i++;
      } else if ((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }

    }

    return string;
  }

  var readString = function (pos, blocksize, encoding, cb) {
    encoding = encoding || 'utf8';
    var buffer = new Buffer(blocksize);
    var that = this;
    fs.read(this.handle, buffer, 0, blocksize, pos, function (err, len, buffer) {
      if (html5fs) {
        if (encoding == 'utf8') {
          var str = decodeutf8(String.fromCharCode.apply(null, new Uint8Array(buffer)))
        } else { //ucs2 is 3 times faster
          var str = String.fromCharCode.apply(null, new Uint16Array(buffer))
        }

        cb.apply(that, [str]);
      } else cb.apply(that, [buffer.toString(encoding)]);
    });
  }

  var readStringArray = function (pos, blocksize, encoding, cb) {
    var that = this;
    if (blocksize == 0) return [];
    encoding = encoding || 'utf8';
    var buffer = new Buffer(blocksize);
    fs.read(this.handle, buffer, 0, blocksize, pos, function (err, len, buffer) {
      if (html5fs) {
        if (encoding == 'utf8') {
          var str = decodeutf8(String.fromCharCode.apply(null, new Uint8Array(buffer)))
        } else { //ucs2 is 3 times faster
          var str = String.fromCharCode.apply(null, new Uint16Array(buffer))
        }
        out = str.split('\0');
      } else out = buffer.toString(encoding).split('\0');
      cb.apply(that, [out]);
    });
  }

  var readUI32 = function (pos, cb) {
    var buffer = new Buffer(4);
    var that = this;
    fs.read(this.handle, buffer, 0, 4, pos, function (err, len, buffer) {
      if (html5fs) {
        //v=(new Uint32Array(buffer))[0];
        v = new DataView(buffer).getUint32(0, false)
        cb(v);
      } else cb.apply(that, [buffer.readInt32BE(0)]);
    });
  }

  var readI32 = function (pos, cb) {
    var buffer = new Buffer(4);
    var that = this;
    fs.read(this.handle, buffer, 0, 4, pos, function (err, len, buffer) {
      if (html5fs) {
        v = new DataView(binaryArrayBuffer).getInt32(0, false)
        cb(v);
      } else cb.apply(that, [buffer.readInt32BE(0)]);
    });
  }

  var readUI8 = function (pos, cb) {
    var buffer = new Buffer(1);
    var that = this;

    fs.read(this.handle, buffer, 0, 1, pos, function (err, len, buffer) {
      if (html5fs) cb((new Uint8Array(buffer))[0]);
      else cb.apply(that, [buffer.readUInt8(0)]);
    });
  }

  var readBuf = function (pos, blocksize, cb) {
    var that = this;
    var buf = new Buffer(blocksize);
    fs.read(this.handle, buf, 0, blocksize, pos, function (err, len, buffer) {
      /*
      var buff=[];
      for (var i=0;i<len;i++) {
        buff[i]=buffer.charCodeAt(i);
      }
      */
      buff = new Uint8Array(buffer)
      cb.apply(that, [buff]);
    });
  }

  var readBuf_packedint = function (pos, blocksize, count, reset, cb) {
    var that = this;
    readBuf.apply(this, [pos, blocksize,
      function (buffer) {
        cb.apply(that, [unpack_int(buffer, count, reset)]);
      }
    ]);
  }

  var readFixedArray_html5fs = function (pos, count, unitsize, cb) {
    var func = null;
    /*
    var buf2UI32BE=function(buf,p) {
      return buf.charCodeAt(p)*256*256*256
          +buf.charCodeAt(p+1)*256*256
          +buf.charCodeAt(p+2)*256+buf.charCodeAt(p+3);
    }
    var buf2UI16BE=function(buf,p) {
      return buf.charCodeAt(p)*256
          +buf.charCodeAt(p+1);
    }
    var buf2UI8=function(buf,p) {
      return buf.charCodeAt(p);
    }
    */
    if (unitsize === 1) {
      func = 'getUint8'; //Uint8Array;
    } else if (unitsize === 2) {
      func = 'getUint16'; //Uint16Array;
    } else if (unitsize === 4) {
      func = 'getUint32'; //Uint32Array;
    } else throw 'unsupported integer size';

    fs.read(this.handle, null, 0, unitsize * count, pos, function (err, len, buffer) {
      var out = [];
      if (unitsize == 1) {
        out = new Uint8Array(buffer);
      } else {
        for (var i = 0; i < len / unitsize; i++) { //endian problem
          //  out.push( func(buffer,i*unitsize));
          out.push(v = new DataView(buffer)[func](i, false));
        }
      }
      cb.apply(that, [out]);
    });
  }

  // signature, itemcount, payload
  var readFixedArray = function (pos, count, unitsize, cb) {
    var func = null;
    var that = this;

    if (unitsize * count > this.size && this.size) {
      console.log("array size exceed file size", this.size)
      return;
    }

    if (html5fs) return readFixedArray_html5fs.apply(this, [pos, count, unitsize, cb]);

    var items = new Buffer(unitsize * count);
    if (unitsize === 1) {
      func = items.readUInt8;
    } else if (unitsize === 2) {
      func = items.readUInt16BE;
    } else if (unitsize === 4) {
      func = items.readUInt32BE;
    } else throw 'unsupported integer size';
    //console.log('itemcount',itemcount,'buffer',buffer);

    fs.read(this.handle, items, 0, unitsize * count, pos, function (err, len, buffer) {
      var out = [];
      for (var i = 0; i < items.length / unitsize; i++) {
        out.push(func.apply(items, [i * unitsize]));
      }
      cb.apply(that, [out]);
    });
  }

  var free = function () {
    //console.log('closing ',handle);
    fs.close(this.handle);
  }

  var setupapi = function () {
    this.readSignature = readSignature;
    this.readI32 = readI32;
    this.readUI32 = readUI32;
    this.readUI8 = readUI8;
    this.readBuf = readBuf;
    this.readBuf_packedint = readBuf_packedint;
    this.readFixedArray = readFixedArray;
    this.readString = readString;
    this.readStringArray = readStringArray;
    this.signature_size = signature_size;
    this.free = free;
    var that = this;
    fs.fstat(this.handle, function (err, data) {
      that.stat = data;
      that.size = that.stat.size;
      if (opencb) opencb(that);
    });
  }
  this._setupapi = setupapi;

  //handle=fs.openSync(path,'r');
  //console.log('watching '+path);
  var that = this;

  fs.open(path, 'r', function (err, handle) {
    that.handle = handle;
    that.opened = true;
    that._setupapi.call(that);
  }, opts.inMemory);

  //console.log('file size',path,this.size);  
  return this;
}
module.exports = Open;
