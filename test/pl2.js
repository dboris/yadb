define([], function(){
    var postings={};
    var itemcount=1000000;
    postings.data=[];
    postings.int32=new Uint32Array(itemcount);
    
    var init=function() {
	    for (var i=itemcount;i>=0;i--) {
	   // 	postings.data[i]=(i * 13);
	    }
	    
	    for (var i=0;i<itemcount;i++) {
	    	postings.int32[i]=(i * 13);
	    }
	    
    };
	init();
	return postings;
});