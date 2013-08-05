require('../yadb2')

var errors = 0

saveJSON('abc.ya',  {"a": [ "a1","a2","a3" ] ,"b":{"b1":[7,7,7],"b2":8,"b3":9},"c":3 })

function cmp(ok, a, b) {
	a = JSON.stringify(a)
	b = JSON.stringify(JSON.parse(b))
	if (b != a) errors++, console.log('FAIL compare: ' + a + ' to ' + b)
	else console.log(ok)
}

var f = new Yadb()
f.open('abc.ya')

var json=f.getJSON(["b"], false)
cmp('level 1 get', json, '{"b1":null,"b2":8,"b3":9}')

var json=f.getJSON(["b","b1"],false)
cmp('level 2 get of array', json, '[7, 7,7]')

f.close()

console.log(errors == 0 ? 'ALL OK':'Errors: ' + errors)

require('fs').unlink('abc.ya')
