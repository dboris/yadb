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

//var vows = require('vows')
//var assert = require('assert')
require('assert_mini')
winapi_console_only()
require_path.push('/ksana/ksanadb')
var Yadb3 = require('../yadb3')

log('\n   Starting tests:\n')

var db = new Yadb3('i32.ydb')
var out=db.fs.readUI32(db.fs.signature_size);
log('read int32:', assert.deepEqual(out,16843009,'uint 32 '+out));

db = new Yadb3('i8.ydb')
var out=db.fs.readUI8(db.fs.signature_size);
log('read int8:', assert.deepEqual(out,170,'uint 8 '+out))

db = new Yadb3('utf8.ydb')
var out=db.fs.readString(db.fs.signature_size,3);
log('read utf8:', assert.deepEqual(out,'abc','utf8 string '+out))

db = new Yadb3('ucs2.ydb')
var out=db.fs.readString(db.fs.signature_size,4,'ucs2');
log('read ucs2:', assert.deepEqual(out,'一丁','ucs2 string'))

db = new Yadb3('pint.ydb')
var out=db.load();
log('load pint:', JSON.stringify(out) == '[128,129]')
	
db = new Yadb3('vint.ydb')
var out=db.load();
log('load vint:', JSON.stringify(out) == '[128,1]')
	
db = new Yadb3('arr_utf8.ydb')
var out=db.load();
log('utf8 string array:', JSON.stringify(out) === '["abc","xyz"]')

db = new Yadb3('arr_ucs2.ydb')
var out=db.load();
log('ucs2 string array:', JSON.stringify(out) === '["一","丁"]')

db = new Yadb3('arr_arr_i8.ydb')
var out=db.load()
log('array of array of i8:', JSON.stringify(out) === '[[1,2,3],[4,5,6,7],[8,9]]')
	
db = new Yadb3('arr_var.ydb')
var out=db.load()
log('var array:', JSON.stringify(out) === '[16843009,170,"xyz",[1,2,3]]')
		
	// 'object':{
		// obj: function(topic) {
			// var out=db.fs.load();
			// assert.deepEqual(out,
				// {a:1,b:2,c:3},
				// 'simple object'+JSON.stringify(out));
		// },
		// close: function(topic){db.fs.free();}	
	// }

db = new Yadb3('obj.ydb')
var out=db.load()
log('object:', JSON.stringify(out) === JSON.stringify({a:1,b:2,c:3}))

db = new Yadb3('obj.ydb')
var out=db.load()
out = Object.keys(out)
log('object lazy:', JSON.stringify(out) === JSON.stringify(['a','b','c']))
		
		// 'object var':{
		// obj: function(topic) {
			// var out=db.fs.load();
			// assert.deepEqual(out,
				// {a:[1,2,3],b:[4,5,6],c:[7,8,9]},
				// 'simple lazy object'+JSON.stringify(out));
		// },
		// close: function(topic){db.fs.free();}	

db = new Yadb3('obj_arr.ydb')
	
	// 'load json':{
		// obj: function(topic) {
			// var out=db.fs.load();
			// console.log(out);
		// },
		// close: function(topic) {
			// db.fs.free();
		// }

db = new Yadb3('json.ydb')

		// 'lazy get':{
		// topic:function(){return new Yadb3('json.ydb')},
		// obj: function(topic) {
			// var out=db.fs.get();
			// assert.deepEqual(Object.keys(out),
				// ['a','b','c','d','e'],
				// 'lazy object'+JSON.stringify(out));
			
			// var out_d_x=db.fs.get(['d','x'])
			// assert.equal(out_d_x,"a10",
				// 'lazy object'+out_d_x);	
		
			
			// var out_d_keys=db.fs.keys(['d']);
			// assert.deepEqual(out_d_keys,['x','y','z'],
				// 'keys of d'+JSON.stringify(out_d_keys));
			
		
			// console.log(db.fs.cache());
			
			// var out_d=db.fs.get(['d'])
			// assert.deepEqual(Object.keys(out_d),
				// ["x","y","z"],
				// 'lazy object'+JSON.stringify(out_d));
			
			// console.log('in cache',db.fs.cache());			
			
			// var out_c=db.fs.get(['c'])
			// assert.deepEqual(out_c,[5,4,3],
				// 'lazy object'+out_c);	

			// console.log(db.fs.cache());		

			// var out_f=db.fs.get(['f'])
			// assert.equal(out_f,undefined,
				// 'lazy object'+out_f);	

			// console.log(db.fs.cache());	
			// //console.log('keys',db.fs.keys());	
		// },
		// close: function(topic){db.fs.free();}	
	// }

db = new Yadb3('json.ydb')

