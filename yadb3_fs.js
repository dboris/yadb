/* OS dependent file operation */

if (typeof chrome!=='undefined' && chrome.fileSystem) {
	var hfs=require('./html5fs');
	var html5fs=true;
} else {
	var fs=require('fs');
}

var signature_size=1;

var unpack_int = function (ar, count , reset) {
   count=count||ar.length;
   /*
	if (typeof ijs_unpack_int == 'function') {
		var R = ijs_unpack_int(ar, count, reset)
		return R
	};
	*/
  var r = [], i = 0, v = 0;
  do {
	var shift = 0;
	do {
	  v += ((ar[i] & 0x7F) << shift);
	  shift += 7;	  
	} while (ar[++i] & 0x80);
	r.push(v|0); if (reset) v=0;
	count--;
  } while (i<ar.length && count);
  return {data:r, adv:i };
}
var Open=function(path,opts,callback) {
	
	opts=opts||{};

	var readSignature=function(pos) {
		if (html5fs) {
			buffer=hfs.readSyncronize(handle,signature_size,pos);
			var signature=String.fromCharCode((new Uint8Array(buffer))[0])
		} else {
			var buf=new  Buffer(signature_size);	
			fs.readSync(handle,buf,0,signature_size,pos);
			var signature=buf.toString('utf8',0,signature_size);
		}
		
		return signature;
	}
  var decodeutf8 = function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
 				for (var i=0;i<utftext.length;i++) {
 					if (utftext.charCodeAt(i)>127) break;
 				}
 				if (i>=utftext.length) return utftext;
 				i=0;
        while ( i < utftext.length ) {
 
            c = utftext.charCodeAt(i);
 
            if (c < 128) {
                string += utftext[i];
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
 
        }
 
        return string;
  }
	var readString= function(pos,blocksize,encoding) {
		encoding=encoding||'utf8';
		if (html5fs) {
			var buffer=hfs.readSyncronize(handle,blocksize,pos);
			if (encoding=='utf8') {
				var str=decodeutf8(String.fromCharCode.apply(null, new Uint8Array(buffer)))
			} else { //ucs2 is 3 times faster
				var str=String.fromCharCode.apply(null, new Uint16Array(buffer))	
			}
			return str;
		} else {
			var buffer=new Buffer(blocksize);
			fs.readSync(handle,buffer,0,blocksize,pos);
			return buffer.toString(encoding);
		}
	}

	var readStringArray = function(pos,blocksize,encoding) {
		if (blocksize==0) return [];
		encoding=encoding||'utf8';
		if (html5fs) {
				var buffer=hfs.readSyncronize(handle,blocksize,pos);
				if (encoding=='utf8') {
					var str=decodeutf8(String.fromCharCode.apply(null, new Uint8Array(buffer)))
				} else { //ucs2 is 3 times faster
					var str=String.fromCharCode.apply(null, new Uint16Array(buffer))	
				}		  	
		  	out=str.split('\0');
		} else {
			var buffer=new Buffer(blocksize);
			fs.readSync(handle,buffer,0,blocksize,pos);
			var out=buffer.toString(encoding).split('\0');			
		}
		return out;
	}

	var readUI32=function(pos) {
		if (html5fs) {
			var buffer=hfs.readSyncronize(handle,4,pos);
				//v=(new Uint32Array(buffer))[0];
			return new DataView(buffer).getUint32(0, false);
		} else {
			var buffer=new Buffer(4);
			fs.readSync(handle,buffer,0,4,pos);
			return buffer.readUInt32BE(0);
		}
	}

	var readI32=function(pos) {
		if (html5fs) {
			var buffer=hfs.readSyncronize(handle,4,pos);
				//v=(new Uint32Array(buffer))[0];
			return new DataView(buffer).getInt32(0, false);
		} else {
			var buffer=new Buffer(4);
			fs.readSync(handle,buffer,0,4,pos);
			return buffer.readInt32BE(0);
		}		
	}
	var readUI8=function(pos) {
		if (html5fs) {
			var buffer=hfs.readSyncronize(handle,1,pos);
			return (new Uint8Array(buffer))[0] ;
		} else {
			var buffer=new Buffer(1);
			fs.readSync(handle,buffer,0,1,pos);
			return buffer.readUInt8(0);
		}	

	}
	var readBuf=function(pos,blocksize) {
		if (html5fs) {
			var buffer=hfs.readSyncronize(handle,blocksize,pos);
			buf=new Uint8Array(buffer);
		} else {
			var buf=new Buffer(blocksize);
			fs.readSync(handle,buf,0,blocksize,pos);
		}
	
		return buf;
	}
	var readBuf_packedint=function(pos,blocksize,count,reset) {
		var buf=readBuf(pos,blocksize);
		return unpack_int(buf,count,reset);
	}
	var readFixedArray_html5fs=function(pos,count,unitsize) {
		var func=null;
		if (unitsize===1) {
			func='getUint8';//Uint8Array;
		} else if (unitsize===2) {
			func='getUint16';//Uint16Array;
		} else if (unitsize===4) {
			func='getUint32';//Uint32Array;
		} else throw 'unsupported integer size';

		var buffer=hfs.readSyncronize(handle,unitsize*count,pos);
		var out=[];
		var view=new DataView(buffer);
		for (var i = 0; i < count; i++) { //endian problem
			out.push( v=view[func](i,false) );
		}

		return out;
	}
	// signature, itemcount, payload
	var readFixedArray = function(pos ,count, unitsize) {
		var func;
		
		if (unitsize* count>this.size && this.size)  {
			throw "array size exceed file size"
			return;
		}
		if (html5fs) return readFixedArray_html5fs.apply(this,[pos,count,unitsize]);

		var items=new Buffer( unitsize* count);
		if (unitsize===1) {
			func=items.readUInt8;
		} else if (unitsize===2) {
			func=items.readUInt16BE;
		} else if (unitsize===4) {
			func=items.readUInt32BE;
		} else throw 'unsupported integer size';
		//console.log('itemcount',itemcount,'buffer',buffer);
		fs.readSync(handle,items,0,unitsize*count,pos);
		var out=[];
		for (var i = 0; i < items.length / unitsize; i++) {
			out.push( func.apply(items,[i*unitsize]) );
		}
		return out;
	}
	var free=function() {
		if (html5fs) {
			hfs.close(handle);
		}else{
			fs.closeSync(handle);	
		}
	}
	
	this.readSignature=readSignature;
	this.readI32=readI32;
	this.readUI32=readUI32;
	this.readUI8=readUI8;
	this.readBuf=readBuf;
	this.readBuf_packedint=readBuf_packedint;
	this.readFixedArray=readFixedArray;
	this.readString=readString;
	this.readStringArray=readStringArray;
	this.signature_size=signature_size;
	this.free=free;
	var handle=null;
	if (html5fs) {
		var that=this;
		hfs.open(path,'r',function(err,h) {
			handle=h;
			that.stat=hfs.fstatSync(h);
			that.size=that.stat.size;
			callback(that);
		},opts.inMemory);
	} else {
		handle=fs.openSync(path,'r');	
		this.stat=fs.fstatSync(handle);
		this.size=this.stat.size;
		if (callback) callback(this);
	}
	
	return this;
}
module.exports=Open;
