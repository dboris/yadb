define(['underscore','diff','qunit'], 
function(_,diff){
	module("diff", {setup:function(){
        this.opts={};
        
	
	}});

    test("simplediff", function() {
    	var dmp=new diff();
			var d=dmp.diff_main("道可道非常道","道可道也非恆道也");
			document.getElementById("output").innerHTML=dmp.diff_prettyHtml(d);
    });
    

});