var handler=function() {
	this.data='';
	return 'q'
}
var context={data:'123'};
context.data+=handler.call(context);
console.log( context.data ) //incorrect

var r=handler.call(context);
context.data+=r;
console.log( context.data ) //correct