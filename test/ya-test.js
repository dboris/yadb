var vows = require('vows'),
    assert = require('assert'),
	Yadb=require('../yadb2');

var createyafromjson=function(file_name,J) {
	var f = new Yadb();
	f.create(file_name)
	var k = f.writeJSON(J)
	f.save(k);
	return k;
}
var loadyatojson=function(file_name,immediate) {
	var f = new Yadb();
	f.open(file_name);
	f.getJSON([],immediate);
	f.close();
	return f.json;
}
var test1fn='test1.ya';
var test2fn='test2.ya';
var test3fn='test3.ya';
fs=require('fs');

// Create a Test Suite
console.log('yadb test suite');
vows.describe('yadb test suite').addBatch({
    'small ya': {
        topic: function () {
			return {"a":1,"b":2,"c":3 };
		},

        'create Ya from Json': function (topic) {
			var k=createyafromjson(test1fn,topic);
			assert.equal(k,true,'is saving object');
			assert.equal(fs.existsSync(test1fn),true,'file exists');
        },
		
		'load from Ya':function (topic) {
			var json=loadyatojson(test1fn,true);
			assert.deepEqual( json, topic ,'load from json');
		}
	},
   'defer loading': {
        topic: function () {
			return {"a": [ "a1","a2","a3" ] ,"b":{"b1":[7,7,7],"b2":8,"b3":9},"c":3 };
		},
		
        'create Ya from Json': function (topic) {
			if (!fs.existsSync(test2fn)) createyafromjson(test2fn,topic);
        },
		
		'load from Ya':function (topic) {
			var json=loadyatojson(test2fn,false);
			assert.deepEqual( json, {"a":null,"b":null,"c":3}, "top level");
			//console.log(json);
			
		}
	},
   'second level': {
        topic: function () {
			var f = new Yadb();
			f.open(test2fn);
			return f;
		},
		
		'load top level': function(f) {
			var json=f.getJSON([]);
			assert.deepEqual(json,{"a":null,"b":null,c:3});
		},

		'load deeper level':function(f) {

			var json=f.getJSON(["b"]);
			console.log(json);
			console.log('compare:', f.json.b, ' to: {"b1":null,"b2":8,"b3":9}');
			assert.deepEqual( json, {"b1":null,"b2":8,"b3":9} , "content of b");
			
			var json=f.getJSON(["b","b1"]);
			console.log(f.json.b.b1);
			
			assert.deepEqual( json, [7,7,7] , "content of b.b1");
					
		},
		
		'finalize':function(f) {
			f.close();
		}
		
   
	},
    'keep natural order': {
        topic: function () {
			return {"dn1":1,"dn1_1":8,"dn1_2":3 ,		"dn1_3":7,"dn1_10":82};
		},

        'create Ya from Json': function (topic) {
			var k=createyafromjson(test3fn,topic);
			assert.equal(k,true,'is saving object');
			assert.equal(fs.existsSync(test3fn),true,'file exists');
        },
		
		'load from Ya':function (topic) {
			var json=loadyatojson(test3fn,true);
			var ondisk=[];
			//convert to array
			for (var i in json) {
				ondisk.push(i);
			}
			var c=0;
			for (var i in topic) {
				assert.equal( i, ondisk[c++], 'natural order is not keeped!');
			}
		}
				
	},	
}).export(module); // Export the Suite