var vows = require('vows'),
    assert = require('assert'),
	splitter=require('../../ksanadb/splitter');
	
vows.describe('tipitaka test suite').addBatch({
	
    'split by blank': {
		'topic': function() {
			return 'abc xyz';
		},
		'simple':function(d) {
			var f=splitter(d).tokens;
			console.log('q',f);
			assert.deepEqual( f,['abc','xyz'],'simple split '+JSON.stringify(d));
		}
	},
	'split by entities':{
		'topic': function() {
			return 'abc&amp;';
		},
		'entities':function(d) {	
			var f=splitter(d).tokens;
			assert.deepEqual( f,['abc','&amp;'],'entities split '+JSON.stringify(d));
		}
	
	},
	'ignore spaces':{
		'topic': function() {
			return 'abc   &amp;  xyz';
		},
		'entities':function(d) {	
			var f=splitter(d).tokens;
			assert.deepEqual( f,['abc','&amp;','xyz'],'entities split '+JSON.stringify(d));
		}
	
	},
	'split by tag':{
		'topic': function() {
			return 'abc<abc>&amp;';
		},
		'entities':function(d) {	
			var f=splitter(d).tokens;
			assert.deepEqual( f,['abc','<abc>','&amp;'],'tag split '+JSON.stringify(d));
		}
	
	},
	'split by tag, & inside tag':{
		'topic': function() {
			return 'abc<_ id="xxx"/>&amp;';
		},
		'entities':function(d) {	
			var f=splitter(d).tokens;
			assert.deepEqual( f,['abc','<_ id="xxx"/>','&amp;'],'tag split '+JSON.stringify(d));
		}
	
	},
	'split at control chars':{
		'topic': function() {
			return 'abc\nxyz';
		},
		'entities':function(d) {	
			var f=splitter(d).tokens;
			assert.deepEqual( f,['abc','xyz'],'control char split '+JSON.stringify(d));
		}
	
	},
	'split chinese':{
		'topic': function() {
			return 'abc\n一。！';
		},
		'entities':function(d) {	
			var f=splitter(d).tokens;
			assert.deepEqual( f,['abc','一','。','！'],'control char split '+JSON.stringify(f));
		}
	
	},
	'split chinese 2':{
		'topic': function() {
			return 'abc\n𠀀二𪀀';
		},
		'entities':function(d) {	
			var f=splitter(d).tokens;
			assert.deepEqual( f,['abc','𠀀','二','𪀀'],'control char split '+JSON.stringify(f));
		}
	
	},

	'split quote as space':{
		'topic': function() {
			return 'abc"xyz\'añcā’ti––';
		},
		'entities':function(d) {	
			var f=splitter(d).tokens;
			assert.deepEqual( f,['abc','xyz','añcā','ti'],'control char split '+JSON.stringify(f));
		}
	
	},//བརྫུན་པའོ་ཞེས་རྗེས་སུ་ཐ་སྙད་འདོགས་པར་བགྱིད་དེ། 

	'split quote as space':{
		'topic': function() {
			return 'བརྫུན་པའོ་ཞེས་རྗེས་སུ་ཐ་སྙད་འདོགས་པར་བགྱིད་དེ། ';
		},
		'entities':function(d) {	
			var f=splitter(d).tokens;
			console.log(f.length);
			assert.deepEqual( f,['བརྫུན','པའོ',			
			'ཞེས','རྗེས','སུ','ཐ','སྙད','འདོགས','པར','བགྱིད',
			'དེ'
			],'tibetan char split '+JSON.stringify(f));
		}
	
	}		
		
	}).export(module); // Export the Suite