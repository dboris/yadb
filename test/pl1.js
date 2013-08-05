define([], function(){
    var postings={};
    var itemcount=10000;
    postings.data=[];
    postings.int32=new Uint32Array(itemcount);
    
    var init=function() {
	    for (var i=0;i<itemcount;i++) {
	    	postings.data.push(i * 7);
	    }
	    
	    for (var i=0;i<itemcount;i++) {
	    	postings.int32[i]=(i * 7);
	    }
	    
    };
	init();
	return postings;
});