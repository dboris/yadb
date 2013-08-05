/*
	start on 2013/2/14 at Tusita Kuching
	yapcheahshen@gmail.com
	
	ydb is designed for storing read-only JSON structure
	provide very fast access speed.
	
	design principle:
	1) no pre-sorting of keys, 
	   assuming limited amount of keys (<1K) in an object.
	2) simple cache system for hierachy objects 
	3) only object allow lazy read. make use of object to 
	   organize large structures.
*/

var vows = require('vows'),
    assert = require('assert'),
	Yadb3=require('../yadb3'),
	Yadb3_fs=require('../yadb3_fs');

console.log('yadb3 test suite');
vows.describe('yadb3 test suite').addBatch({
    'read int32': {
		topic: function () {return new Yadb3_fs('i32.ydb');},
		u32: function(topic) {
			var out=topic.readUI32(topic.signature_size);
			assert.deepEqual(out,16843009,'uint 32 '+out);
		},
		close: function(topic) { topic.free();}
	},
    'read int8': {
		topic: function () {return new Yadb3_fs('i8.ydb');},
		u8: function(topic) {
			var out=topic.readUI8(topic.signature_size);
			assert.deepEqual(out,170,'uint 8 '+out);
		},
		close: function(topic) {topic.free();}
	},
    'read utf8': {
		topic: function () {return new Yadb3_fs('utf8.ydb');},
		utf8: function(topic) {
			var out=topic.readString(topic.signature_size,3);
			assert.deepEqual(out,'abc','utf8 string '+out);
		},
		close: function(topic) {topic.free();}
	}	,
    'read ucs2': {
		topic:function(){return new Yadb3_fs('ucs2.ydb');},
		utf8: function(topic) {
			var out=topic.readString(topic.signature_size,4,'ucs2');
			assert.deepEqual(out,'一丁','ucs2 string');
		},
		close: function(topic) {topic.free();}
	},
	'load pint': { // packed integer
		topic:function(){return new Yadb3('pint.ydb');},
		vint: function(topic) {
			var out=topic.load();
			assert.deepEqual(out,[128,129],'pint'+out);
		},
		close: function(topic) {topic.free();}		
	},
	'load vint': { // integer for postings , n+1> n
		topic:function(){return new Yadb3('vint.ydb');},
		vint: function(topic) {
			var out=topic.load();
			assert.deepEqual(out,[128,1],'vint'+out);
		},
		close: function(topic) {topic.free();}		
	},	
	'utf8 string array':{
		topic:function(){return new Yadb3('arr_utf8.ydb');},
		utf8: function(topic) {
			var out=topic.load();
			//console.log(out);
			assert.deepEqual(out,['abc','xyz'],'utf8 array'+JSON.stringify(out));
		},
		close: function(topic) {
			topic.free();
		}	
	},
	'ucs2 string array':{
		topic:function(){return new Yadb3('arr_ucs2.ydb');},
		ucs2: function(topic) {
			var out=topic.load();
			//console.log(out);
			assert.deepEqual(out,['一','丁'],'ucs2 array'+JSON.stringify(out));
		},
		close: function(topic){topic.free();}	
	},
	
	'array of array of i8': {
		topic:function(){return new Yadb3('arr_arr_i8.ydb');},
		arr_arr_i8: function(topic) {
			var out=topic.load();
			assert.deepEqual(out,[[1,2,3],[4,5,6,7],[8,9]],'i8 array array'+JSON.stringify(out));
		},
		close: function(topic){topic.free();}			
	},
	
	'var array':{
		topic:function(){return new Yadb3('arr_var.ydb');},
		var_array: function(topic) {
			
			var out=topic.load();
			assert.deepEqual(out,[16843009,170,'xyz',[1,2,3]],'var array array'+JSON.stringify(out));
		},
		close: function(topic){topic.free();}	
	},
	
	'object':{
		topic:function(){return new Yadb3('obj.ydb')},
		obj: function(topic) {
			var out=topic.load();
			assert.deepEqual(out,
				{a:1,b:2,c:3},
				'simple object'+JSON.stringify(out));
		},
		close: function(topic){topic.free();}	
	}
,
	'object lazy':{
		topic:function(){return new Yadb3('obj.ydb')},
		obj: function(topic) {
			var out=topic.load({lazy:true});
			assert.deepEqual(Object.keys(out),
				['a','b','c'],
				'simple lazy object'+JSON.stringify(out));
		},
		close: function(topic){topic.free();}	
	},
	'object var':{
		topic:function(){return new Yadb3('obj_arr.ydb')},
		obj: function(topic) {
			var out=topic.load();
			assert.deepEqual(out,
				{a:[1,2,3],b:[4,5,6],c:[7,8,9]},
				'simple lazy object'+JSON.stringify(out));
		},
		close: function(topic){topic.free();}	
	},
	
	'load json':{
		topic:function(){return new Yadb3('json.ydb')},
		obj: function(topic) {
			var out=topic.load();
			console.log(out);
		},
		close: function(topic) {
			topic.free();
		}
	},
	'lazy get':{
		topic:function(){return new Yadb3('json.ydb')},
		obj: function(topic) {
			var out=topic.get();
			assert.deepEqual(Object.keys(out),
				['a','b','c','d','e'],
				'lazy object'+JSON.stringify(out));
			
	
			var out_d_x=topic.get(['d','x'])
			assert.equal(out_d_x,"a10",
				'lazy object'+out_d_x);	
		
			
			var out_d_keys=topic.keys(['d']);
			assert.deepEqual(out_d_keys,['x','y','z'],
				'keys of d'+JSON.stringify(out_d_keys));
			
		
			console.log(topic.cache());
			
			var out_d=topic.get(['d'])
			assert.deepEqual(Object.keys(out_d),
				["x","y","z"],
				'lazy object'+JSON.stringify(out_d));
			
			console.log('in cache',topic.cache());			
			
			var out_c=topic.get(['c'],true)
			assert.deepEqual(out_c,[5,4,3],
				'lazy object'+ JSON.stringify(out_c));	

			console.log(topic.cache());		

			var out_f=topic.get(['f'])
			assert.equal(out_f,undefined,
				'lazy object'+out_f);	

			console.log(topic.cache());	
			//console.log('keys',topic.keys());	
		},
		close: function(topic){topic.free();}	
	}
	
}).export(module); // Export the Suite;