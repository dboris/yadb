var fs=require('fs');
var Yadb=require('./yadb3');
var DB={};
var ydbfiles=[];
var known=function(id) {
	var fn='/'+id+'.ydb';
	for (var i in ydbfiles) {
		if (ydbfiles[i].indexOf(fn)>0) {
			return ydbfiles[i];
		}
	}
};
var opendb=function(dbname) {
	var k=known(dbname);
	if (k && DB[k]) return DB[k];	

	if (dbname.indexOf('.ydb')==-1) dbname+='.ydb';
	if (ydbfiles.indexOf(dbname) ==-1 ) return;
	
	if (DB[dbname]) return DB[dbname];
	var oldpath=process.cwd();
	process.chdir('..');
	var db=new Yadb(dbname);
	fs.watchFile(dbname,function(curr,prev){
		if (curr.mtime - prev.mtime) {
			console.log('free '+dbname+' as file changed');
			if (DB[dbname]) {
				DB[dbname].free();
				DB[dbname]=null;
			}
		}
	});
	if (db) DB[dbname]=db;
	process.chdir(oldpath)
	return db;
}
var enumydb=function() {
	var output={};
	var dbnames=[];
	for (var i in ydbfiles) {
		var fullname=ydbfiles[i];
		fullname=fullname.replace('/',':').replace('.ydb','');
		var dbname=fullname.match(/.*:(.*)/)[1]
		output [ fullname] ='\0'; //pretend to be loaded
	}
	return output;
}
var listydb=function(path, ext) {
	ext=ext||".ydb";
	var output=[];
	
	path=path||".";
	var oldpath=process.cwd();
	if (path!=".") process.chdir(path);
	var currentpath=process.cwd();
	var folders=fs.readdirSync(currentpath);
	for (var i in folders) {
		var stat=fs.statSync(folders[i]);
		if (!stat) continue;
		if (stat.isDirectory()) {
			if ( folders[i]=='ydb') continue;//skip default folder
			var files=fs.readdirSync(folders[i]);
			for (var j in files) {
				if(files[j].substring(files[j].length-ext.length)===ext) {
					var yaname=folders[i]+'/'+files[j];
					try {
						output.push(yaname);
					} catch (e) {
						process.chdir(oldpath);
						console.log(e);
					}
				}
			}
		} else {
			if(folders[i].substring(folders[i].length-ext.length)===ext) {
				if (path=='..') {
					output.push('./'+folders[i]);
				} else {
					output.push('ydb/'+folders[i]);	
				}
				
			}
		}
	}		
	process.chdir(oldpath);
	
	return output;
}
var getRaw=function(path) {
	var p=JSON.parse(JSON.stringify(path));
	var res=null;
	if (!p || p.length==0) {
		res=enumydb();
	} else if (p) {
		var dbname=p.shift();
		dbname=dbname.replace(':','/');
		var db=opendb(dbname);
		res=db.get(p);
	}
	return res;
}
var initialize=function() {};

var installservice=function(services) { // so that it is possible to call other services
	services['yadb']={ 
		listydb:listydb,
		getRaw:getRaw,	
		initialize:initialize
	};
	ydbfiles=listydb('..','ydb'); //search app folder first
	ydbfiles=ydbfiles.concat( listydb('../ydb','ydb') ); // default folder
	console.info("yadb installed, found ydb",ydbfiles);
}
module.exports=installservice;
