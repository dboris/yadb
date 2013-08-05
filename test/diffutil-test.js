var vows = require('vows'),
    assert = require('assert'),
	diffutil=require('../diffutil');
	
	
vows.describe('diffutil test suite').addBatch({

    'diff': {
        topic: function () {
			return [
			'aabccf',
			'qaadcc'
			];

		},
		compare:function(topic) {

			var g=diffutil.group( topic[0],topic[1]);
			console.log(g);
		}
	}
}).export(module); // Export the Suite
