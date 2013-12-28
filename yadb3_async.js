/*
	YADB version 3.0 GPL
	yapcheahshen@gmail.com
	2013/12/28
	asyncronize version of yadb
*/


var Yfs=require('./yadb3_fs_async');	


var DT={
	uint8:'1', //unsigned 1 byte integer
	int32:'4', // signed 4 bytes integer
	utf8:'8',  
	ucs2:'2',
	bool:'^', 
	blob:'&',
	utf8arr:'*', //shift of 8
	ucs2arr:'@', //shift of 2
	uint8arr:'!', //shift of 1
	int32arr:'$', //shift of 4
	vint:'`',
	pint:'~',	

	array:'\u001b',
	object:'\u001a' 
	//ydb start with object signature,
	//type a ydb in command prompt shows nothing
}

var Create=function(path,opts,createcb) {
	/* loadxxx functions move file pointer */
	// load variable length int
	
	var loadVInt =function(blocksize,count,cb) {
		//if (count==0) return [];
		this.fs.readBuf_packedint(this.cur,blocksize,count,true,function(o){
			that.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	var loadVInt1=function(cb) {
		var that=this;
		loadVInt(6,1,function(data){
			cb.apply(that,[data[0]]);
		})
	}
	//for postings
	var loadPInt =function(blocksize,count,cb) {
		var that=this;
		this.fs.readBuf_packedint(this.cur,blocksize,count,false,function(o){
			that.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	// item can be any type (variable length)
	// maximum size of array is 1TB 2^40
	// structure:
	// signature,5 bytes offset, payload, itemlengths
	var loadArray = function(blocksize,lazy) {
		var lengthoffset=this.fs.readUI8(this.cur)*4294967296;
		lengthoffset+=this.fs.readUI32(cur+1);
		this.cur+=5;
		var dataoffset=this.cur;
		this.cur+=lengthoffset;
		var count=loadVInt1();
		var sz=loadVInt(count*6,count);
		var o=[];
		var endcur=this.cur;
		this.cur=dataoffset; 
		for (var i=0;i<count;i++) {
			if (lazy) { 
				//store the offset instead of loading from disk
				var offset=dataoffset;
				for (var i=0;i<sz.length;i++) {
				//prefix with a \0, impossible for normal string
					o.push("\0"+offset.toString(16)
						   +"\0"+sz[i].toString(16));
					offset+=sz[i];
				}
			} else {			
				o.push(load({blocksize:sz[i]}));
			}
		}
		this.cur=endcur;
		return o;
	}		
	// item can be any type (variable length)
	// support lazy load
	// structure:
	// signature,5 bytes offset, payload, itemlengths, 
	//                    stringarray_signature, keys
	var loadObject = function(blocksize,lazy, keys) {
		var start=this.cur;
		var lengthoffset=this.fs.readUI8(this.cur)*4294967296;
		lengthoffset+=this.fs.readUI32(this.cur+1);this.cur+=5;
		var dataoffset=this.cur;
		this.cur+=lengthoffset;
		var count=loadVInt1();
		var lengths=loadVInt(count*6,count);
		var keyssize=blocksize-this.cur+start;	
		var K=load({blocksize:keyssize});
		var o={};
		var endcur=this.cur;
		
		if (lazy) { 
			//store the offset instead of loading from disk
			var offset=dataoffset;
			for (var i=0;i<lengths.length;i++) {
				//prefix with a \0, impossible for normal string
				o[K[i]]="\0"+offset.toString(16)
					   +"\0"+lengths[i].toString(16);
				offset+=lengths[i];
			}
		} else {
			this.cur=dataoffset; 
			for (var i=0;i<count;i++) {
				o[K[i]]=(load({blocksize:lengths[i]}));
			}
		}
		if (keys) K.map(function(r) { keys.push(r)});
		this.cur=endcur;
		return o;
	}		
	//item is same known type
	var loadStringArray=function(blocksize,encoding,cb) {
		var that=this;
		this.fs.readStringArray(this.cur,blocksize,encoding,function(o){
			that.cur+=blocksize;
			cb.apply(that,[o]);
		});
	}
	var loadIntegerArray=function(blocksize,unitsize,cb) {
		var that=this;
		loadVInt1(function(count){
			var o=that.fs.readFixedArray(that.cur,count,unitsize,function(o){
				that.cur+=count*unitsize;
				cb.apply(that,[o]);
			});
		});

	}
	var loadBlob=function(blocksize,cb) {
		var o=this.fs.readBuf(this.cur,blocksize);
		this.cur+=blocksize;
		return o;
	}	
	var loadbysignature=function(opts,signature,cb) {
		  var blocksize=opts.blocksize||this.fs.size; 
			this.cur+=this.fs.signature_size;
			var datasize=blocksize-that.fs.signature_size;
			//basic types
			if (signature===DT.int32) {
				this.cur+=4;
				this.fs.readI32(this.cur-4,cb);
			} else if (signature===DT.uint8) {
				this.cur++;
				this.fs.readUI8(this.cur-1,cb);
			} else if (signature===DT.utf8) {
				var c=this.cur;this.cur+=datasize;
				this.fs.readString(c,datasize,'utf8',cb);	
			} else if (signature===DT.ucs2) {
				var c=this.cur;this.cur+=datasize;
				this.fs.readString(c,datasize,'ucs2',cb);	
			} else if (signature===DT.bool) {
				this.cur++;
				this.fs.readUI8(this.cur-1,function(data){cb(!!data)});
			} else if (signature===DT.blob) {
				loadBlob(datasize,cb);
			}
			//variable length integers
			else if (signature===DT.vint) {
				loadVInt.apply(this,[datasize,null,cb]);
			}
			else if (signature===DT.pint) {
				loadPInt.apply(this,[datasize,null,cb]);
			}
			//simple array
			else if (signature===DT.utf8arr) {
				loadStringArray.apply(this,[datasize,'utf8',cb]);
			}
			else if (signature===DT.ucs2arr) {
				loadStringArray.apply(this,[datasize,'ucs2',cb]);
			}
			else if (signature===DT.uint8arr) {
				loadIntegerArray.apply(this,[datasize,1,cb]);
			}
			else if (signature===DT.int32arr) {
				loadIntegerArray.apply(this,[datasize,4,cb]);
			}
			//nested structure
			else if (signature===DT.array) {
				loadArray.apply(this,[datasize,opts.lazy,cb]);
			}
			else if (signature===DT.object) {
				loadObject.apply(this,[datasize,opts.lazy,opts.keys,cb]);
			}
			else throw 'unsupported type '+signature;
	}
	var load=function(opts,cb) {
		opts=opts||{};
		var that=this;
		this.fs.readSignature(this.cur, function(signature){
			loadbysignature.apply(that,[opts,signature,cb])
		});
		return this;
	}
	var CACHE=null;
	var KEYS={};
	var reset=function() {
		this.cur=0;
		CACHE=load({lazy:true});
	}
	var getall=function() {
		var output={};
		var keys=getkeys();
		for (var i in keys) {
			output[keys[i]]= get([keys[i]],true);
		}
		return output;
		
	}
	var exists=function(path) {
		if (path.length==0) return true;
		var key=path.pop();
		get(path);
		if (!path.join('\0')) return (!!KEYS[key]);
		var keys=KEYS[path.join('\0')];
		path.push(key);//put it back
		if (keys) return (keys.indexOf(key)>-1);
		else return false;
	}
	var get=function(path,recursive) {
		if (typeof path=='undefined') path=[];
		recursive=recursive||false;
		if (!CACHE) reset();	
		var o=CACHE;
		if (path.length==0 &&recursive) return getall();
		var pathnow="";
		for (var i=0;i<path.length;i++) {
			var r=o[path[i]] ;

			if (r===undefined) return undefined;
			if (parseInt(i)) pathnow+="\0";
			pathnow+=path[i];
			if (typeof r=='string' && r[0]=="\0") { //offset of data to be loaded
				var keys=[];
				var p=r.substring(1).split("\0").map(
					function(item){return parseInt(item,16)});
				this.cur=p[0];
				var lazy=!recursive || (i<path.length-1) ;
				o[path[i]]=load({lazy:lazy,blocksize:p[1],keys:keys});
				KEYS[pathnow]=keys;
				o=o[path[i]];
			} else {
				o=r; //already in cache
			}
		}
		return o;
	}
	// get all keys in given path
	var getkeys=function(path) {
		if (!path) path=[]
		get(path); // make sure it is loaded
		if (path && path.length) {
			return KEYS[path.join("\0")];
		} else {
			return Object.keys(CACHE); 
			//top level, normally it is very small
		}
		
	}

	var setupapi=function() {
		this.load=load;
		this.cur=0;
		this.cache=function() {return CACHE};
		this.free=function() {
			CACHE=null;
			KEYS=null;
			this.fs.free();
		}
		this.keys=getkeys;
		this.get=get;   // get a field, load if needed
		this.getJSON=get; //compatible with yadb2
		this.exists=exists;
		createcb(this);
	}

	this._setupapi=setupapi;

	var that=this;

	var yfs=new Yfs(path,opts,function(yfs){
		that.fs=yfs;
		that.size=yfs.size;
		that._setupapi.call(that);
	});
	
	return this;
}

Create.datatypes=DT;

if (module) module.exports=Create;
//return Create;
