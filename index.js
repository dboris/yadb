/*YADB entry */
var Yadb3=require('./yadb3');
var Yadb3w=require('./yadb3w');
var Yadb3_api=require('./yadb_api');
var version=require('./package.json').version;
var async={
	open:require('./yadb3_async')
}
module.exports={open:Yadb3, create: Yadb3w, api: Yadb3_api, version: version
,async:async};