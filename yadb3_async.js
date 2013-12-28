/*
	YADB version 3.0 GPL
	yapcheahshen@gmail.com
	2013/12/28
	asyncronize version of yadb, for HTML5 FileAPI
*/
var Yfs=require('./yadb3_fs_async');	
var Q=require('q');
/*
remove dependency of Q
http://stackoverflow.com/questions/4234619/how-to-avoid-long-nesting-of-asynchronous-functions-in-node-js
*/
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
	
	var loadVInt =function(opts,blocksize,count,cb) {
		//if (count==0) return [];
		this.fs.readBuf_packedint(opts.cur,blocksize,count,true,function(o){
			opts.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	var loadVInt1=function(opts,cb) {
		var that=this;
		loadVInt.apply(this,[opts,6,1,function(data){
			cb.apply(that,[data[0]]);
		}])
	}
	//for postings
	var loadPInt =function(opts,blocksize,count,cb) {
		var that=this;
		this.fs.readBuf_packedint(opts.cur,blocksize,count,false,function(o){
			opts.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	// item can be any type (variable length)
	// maximum size of array is 1TB 2^40
	// structure:
	// signature,5 bytes offset, payload, itemlengths
	var getArrayLength=function(opts) {
		var that=this;
		var dataoffset=0;
		var deferred=Q.defer();
		this.fs.readUI8(opts.cur,function(len){
			var lengthoffset=len*4294967296;
			opts.cur++;
			that.fs.readUI32(opts.cur,function(len){
				opts.cur+=4;
				dataoffset=opts.cur; //keep this
				lengthoffset+=len;
				opts.cur+=lengthoffset;

				loadVInt1.apply(that,[opts,function(count){
					loadVInt.apply(that,[opts,count*6,count,function(sz){						
						deferred.resolve({count:count,sz:sz,offset:dataoffset});
					}]);
				}]);
				
			});
		});
		return deferred.promise;
	}

	var loadArray = function(opts,blocksize,cb) {
		var that=this;
		getArrayLength.apply(this,[opts]).
		then(function(L){
				var o=[];
				var endcur=opts.cur;
				opts.cur=L.offset;

				if (opts.lazy) { 
						var offset=L.offset;
						L.sz.map(function(sz){
							o.push("\0"+offset.toString(16)
								   +"\0"+sz.toString(16));
							offset+=sz;
						})
				} else {
					opts.blocksize=L.sz[0];
					var result = QAload.apply(that,[opts,o]);
					for (var i=1;i<L.count;i++) {
							result= result.then( (function(sz){
								return (
									function(opt){
										console.log('sz',sz)
										opt.blocksize=sz;
										return QAload.apply(that,[opt ,o])	;				
									}
								);
							})(L.sz[i]));
					}
				}

				opts.cur=endcur;

				if (opts.lazy) cb(o);
				else {
					result.then(function(){
						cb(o);
					})
				}
			}
		)
	}		
	// item can be any type (variable length)
	// support lazy load
	// structure:
	// signature,5 bytes offset, payload, itemlengths, 
	//                    stringarray_signature, keys
	var loadObject = function(opts,blocksize,cb) {
		var that=this;
		var start=opts.cur;
		getArrayLength.apply(this,[opts]).
		then(function(L){
			//console.log(L)
			opts.blocksize=blocksize-opts.cur+start;
			load.apply(that,[opts,function(keys){ //load the keys
				var o={};
				var endcur=opts.cur;
				opts.cur=L.offset;

				if (opts.lazy) { 
					var offset=L.offset;
					for (var i=0;i<L.sz.length;i++) {
						//prefix with a \0, impossible for normal string
						o[keys[i]]="\0"+offset.toString(16)
							   +"\0"+L.sz[i].toString(16);
						offset+=L.sz[i];
					}
				} else {

					opts.blocksize=L.sz[0];
					var result = QOload.apply(that,[opts,o,keys[0]]);

					for (var i=1;i<L.count;i++) {
							result= result.then( (function(sz,key){
								return (
									function(opt){
										opt.blocksize=sz;
										return QOload.apply(that,[opt ,o , key]);
									}
								);
							})(L.sz[i], keys[i]));
					}
				}

				opts.cur=endcur;

				if (opts.lazy) cb(o);
				else {
					result.then(function(){
						cb(o);
					})
				}


			}]);

		});
	}

	//item is same known type
	var loadStringArray=function(opts,blocksize,encoding,cb) {
		var that=this;
		this.fs.readStringArray(opts.cur,blocksize,encoding,function(o){
			opts.cur+=blocksize;
			cb.apply(that,[o]);
		});
	}
	var loadIntegerArray=function(opts,blocksize,unitsize,cb) {
		var that=this;
		loadVInt1.apply(this,[opts,function(count){
			var o=that.fs.readFixedArray(opts.cur,count,unitsize,function(o){
				opts.cur+=count*unitsize;
				cb.apply(that,[o]);
			});
		}]);

	}
	var loadBlob=function(blocksize,cb) {
		var o=this.fs.readBuf(this.cur,blocksize);
		this.cur+=blocksize;
		return o;
	}	
	var loadbysignature=function(opts,signature,cb) {
		  var blocksize=opts.blocksize||this.fs.size; 
			opts.cur+=this.fs.signature_size;
			var datasize=blocksize-that.fs.signature_size;
			//basic types
			if (signature===DT.int32) {
				opts.cur+=4;
				this.fs.readI32(opts.cur-4,cb);
			} else if (signature===DT.uint8) {
				opts.cur++;
				this.fs.readUI8(opts.cur-1,cb);
			} else if (signature===DT.utf8) {
				var c=opts.cur;opts.cur+=datasize;
				this.fs.readString(c,datasize,'utf8',cb);	
			} else if (signature===DT.ucs2) {
				var c=opts.cur;opts.cur+=datasize;
				this.fs.readString(c,datasize,'ucs2',cb);	
			} else if (signature===DT.bool) {
				opts.cur++;
				this.fs.readUI8(opts.cur-1,function(data){cb(!!data)});
			} else if (signature===DT.blob) {
				loadBlob(datasize,cb);
			}
			//variable length integers
			else if (signature===DT.vint) {
				loadVInt.apply(this,[opts,datasize,null,cb]);
			}
			else if (signature===DT.pint) {
				loadPInt.apply(this,[opts,datasize,null,cb]);
			}
			//simple array
			else if (signature===DT.utf8arr) {
				loadStringArray.apply(this,[opts,datasize,'utf8',cb]);
			}
			else if (signature===DT.ucs2arr) {
				loadStringArray.apply(this,[opts,datasize,'ucs2',cb]);
			}
			else if (signature===DT.uint8arr) {
				loadIntegerArray.apply(this,[opts,datasize,1,cb]);
			}
			else if (signature===DT.int32arr) {
				loadIntegerArray.apply(this,[opts,datasize,4,cb]);
			}
			//nested structure
			else if (signature===DT.array) {
				loadArray.apply(this,[opts,datasize,cb]);
			}
			else if (signature===DT.object) {
				loadObject.apply(this,[opts,datasize,cb]);
			}
			else {
				console.log('unsupported type',signature,opts)
				//throw 'unsupported type '+signature;
			}
	}
	//promise load into array
	var QAload=function(opts,outputarray) {
		var deferred=Q.defer();

		opts=JSON.parse(JSON.stringify(opts));
		load.apply(this,[opts,function(data){
			outputarray.push(data);
			//console.log('qload data',data)
			deferred.resolve(opts);
		}]);
		return deferred.promise;
	}
	//promise load into object
	var QOload=function(opts,outputobject,key) {
		var deferred=Q.defer();

		opts=JSON.parse(JSON.stringify(opts));
		load.apply(this,[opts,function(data){
			outputobject[key]=data;
			console.log('qoload data',data)
			deferred.resolve(opts);
		}]);
		return deferred.promise;
	}

	var load=function(opts,cb) {
		opts=opts||{}; // this will served as context for entire load procedure
		opts.cur=opts.cur||0;
		var that=this;
		this.fs.readSignature(opts.cur, function(signature){
			loadbysignature.apply(that,[opts,signature,cb])
		});
		return this;
	}
	var CACHE=null;
	var KEYS={};
	var reset=function() {
		CACHE=load({cur:0,lazy:true});
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
//		this.cur=0;
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
