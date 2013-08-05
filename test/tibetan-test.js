var vows = require('vows'),
    assert = require('assert'),
	tibetan=require('../tibetan');
	
vows.describe('Tibetan test suite').addBatch({
    'bsgrond': {
        topic: function () {
			return 'བསྒྲོནད';

		},
		test1:function(topic) {
			var w=tibetan.wylie(topic);
			assert.equal(w,'bsgrond','wylie '+w);
		}
	},
    'bsgrond': {
        topic: function () {
			return 'བསྒྲོནད';

		},
		test1:function(topic) {
			var w=tibetan.wylie(topic);
			assert.equal(w,'bsgrond','wylie '+w);
		}
	}
	
}).export(module); // Export the Suite
