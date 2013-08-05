define(['underscore','kindex','postings','qunit'], 
function(_,kindex,Postings){
	module("Ksana Index", {setup:function(){
        this.opts={};
        
    	  kindex.indexline("道可道非常道，\n名可名非常道",this.opts);
	
	}});

    test("build a block", function() {
    	  
    	  equal(this.opts.postingcount , 5 , "posting count");
    	  deepEqual(this.opts.postings["道"], [ 0,2,5,13], "offset");
    });
    
    test("packing postings", function() {
       this.opts.packedpostings={};
    	  kindex.packpostings(this.opts.postings,this.opts.packedpostings);
    	  ok(true,"compress posting:"+this.opts.packedpostings["道"]);
    	  
    	  var posting=Postings.loadfrombase64(this.opts.packedpostings["道"]);
    	  deepEqual(posting, [ 0,2,5,13], "packed posting");
    	  
    });
    
    test("pack big posting",function() {
    	  var packed=kindex.packint([1,2,3,4]);
    	  deepEqual(packed,[1,1,1,1]);

    	  var packed=kindex.packint([1,128]);
    	  deepEqual(packed,[1,127]);    	  

    	  var packed=kindex.packint([1,129]);
    	  deepEqual(packed,[1,0,129]);    	  
    	  
    	  var packed=kindex.packint([1,130]);
    	  deepEqual(packed,[1,1,129]);    	  
    	  
    	  var packed=kindex.packint([1,131]);
    	  deepEqual(packed,[1,2,129]);    	  
    	  
    	  var packed=kindex.packint([3157557]);
    	  deepEqual(packed,[53,220,192,129]);    	  
    	  
    	  
    });
    
    test("build source <_ id>",function() {
        var opts={};
        var blocks=[];
        var arr=['xyz','<_ id="a"/>a1',"a2","a3",'<_ id="b"/>',"b1","b2","b3"];
    	  kindex.buildsource(arr,opts);
    	  deepEqual( opts.blocknames , ["","a","b"] , "block names");
    	  equal( opts.blocks[0] , "xyz" , "block value");
    	  equal( opts.blocks[1] , "a1\na2\na3" , "block value");
    	  equal( opts.blocks[2] , "b1\nb2\nb3" , "block value");
    });
    
    

    test("build source wordhead",function() {
        var opts={idtag:"wordhead",idattributename:"@"};
        var blocks=[];
        var arr=["x","<wordhead>一</wordhead>二三四","<wordhead>五</wordhead>六七八"];
    	  kindex.buildsource(arr,opts);
    	  deepEqual( opts.blocknames , ["","一","五"] , "block names");
    	  equal( opts.blocks[0] , "x" , "block value");
    	  equal( opts.blocks[1] , "<wordhead>一</wordhead>二三四" , "block value");
    	  equal( opts.blocks[2] , "<wordhead>五</wordhead>六七八" , "block value");
    });

    test("build source wordhead with pb",function() {
        var opts={idtag:"wordhead",idattributename:"@"};
        var blocks=[];
        var arr=["x",'<wordhead><pb n="1"/>一</wordhead>二三<pb n="2"/>四','<wordhead>五<pb n="3"/></wordhead>六七八<pb n="4"/>'];
    	  kindex.buildsource(arr,opts);
    	  
    	  deepEqual( opts.blocknames , ["","一","五"] , "block names");
    	  equal( opts.blocks[0] , "x" , "block value");
    	  equal( opts.blocks[1] , "<wordhead>一</wordhead>二三四" , "block value");
    	  equal( opts.blocks[2] , "<wordhead>五</wordhead>六七八" , "block value");
    	  
    	  equal(opts.pb.id[0],"1","first page break");
    	  deepEqual(opts.pb.offset[0],{"一": 10} ,"first page break");
    	  equal(opts.pb.id[1],"2","second page break");
    	  deepEqual(opts.pb.offset[1],{"一": 24} ,"second page break");
    	  
    	  equal(opts.pb.id[2],"3","third page break");
    	  deepEqual(opts.pb.offset[2],{"五": 11} ,"third page break");
    	  equal(opts.pb.id[3],"4","fourth page break");
    	  deepEqual(opts.pb.offset[3],{"五": 25} ,"fourth page break");
    	  
    	  var arr2=["<wordhead><pb k='xx'/>a</wordhead>"];
    	  var opts={idtag:"wordhead",idattributename:"@"};
    	  kindex.buildsource(arr2,opts); 
    	  
    });
    test("build source wordhead with pb and punc",function() {
        var opts={};
        opts.pb={};
        opts.punc={};
        opts.pb.offset=[];
        opts.pb.id=[];
        opts.strippunc=true;
    	  var out=kindex.strippbandpunc('天地玄黃，宇<pb n="1"/>宙洪荒。', 'ID', 0, 0, opts);
    	  equal(out,"天地玄黃宇宙洪荒","stripped text");
    	  deepEqual(opts.punc['ID'],{"，":[4], "。":[8]} , "punc array");
    	  
    	  deepEqual(opts.pb.id, ["1" ],"pb array");
    	  deepEqual(opts.pb.offset, [{"ID":5} ],"pb array");
    	
    });
    
    test("build source wordhead with pb and punc",function() {
        var opts={};
        opts.pb={};
        opts.punc={};
        opts.pb.offset=[];
        opts.pb.id=[];
        opts.strippunc=true;
        opts['a']=[];
        opts['/a']=[];
        opts.striptags={'a':{} ,'/a':{}, 'b':{keep:true}, '/b':{keep:true} };
        opts.stripoffsets={};
    	  var out=kindex.strippbandpunc('天<a>地玄</a>黃，<b>宇宙洪荒</b>。', 'ID', 0,  0, opts);
    	  equal(out,"天地玄黃<b>宇宙洪荒</b>","stripped text");
    	  
        deepEqual(opts.stripoffsets,{"a":[1], "/a":[3], "b":[4] , "/b":[11] } , "stripped array");
    	  
    	  //deepEqual(opts.pb.id, ["1" ],"pb array");
    	  //deepEqual(opts.pb.offset, [{"ID":5} ],"pb array");
    	
    });    
  
});