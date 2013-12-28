/* OS dependent file operation */

var fs=require('fs');
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
	r.push(v); if (reset) v=0;
	count--;
  } while (i<ar.length && count);
  return {data:r, adv:i };
}
var Create=function(path,opts,cb) {
	opts=opts||{};

	var readSignature=function(pos,cb) {
		var buf=new Buffer(signature_size);
		var that=this;
		fs.read(this.handle,buf,0,signature_size,pos,function(err,len,buffer){
			var signature=buffer.toString('utf8',0,signature_size);
			cb.apply(that,[signature]);
		});
	}
	var readString= function(pos,blocksize,encoding,cb) {
		encoding=encoding||'utf8';
		var buffer=new Buffer(blocksize);
		var that=this;
		fs.read(this.handle,buffer,0,blocksize,pos,function(err,len,buffer){
			cb.apply(that,[buffer.toString(encoding)]);	
		});
	}

	var readStringArray = function(pos,blocksize,encoding,cb) {
		var that=this;
		if (blocksize==0) return [];
		encoding=encoding||'utf8';
		var buffer=new Buffer(blocksize);
		fs.read(this.handle,buffer,0,blocksize,pos,function(err,len,buffer){
			var out=buffer.toString(encoding).split('\0');
			cb.apply(that,[out]);
		});
	}
	var readUI32=function(pos,cb) {
		var buffer=new Buffer(4);
		var that=this;
		fs.read(this.handle,buffer,0,4,pos,function(err,len,buffer){
			cb.apply(that,[buffer.readUInt32BE(0)]);
		});
		
	}
	var readI32=function(pos,cb) {
		var buffer=new Buffer(4);
		var that=this;
		fs.read(this.handle,buffer,0,4,pos,function(err,len,buffer){
			cb.apply(that,[buffer.readInt32BE(0)]);
		});
	}
	var readUI8=function(pos,cb) {
		var buffer=new Buffer(1);
		var that=this;
		fs.read(this.handle,buffer,0,1,pos,function(err,len,buffer){
			cb.apply(that,[buffer.readUInt8(0)]);
		});
	}
	var readBuf=function(pos,blocksize,cb) {
		var that=this;
		var buf=new Buffer(blocksize);
		fs.read(this.handle,buf,0,blocksize,pos,function(err,len,buffer){
			cb.apply(that,[buffer]);
		});
	}
	var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
		var that=this;
		readBuf.apply(this,[pos,blocksize,function(buffer){
			cb.apply(that,[unpack_int(buffer,count,reset)]);	
		}]);
		
	}
	// signature, itemcount, payload
	var readFixedArray = function(pos ,count, unitsize,cb) {
		var func=null;
		var that=this;
		
		if (unitsize* count>this.size && this.size)  {
			throw "array size exceed file size"
			return;
		}
		
		var items=new Buffer( unitsize* count);
		if (unitsize===1) {
			func=items.readUInt8;
		} else if (unitsize===2) {
			func=items.readUInt16BE;
		} else if (unitsize===4) {
			func=items.readUInt32BE;
		} else throw 'unsupported integer size';
		//console.log('itemcount',itemcount,'buffer',buffer);

		fs.read(this.handle,items,0,unitsize*count,pos,function(err,len,buffer){
			var out=[];
			for (var i = 0; i < items.length / unitsize; i++) {
				out.push( func.apply(items,[i*unitsize]));
			}
			cb.apply(that,[out]);
		});
	}

	var free=function() {
		//console.log('closing ',handle);
		fs.closeSync(this.handle);
	}
	var setupapi=function() {
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
		var that=this;
	  fs.fstat(this.handle,function(err,data){
			that.stat=data;
			that.size=that.stat.size;
			if (cb) cb(that);
		});				
	}
	this._setupapi=setupapi;
	
	//handle=fs.openSync(path,'r');
	//console.log('watching '+path);
	var that=this;
	fs.exists(path,function(exists){
		if (exists) {
			fs.open(path,'r',function(err,handle){
				that.handle=handle;
				that.opened=true;
				that._setupapi.call(that);
			});
		} else {
			fs.open('../'+path,'r',function(err,handle){
				that.handle=handle;
				that.opened=true;
				that._setupapi.call(that);
			});
		}
	});
	
	//console.log('file size',path,this.size);	
	return this;
}
module.exports=Create;
