var vows = require('vows'),
    assert = require('assert'),
	Yadm3=require('../yadm3');
	

/*
  create a dm file with 
  node launcher/converter.js paliseg/buildya.prj.js
*/

var filename='../../paliseg/vri.mul.ydb';

// Create a Test Suite
console.log('yadm test suite');
vows.describe('yadm test suite').addBatch({
    'small ya': {
        topic: function () {
			return new Yadm3(filename);

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
			console.time('getPostingById *1000');
			//for (var i=0;i<1000;i++) 
			var R=topic.getPostingById('bhagavā');
			console.timeEnd('getPostingById *1000');
			assert.deepEqual(R[0],20486,'first bhagavā '+R[0]);
		},
		'seq2id':function(topic) {
			console.time('seq2id *1000');

			var id=topic.seq2id(26725);
			//for (var i=0;i<1000;i++) id=topic.seq2id(26725);
			
			console.timeEnd('seq2id *1000');
			assert.equal(id,'a11.p21.3','id2seq error:'+id);
		},
		'id2seq 2':function(topic) {
			var seq=topic.id2seq('m26');
			var id=topic.seq2id(seq);
			assert.equal(id,'m26.0.0','id2seq error:'+seq);
		},		
		'id2seq':function(topic) {
			console.time('id2seq *1000');
			var seq=topic.id2seq('a11.p21.7');
			//for (var i=0;i<1000;i++) 
			seq=topic.id2seq('a11.p21.7');
			
			console.timeEnd('id2seq *1000');
			assert.equal(seq,26729,'id2seq error:'+seq);
		},
		'tipitaka id':function(topic) {
			var seq=topic.id2seq('d1.p9');
			assert.equal(seq,16,'id2seq error:'+seq);
			
			var seq=topic.id2seq('a11.p512.3');
			assert.equal(seq,26749,'id2seq error:'+seq);
			
		},
		'phrasesearch':function(topic) {
			console.time('phrase search *1000');
			//for (var i=0;i<1000;i++) 
			  var R=topic.phrasesearch('samādhināti',{showtext:true});
			
			console.timeEnd('phrase search *1000');
			var r=Object.keys(R)[0];
			var t=R[r];
			assert.equal(r,['a11.p21.7'],'search result '+r);
			
			assert.equal(t.indexOf('<hl')>0,true,'highlight pos '+t);
		},
		
		'suggestion':function(topic) {
			var sug=topic.suggest('dhammanudhammappatipattiya');
			assert.equal(sug.length,1,'one match');
		}
		

	},

}).export(module); // Export the Suite