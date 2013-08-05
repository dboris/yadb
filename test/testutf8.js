var iosurrogate=require('../../ksanacjk/iosurrogate');
var fs=require('fs');
var arr=iosurrogate.utf8filetoarraySync('utf8bom.txt');
var arr2=fs.readFileSync('utf8bom.txt','utf8').toString();
console.log(arr2);
/*
for (var i in arr) {
	line=arr[i];
	var output="";
	for (var j in line) {
		output+=line.charCodeAt(j).toString(16) +' ';
	}
	//console.log(output);
}
*/
console.log("read");
var data=arr.join('\n');
var t=new Date();
iosurrogate.writeUtf8Sync( 'utf8_o.txt',data);
console.log('elapse iosurrogate',new Date()-t);

t=new Date();
data+=String.fromCharCode(0xd840,0xdc02);
console.log(data);
fs.writeFileSync('utf8_or.txt',arr2,'utf8');
console.log('elapse original',new Date()-t);