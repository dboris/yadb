/*
	start on 2013/2/14 at Tusita Kuching
	yapcheahshen@gmail.com
	design principle:
	
	1) easy to use API, not possible to create corrupted ydb
	2) auto close when writing ydb	is free()
	3) thin platform dependent layer
	4) maximum payload size 1TB (40 bits)	
	5) optimized writing speed 
	6) optimized for continuous storage of integers and strings
	7) different strategy of storing integers and strings
	8) extensible type system
*/
var vows = require('vows'),
    assert = require('assert'),
	Yadb3w=require('../yadb3w'),
	Yadb3w_fs=require('../yadb3w_fs'),
	Yadb3=require('../yadb3');

console.log('yadb3w test suite');

vows.describe('yadb3w test suite').addBatch({
    'write int32': {
		topic: function () {return new Yadb3w_fs('i32w.ydb');},
		
		u32: function(topic) {topic.writeI32(16843009,0);},
		close: function(topic) { topic.free();}
	},
	'test write int32': {
		topic: function () {return new Yadb3('i32w.ydb');},
		u32: function(topic) {
			var out=topic.load();
			assert.equal(out,16843009,'test write int32'+out);
		},
		close: function(topic) { topic.free();}
	},
  
    'write int8': {
		topic: function () {return new Yadb3w_fs('i8w.ydb');},
		u32: function(topic) {topic.writeUI8(170,0);},
		close: function(topic) { topic.free();}
	},
	'test write int8': {
		topic: function () {return new Yadb3('i8w.ydb');},
		u32: function(topic) {
			var out=topic.load();
			assert.equal(out,170,'test write int8');
		},
		close: function(topic) { topic.free();}
	},
  'write boolean': {
		topic: function () {return new Yadb3w_fs('boolw.ydb');},
		bool: function(topic) {topic.writeBool(true,0);},
		close: function(topic) { topic.free();}
	},
	'test write boolean': {
		topic: function () {return new Yadb3('boolw.ydb');},
		bool: function(topic) {
			var out=topic.load();
			assert.equal(out,true,'test write int8');
		},
		close: function(topic) { topic.free();}
	},	
  'write utf8': {
		topic: function () {return new Yadb3w_fs('utf8w.ydb');},
		u32: function(topic) {topic.writeString('abc',0,'utf8');},
		close: function(topic) { topic.free();}
	},
	'test write utf8': {
		topic: function () {return new Yadb3('utf8w.ydb');},
		u32: function(topic) {
			// lstat return size=0 on newly created file
			var out=topic.load({blocksize:4});
			assert.equal(out,'abc','test write utf8 '+out);
		},
		close: function(topic) { topic.free();}
	}	,
    'write ucs2': {
		topic: function () {return new Yadb3w_fs('ucs2w.ydb');},
		u32: function(topic) {topic.writeString('一丁',0,'ucs2');},
		close: function(topic) { topic.free();}
	},
	'test write ucs2': {
		topic: function () {return new Yadb3('ucs2w.ydb');},
		u32: function(topic) {
			// lstat return size=0 on newly created file
			var out=topic.load({blocksize:6});
			assert.equal(out,'一丁','test write ucs2');
		},
		close: function(topic) { topic.free();}
	},
    'write utf8 array': {
		topic: function () {return new Yadb3w_fs('arr_utf8w.ydb');},
		utf8_array: function(topic) {topic.writeStringArray(['abc','xyz'],0,'utf8');},
		close: function(topic) { topic.free();}
	},
	'test write utf8 array': {
		topic: function () {return new Yadb3('arr_utf8w.ydb');},
		utf8_array: function(topic) {
			var out=topic.load({blocksize:8});
			assert.deepEqual(out,['abc','xyz'],'test write ucs2'+JSON.stringify(out));
		},
		close: function(topic) { topic.free();}
	},
 'write ucs2 array': {
		topic: function () {return new Yadb3w_fs('arr_ucs2w.ydb');},
		utf8_array: function(topic) {topic.writeStringArray(['一','丁'],0,'ucs2');},
		close: function(topic) { topic.free();}
	},
	'test write ucs2 array': {
		topic: function () {return new Yadb3('arr_ucs2w.ydb');},
		utf8_array: function(topic) {
			var out=topic.load({blocksize:7});
			assert.deepEqual(out,['一','丁'],'test write ucs2'+JSON.stringify(out));
		},
		close: function(topic) { topic.free();}
	},
	'save pint': { // packed integer
		topic:function(){return new Yadb3w('pintw.ydb');},
		pint: function(topic) {
			topic.savePInt([128,129],true);
		},
		close: function(topic) {topic.free();}		
	},
	'test save pint': {
		topic: function () {return new Yadb3('pintw.ydb');},
		pint: function(topic) {
			var out=topic.load({blocksize:4});
			assert.deepEqual(out,[128,129],'test save pint'+JSON.stringify(out));
		},
		close: function(topic) { topic.free();}
	},	
	'save vint': { // integer for postings , n+1> n
		topic:function(){return new Yadb3w('vintw.ydb');},
		vint: function(topic) {
			topic.saveVInt([128,1],true);
		},
		close: function(topic) {topic.free();}		
	},
	'test save vint': {
		topic: function () {return new Yadb3('vintw.ydb');},
		vint: function(topic) {
			var out=topic.load({blocksize:4});
			assert.deepEqual(out,[128,1],'test save vint'+JSON.stringify(out));
		},
		close: function(topic) { topic.free();}
	},	
		'save var array':{
		topic:function(){return new Yadb3w('arr_varw.ydb');},
		var_array: function(topic) {
			topic.openArray();
			topic.saveI32(16843009);
			topic.saveUI8(170);
			topic.saveString('xyz');
			topic.save([1,2,3]);
			topic.close();
		},
		close: function(topic){topic.free();}	
	},	
	'test save var array':{
		topic:function(){return new Yadb3('arr_varw.ydb');},
		var_array: function(topic) {
			var out=topic.load({blocksize:32});
			
			assert.deepEqual(out,[16843009,170,'xyz',[1,2,3]],'var array array'+JSON.stringify(out));
		},
		close: function(topic){topic.free();}	
	},
	'save nested array array':{
		topic:function(){return new Yadb3w('arr_arr_i8w.ydb');},
		var_array: function(topic) {
			topic.openArray();
			for (var i=0;i<2;i++) {
				topic.openArray();
				topic.saveUI8(i*3+1);
				topic.saveUI8(i*3+2);
				topic.saveUI8(i*3+3);
				topic.close();
			}
			topic.close();
		},
		close: function(topic){topic.free();}	
	},
	
}).export(module); // Export the Suite;