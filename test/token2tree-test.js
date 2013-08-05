var vows = require('vows'),
    assert = require('assert'),
	splitter=require('../../ksanadb/token2tree');
	
vows.describe('token2 tree test suite').addBatch({
	
    'tibetan': {
		'topic': function() {
			return 'abc xyz';
		},
		'simple':function(d) {
			var f=splitter(d).tokens;
			console.log('q',f);
			assert.deepEqual( f,['abc','xyz'],'simple split '+JSON.stringify(d));
		}
	},
	
		
	}).export(module); // Export the Suite