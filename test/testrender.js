define(['underscore','htmlrender','qunit'], 
function(_,htmlrender){
	module("render", {setup:function(){
	}});

  test("line break", function() {
		var input="",output="";

		input="abc\n123\n";
		var output=htmlrender.kml2html(input);
		equal(output,"abc<br>123<br>","line break kml>html");
		
		output2=htmlrender.html2kml(output);
		equal(output2,input,"Line break html>kml");

		//<div>x</div> is created by pressing enter
		output2=htmlrender.html2kml("abc<div>123</div><br>");
		equal(output2,input,"Line break with div html>kml");
		
  });
	
	
  test("span", function() {
		var input="",output="";

		input="abc<x>123</x>";
		var output=htmlrender.kml2html(input);
		equal(output,'abc<span class="x">123</span>',"span kml>html");
		
	});
	
	test("surrogate",function() {
		input='a\\ud865\\udd3bb';
		var output=htmlrender.kml2html(input);
		var expected="a";
		expected+=String.fromCharCode(0xd865,0xdd3b);
		expected+='b';
		equal(output,expected,'surrogate pair');
	});


});