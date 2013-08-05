    Yadbworker=require('../yadm4w');
var xmlfile='yadm4.xml';
var fs=require('fs')
var f=fs.readFileSync(xmlfile,'utf8');

var taginfo={s:{index:false}}; // user supply taginfo
var r=Yadbworker.parsefile(f, { taginfo:taginfo,indexcrlf:true, crlfreplacechar:''}) ;
console.log(r)
