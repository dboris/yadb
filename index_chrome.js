/*YADB entry */
var Yadb3=require('./yadb3');
var Yadb3_fs=require('./yadb3_fs');
var version="0.2.0";//require('./package.json').version;
module.exports={open:Yadb3, version: version, fs:Yadb3_fs};
