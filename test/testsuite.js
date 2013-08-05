define(['underscore', 'postings', 'kdb', 'kse', 'test/pl1', 'test/pl2', 'kdbutils', 'qunit', 'kdbrequire'],
  function (_, Postings, Db, SE, pl1, pl2, utils) {
    module("Postings postings", {
        setup : function () { //,
        }
      });
    
    /*
    test("test my array intersection", function(){
    console.log("pl1 "+pl1.data.length,"pl2 "+pl2.data.length);
    var st = (new Date).getTime();
    var res=Postings.array_intersect(pl1.data,pl2.data);
    var diff = (new Date).getTime() - st;
    ok( true, res.length+" time2:"+diff);
    });
    
    
    test("test my array intersection arraybuffer", function(){
    console.log("pl1 "+pl1.int32.length,"pl2 "+pl2.int32.length);
    var st = (new Date).getTime();
    var res=Postings.array_intersect(pl1.int32,pl2.int32);
    var diff = (new Date).getTime() - st;
    ok( true, res.length+" time2:"+diff);
    });
    
    test("test typed array", function() {
    var ar=new Uint32Array([1,2,3]);
    equal( ar[0],1,"type array first item");
    });
     */
    
    test("load big offset array", function () {
        var st = (new Date).getTime();
        stop();
        require.loadmodule('../db/swjz/swjz_punc', function (swjz) {
            var diff = (new Date).getTime() - st;
            ok(true, '天' + swjz.payload["天"]["。"] + ' time' + diff);
            start();
          });
      });
    
    test("load postings", function () {
        var st = (new Date).getTime();
        stop();
        require.loadmodule('../db/swjz/swjz_idx', function (swjz) {
            var diff = (new Date).getTime() - st;
            ok(true, '天' + swjz.payload["天"] + ' time' + diff);
            start();
          });
      });
    
    test("load swjz src", function () {
        var st = (new Date).getTime();
        stop();
        require.loadmodule('../db/swjz/swjz_src', function (swjz) {
            var diff = (new Date).getTime() - st;
            ok(true, 'text loaded time' + diff);
            start();
          });
        
      });
    
    test("decode base64 to array", function () {
        stop();
        require.loadmodule('../db/swjz/swjz_idx.1', function (swjz) {
            var pl = swjz[0];
            var decoded = Postings.loadfrombase64(pl);
            //deepEqual(decoded,[294519004, 294519007, 294519121],"posting raw");
            equal(decoded.length, 3633, "posting raw");
            start();
          });
        
      });
    
    test("decode base64 to array and group", function () {
        stop();
        require.loadmodule('../db/swjz/swjz_idx.1', function (swjz) {
            var pl = swjz[0];
            var decoded = Postings.loadfrombase64(pl);
            var grouped = Postings.groupby(decoded);
            deepEqual(grouped[0].length, 42, "grouped");
            start();
          });
        
      });
    test("removeXMLtext", function () {
        var s = utils.removeXMLtext("abc<d>ef</d><g>hij</k>lmnop");
        equal("<d></d><g></k>", s, "remove text");
      });
    
    test("makevalidxml", function () {
        var missing = {};
        utils.makeValidXML("x</a>x<b>x</b>x<c>", missing);
        deepEqual(missing.prefix, ["a"]);
        deepEqual(missing.suffix, ["c"]);
        
        utils.makeValidXML("<a>", missing);
        deepEqual(missing.suffix, ["a"]);
        
      });
    /*
    test("and posting list", function () {
        stop();
        var data;
        require.loadmodule('../db/swjz/swjz_src', function (swjz) {
            data = swjz;
            start();
          });
        stop();
        
        require.loadmodule('../db/swjz/swjz_idx.1', function (swjz) {
            var st = (new Date).getTime();
            var pl1 = swjz["證"];
            var pl2 = swjz["驗"];
            
            var decoded1 = Postings.loadfrombase64(pl1);
            var decoded2 = Postings.loadfrombase64(pl2);
            
            var output = Postings.pland(decoded1, decoded2, 1);
            var diff = (new Date).getTime() - st;
            ok(true, 'time:' + diff);
            
            console.log(output);
            equal(output.length, 3, "search 證驗");
            var gb = Postings.groupby(output);
            Postings.displaygroupby(gb, data);
            
            start();
          });
        
      });
    
    test("fetchbyid", function () {
        stop();
        Db.use("swjz", function (db) {
            start();
            var data = db.fetchbyid("本");
            equal(data.indexOf(">本</") > 0, true, "fetch 本 position ok");
          });
        
      });
    
    test("fetchbyrowid", function () {
        Db.use("swjz", function (db) {
            var data = Db.fetchbyrowid(db, 1);
            equal(data.indexOf(">一<") > 0, true, "fetch 一 position ok");
            
          });
        
      });
    
    test("pb init ok", function () {
        Db.use("swjz", function (db) {
            //'一:393',
            deepEqual(db.pb.id[0], "1", "pb first item");
          });
        
      });
    
    test("pageidfromid", function () {
        Db.use("swjz", function (db) {
            var data = Db.pagefromid(db, "元");
            equal(data.pageid, "1-1", "page id of 元 is 1-1");
            equal(data.startid, "一", "start id of 元 is 一");
            equal(data.offset, 393, "offset of 元 is 393");
          });
        
      });
    
    test("pageid2idoff", function () {
        Db.use("swjz", function (db) {
            var idoff = Db.pageid2idoff_range(db, "1-1", 0);
            deepEqual(idoff, {
                start : 1,
                end : 4,
                startoff : 393,
                endoff : 137,
                id : "1-1"
              }, "page id 1-1 id off");
            
            var idoff = Db.pageid2idoff_range(db, "1-1", 1);
            deepEqual(idoff, {
                start : 4,
                end : 6,
                startoff : 137,
                endoff : 337,
                id : "1-2"
              }, "page id 1-2 id off");
            
          });
        
      });
    
    test("fetchpage", function () {
        Db.use("swjz", function (db) {
            var idoff = Db.pageid2idoff_range(db, "1-2", 0);
            var r = Db.fetchpage_idoff(db, idoff);
            equal(r.text.substring(0, 2), "舉物", "舉物");
            equal(r.text.substring(r.text.length - 2, r.text.length), "相近", "相近");
          });
        
      });
    */
    test("do search", function () {
        stop();
        Db.use("swjz", function (db) {
            var st = (new Date).getTime();
            var tofind="證驗";
            
            db.preloadidxbytofind(tofind, {} , function() {
            
              var r = SE.search(db, "證驗");
              //deepEqual(r,[107479077, 119078942, 376635443],"search result");
              equal(r.raw.length, 3, "search result count");
              ok(true, r.raw);
              
              var diff = (new Date).getTime() - st;
              ok(true, 'time:' + diff);
              start();
            });
          });
      });
    /*
    test("search result to pageid2offset", function () {
        stop();
        Db.use("swjz", function (db) {
            var pidoff = Db.voff2pageidoff(db, 107479077, "證驗");
            deepEqual(pidoff, {
                pageid : "93-3",
                offset : 15
              }, "voff to page id offset");
            start();
          });
      });
    */
    
    test("tag match", function () {
      var r=[];
      r=Postings.filtertag( [ 1,3 , 5] , [ 1], [2] );
      deepEqual(r,[1],'filter tag 1');
      
      r=Postings.filtertag( [ 1,3 , 5] , [6], [10] );
      deepEqual(r,[],'filter tag 2');

      r=Postings.filtertag( [ 1,3,5, 7 , 9 ] , [2], [8] );
      deepEqual(r,[3,5,7],'filter tag 3');

      r=Postings.filtertag( [ 1,3,5, 7 , 9 ] , [2,8], [6,10] );
      deepEqual(r,[3,5,9],'filter tag 3');
      
      
    });
     test("do fuzzy search", function () {
        stop();
        Db.use("swjz", function (db) {
            var st = (new Date).getTime();
            
            db.preloadidxbytofind("觀察時變", {} , function() {
              var r = SE.fuzzysearch(db, "觀察時變" ,{candidate:2});
              equal( r[0][0] , 2/3 , 'percentage');
							equal( r[0][1] , 16 , 'rowid');
              start();
            });
						
            db.preloadidxbytofind("㠯察時變", {} , function() {
              var r = SE.fuzzysearch(db, "㠯察時變" ,{candidate:2});
              equal( r[0][0] , 1 , 'percentage');
							equal( r[0][1] , 16 , 'rowid');
              start();
            });						
						
          });
      });
   
  });
 