/*
dump entire content of ydb
*/
var L = process.argv; L.shift(); L.shift();
var Ydb=require('yadb');
var ydb=new Ydb.open(L[0]);
var res=ydb.get([],true);
console.log(res);