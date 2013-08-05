var vows = require('vows'),
    assert = require('assert'),
	sanity=require('../sanity');
// Create a Test Suite
/*
	1.1
	1.2
	1.3 <= pass
	
	1.1
	1.2 <== pass
	1.1 <== error

*/
console.log('sanity test suite');
vows.describe('sanity test suite').addBatch({
    'correct': {
        topic: function () {
			return [ '1.1','1.2','1.3'  ];
		},
		'valid id':function(topic) {
			var tree={};
			for (var i=0;i<topic.length;i++) {
				assert.equal(sanity.checkid(tree,topic[i]) , true ,'not pass '+i);
			}
		}	
	},
	'incorrect L1': {
        topic: function () {
			return [ '1.1','2.1',
			'1.2']   //<---should break here];
		},
		'invalid id':function(topic) {
			var tree={};
			for (var i=0;i<topic.length;i++) {
				assert.equal(sanity.checkid(tree,topic[i]) , i!=2 ,'not pass '+i);
			}
		}	
	},
	'incorrect L2': {
        topic: function () {
			return [ '1.1','1.2', '1.2.1',
			'1.1']     //<---should break here];
		},
		'invalid id':function(topic) {
			var tree={};		
			for (var i=0;i<topic.length;i++) {
				assert.equal(sanity.checkid(tree,topic[i]) , i!=3 ,'not pass '+i);
			}
		}	
	},	
	'incorrect L3': {
        topic: function () {
			return [ '1.1.1','1.1.2', '1.1.1',//<---should break here];
			'1.1']     
		},
		'invalid id':function(topic) {
			var tree={};		
			for (var i=0;i<topic.length;i++) {
				assert.equal(sanity.checkid(tree,topic[i]) , i!=2 ,'not pass '+i);
			}
		}	
	},		
	'correct L3': {
        topic: function () {
			return [ 'd17.p241','d17.p242.1', 'd17.2',
			'd17.p242.2','d17.p242.3']     
		},
		'invalid id':function(topic) {
			var tree={};		
			for (var i=0;i<topic.length;i++) {
				assert.equal(sanity.checkid(tree,topic[i]) , true ,'not pass '+i);
			}
		}	
	},		
}).export(module); ;

