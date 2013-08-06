var L = process.argv; L.shift(); L.shift();
var Ydb=require('yadb');
debugger;
var ydb=Ydb.open(L[0]);
console.log(ydb);