/* yadb pool */
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
/* try working folder first, than other folders, finally ydb folder*/
var open=function(dbname) {
	var dbid="";
	/* TODO , ydb in the index.html folder has top priority */
	var cwd=process.cwd();
	dbname=dbname.replace(':','/');
	var working=cwd.substring(1+cwd.replace(/\\/g,'/').lastIndexOf('/'));
	if (dbname.indexOf('/')==-1) { //if not folder is specified, check working first
		if ( fs.existsSync(dbname+'.ydb') ) {
			dbname=working+'/'+dbname;
			console.log('current folder',working,'new name',dbname)
		}		
	}

	dbid=known(dbname);
	if (dbid && DB[dbid]) return DB[dbid];	

	if (dbname.indexOf('.ydb')==-1) dbname+='.ydb';
	if (ydbfiles.indexOf(dbname) ==-1 && dbname.indexOf('/'==-1) ) {
		//try other folder
		for (var i in ydbfiles) {
			var y=ydbfiles[i];
			if (y.substring(y.lastIndexOf('/'))=='/'+dbname) {
				dbname=y;
				break;
			}
		}
	}
	if (!fs.existsSync(dbname)) {
		if (ydbfiles.indexOf(dbname) ==-1 ) {
			throw 'db not found';
			return;
		}		
	}

	if (DB[dbname]) return DB[dbname];
	var oldpath=process.cwd();
	//node_webkit working folder is same as index.html
	if (process.versions['node-webkit']) process.chdir('..');
	var db=new Yadb(dbname);
	console.log('watching ',dbname);
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
	var fetch=function(P) {
		var recursive=false;
		if (P[P.length-1]=='*') {
			P.pop();
			recursive=true;
		}
		var dbname=P.shift();
		dbname=dbname.replace(':','/');
		var db=open(dbname);
		return db.get(P,recursive);		
	}
	var p=JSON.parse(JSON.stringify(path));
	var res=[];
	if (!p || p.length==0) {
		res=enumydb();
	} else if (p) {
		if (typeof p[0]=="object") {
			for (var i in p) res.push( fetch(p[i]));
		} else res=fetch(p);
	}
	return res;
}
var initialized=false;
var installservice=function(services) { // so that it is possible to call other services
	var API={ 
		listydb:listydb,
		getRaw:getRaw,
		open:open,
		version: require('./package.json').version
	};

	if (!initialized && services) {
		services['yadb']=API;
		ydbfiles=listydb('..','ydb'); //search app folder first
		ydbfiles=ydbfiles.concat( listydb('../ydb','ydb') ); // default folder
		console.info("yadb installed, found ydb",ydbfiles);
		initialized=true;
	}
	return API;
}
module.exports=installservice;
