/*
  change to async file io for chorme
*/

var Yadb3=require('../yadb3_async'),
	Yadb3_fs=require('../yadb3_fs_async');

console.log('yadb3 test suite');
/*
QUnit.asyncTest('read int32',function(){
    var topic=new Yadb3_fs('i32.ydb',{},function(topic){
			  topic.readUI32(topic.signature_size,function(out){
					deepEqual(out,16843009,'uint 32 '+out);
					topic.free();
					start();
			});
    });
})
QUnit.asyncTest('read int8',function(){
    var topic=new Yadb3_fs('i8.ydb',{},function(topic){
			  topic.readUI8(topic.signature_size,function(out){
					deepEqual(out,170,'uint 8 '+out);
					topic.free();
					start();
			});
    });	
});

QUnit.asyncTest('read utf8',function(){
    var topic=new Yadb3_fs('utf8.ydb',{},function(topic){
			  topic.readString(topic.signature_size,3,'utf8',function(out){
					deepEqual(out,'abc','utf8 string '+out);
					topic.free();
					start();
			});
    });	
});

QUnit.asyncTest('read ucs2',function(){
    var t=new Yadb3_fs('ucs2.ydb',{},function(topic){
			  topic.readString(topic.signature_size,4,'ucs2',function(out){
					deepEqual(out,'一丁','ucs2 string');
					topic.free();
					start();
			});
    });
});

QUnit.asyncTest('read pint',function(){
  var t=new Yadb3('pint.ydb',{},function(topic) {

		topic.load({},function(out){
			deepEqual(out,[128,129],'pint'+out);
			topic.free();
			start();
		});	
	});
});


QUnit.asyncTest('read vint',function(){
  var t=new Yadb3('vint.ydb',{},function(topic) {
		topic.load({},function(out){
			deepEqual(out,[128,1],'vint'+out);
			topic.free();
			start();
		});	
	});
});

QUnit.asyncTest('utf8 string array',function(){
  var t=new Yadb3('arr_utf8.ydb',{},function(topic) {
		topic.load({},function(out){
			deepEqual(out,['abc','xyz'],'utf8 array'+JSON.stringify(out));
			topic.free();
			start();
		});	
	});
});


QUnit.asyncTest('ucs2 string array',function(){
  var t=new Yadb3('arr_ucs2.ydb',{},function(topic) {
		topic.load({},function(out){
			deepEqual(out,['一','丁'],'ucs2 array'+JSON.stringify(out));
			topic.free();
			start();
		});	
	});
});

QUnit.asyncTest('array of array of i8',function(){
  var t=new Yadb3('arr_arr_i8.ydb',{},function(topic) {
		topic.load({},function(out){
		  deepEqual(out,[[1,2,3],[4,5,6,7],[8,9]],'i8 array array'+JSON.stringify(out));
			topic.free();
			start();
		});	
	});
});


QUnit.asyncTest('array of array of i8',function(){
  var t=new Yadb3('arr_var.ydb',{},function(topic) {
		topic.load({},function(out){
		  deepEqual(out,[16843009,170,'xyz',[1,2,3]],'var array array'+JSON.stringify(out));
			topic.free();
			start();
		});	
	});
});

QUnit.asyncTest('object',function(){
  var t=new Yadb3('obj.ydb',{},function(topic) {
		topic.load({},function(out){
			equal(JSON.stringify(out),
				JSON.stringify({a:1,b:2,c:3}),
				'simple object'+JSON.stringify(out));	
			topic.free();
			start();
		});	
	});
});

QUnit.asyncTest('object lazy',function(){
  var t=new Yadb3('obj.ydb',{},function(topic) {
		topic.load({lazy:true},function(out){
		deepEqual(Object.keys(out),
				['a','b','c'],
				'simple lazy object'+JSON.stringify(out));
			topic.free();
			start();
		});	
	});
});

QUnit.asyncTest('object var',function(){
  var t=new Yadb3('obj_arr.ydb',{},function(topic) {
		topic.load({},function(out){
	
		  equal(JSON.stringify(out),
				JSON.stringify({a:[1,2,3],b:[4,5,6],c:[7,8,9]}),
				'simple lazy object'+JSON.stringify(out));
			topic.free();
			start();
		});	
	});
});


QUnit.asyncTest('load json',function(){
  var t=new Yadb3('json.ydb',{},function(topic) {

		topic.load({},function(out){
		  console.log(out)
		  equal(out.b,"qqq")
		  equal(out.d.x,"a10")
			topic.free();
			start();
		});	
	});
});
*/

QUnit.asyncTest('lazy get',function(){
	var topic=new Yadb3('json.ydb',{},function(topic){

		topic.get( [], false,function(out){
			console.log(out);
			deepEqual(Object.keys(out),
					['a','b','c','d','e'],
					'lazy object'+JSON.stringify(out));
		
		});
	
		topic.get(['d','x'],false,function(out){
				equal(out,"a10",'lazy object'+out);	
				console.log('in cache',topic.cache())
		});	

		topic.get(['d'],false,function(out){
			console.log('out',out)
				deepEqual(Object.keys(out),['x','y','z'],'keys of d'+JSON.stringify(out));
		});	


		topic.keys(['d'],function(out){
			deepEqual(out,['x','y','z'],'keys of d'+JSON.stringify(out));
			//console.log('in cache',topic.cache());			
		});
		

		
		topic.get(['c'],true,function(out){
			deepEqual(out,[5,4,3],
			'lazy object'+ JSON.stringify(out));	
			//console.log('in cache2',topic.cache());		

		});

		topic.get(['f'],true,function(out){
			equal(out,undefined,'lazy object'+out);	
			//console.log('in cache2',topic.cache());		
				start();
		});	


		});
});

