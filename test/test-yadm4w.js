var vows = require('vows'),
    assert = require('assert'),
    Yadbworker=require('../yadm4w');
var xmlfile='yadm4.xml';
var fs=require('fs')
var splitter=require('../splitter');
var Invert=require('../invert4');

var onchapter=Yadbworker.defaulthandler.toc;
var taginfo={
	's':{remove:true},
	'chapter':{savepos:true,newslot:true, text:true},
	'pb':{savepos:true,handler:'pb',remove:true, indexattributes:{ n: {regex: / n="(.*?)"/, allowrepeat: false, depth:2}  } }
}
var parsefile=function() {
	var f=fs.readFileSync(xmlfile,'utf8');
	var context={taginfo:taginfo,indexcrlf:true, crlfreplacechar:' '};
	Yadbworker.parsefile(context,f) ;
	return context;
}
vows.describe('yadb worker 4 test suite').addBatch({
    'parser': {
        topic: function () {
        		return parsefile();
	},
	numberofsentence:function(topic) {
		assert.equal(topic.sentences.length,6,'number of sentences');
	},
	numberoftags:function(topic) {
		//assert.equal(topic.tags.tag.length,5,'number of indexed tag');
	},
	numberofcrlf:function(topic) {
		assert.equal(topic.crlf.length,1,'number of crlf');
	}
  },
  'builder':{
        topic: function () {
        		var context=parsefile();
		var invertopts={splitter:splitter,blockshift:6};
		context.invert=Invert.create(invertopts);
		Yadbworker.build(context);
		return context;
	},
	build:function(topic) {
		console.log(topic.slottexts)
		//console.log(topic.invert.postings)
		//assert.equal(topic.slottexts.length,4,'slot number');
		//console.log(topic.tags);
		assert.deepEqual(topic.tags['pb.a']['n='],{ '1': { '1a': 0, '1b': 1 ,'2a':2} },'id tree')
	}

}

}).export(module); // Export the Suite