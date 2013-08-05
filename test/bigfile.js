var Yadb3w=require('../yadb3w');
var ydb=new Yadb3w('bigfile.ydb');
console.time('save');
ydb.openObject();
ydb.stringStrategy('utf8');
for (var i=0;i<100000;i++) {
	ydb.saveString( 'abc', 'a'+i);
}
ydb.close(); //close is optional
ydb.free();
console.timeEnd('save');