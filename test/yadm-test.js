var vows = require('vows'),
    assert = require('assert'),
	yadm=require('../yadm');

/*
  create a dm file with 
  node launcher/converter.js paliseg/buildya.prj.js
*/

var filename='../../paliseg/vri.mul.ya';

// Create a Test Suite
console.log('yadm test suite');
vows.describe('yadm test suite').addBatch({
    'small ya': {
        topic: function () {
			var f = new Yadm(filename);
			console.log(filename);
			return f;
		},

        'check require tables': function (topic) {
			
			assert.equal( !!topic.meta, true,'error loading meta file' );
			assert.equal( !!topic.meta.idseq, true,'missing idseq section' );
        },
		'getTextById':function(topic) {
			var R=topic.getTextById('d1');
			R=R.replace(/<.*?>/g,'');
			assert.equal(R,'1. brahmajālasuttaṃ','getTextById d1');
		},
		'getPostingById':function(topic) {
			var R=topic.getPostingById('bhagavā');
			assert.deepEqual(R[0],16390,'first bhagavā '+R[0]);
		},
		'phrasesearch':function(topic) {
			var R=topic.phrasesearch('samādhināti',{showtext:true});
			var r=Object.keys(R)[0];
			var t=R[r];
			assert.equal(r,['a11.p21.7'],'search result '+r);
			
			assert.equal(t.indexOf('<hl')>0,true,'highlight pos '+t);
		},

	},

}).export(module); // Export the Suite