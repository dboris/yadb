/*
  YADB version 3.0 GPL
  yapcheahshen@gmail.com
  2013/12/28
  asyncronize version of yadb, for HTML5 FileAPI

  remove dependency of Q, thanks to
  http://stackoverflow.com/questions/4234619/how-to-avoid-long-nesting-of-asynchronous-functions-in-node-js
*/

var Yfs = require('./yadb3_fs_async');
var DT = require('./datatypes');

var Create = function (path, opts, cb_create) {
  /* loadxxx functions move file pointer */
  // load variable length int

  var loadVInt = function (opts, blocksize, count, cb) {
    //if (count==0) return [];
    this.fs.readBuf_packedint(opts.cur, blocksize, count, true, function (o) {
      opts.cur += o.adv;
      cb.apply(that, [o.data]);
    });
  }

  var loadVInt1 = function (opts, cb) {
    var that = this;
    loadVInt.apply(this, [opts, 6, 1,
      function (data) {
        cb.apply(that, [data[0]]);
      }
    ])
  }

  //for postings
  var loadPInt = function (opts, blocksize, count, cb) {
    var that = this;
    this.fs.readBuf_packedint(opts.cur, blocksize, count, false, function (o) {
      opts.cur += o.adv;
      cb.apply(that, [o.data]);
    });
  }

  // item can be any type (variable length)
  // maximum size of array is 1TB 2^40
  // structure:
  // signature,5 bytes offset, payload, itemlengths
  var getArrayLength = function (opts, cb) {
    var that = this;
    var dataoffset = 0;

    this.fs.readUI8(opts.cur, function (len) {
      var lengthoffset = len * 4294967296;
      opts.cur++;
      that.fs.readUI32(opts.cur, function (len) {
        opts.cur += 4;
        dataoffset = opts.cur; //keep this
        lengthoffset += len;
        opts.cur += lengthoffset;

        loadVInt1.apply(that, [opts,
          function (count) {
            loadVInt.apply(that, [opts, count * 6, count,
              function (sz) {
                cb({
                  count: count,
                  sz: sz,
                  offset: dataoffset
                });
              }
            ]);
          }
        ]);

      });
    });
  }

  var loadArray = function (opts, blocksize, cb) {
    var that = this;
    getArrayLength.apply(this, [opts,
      function (L) {
        var o = [];
        var endcur = opts.cur;
        opts.cur = L.offset;

        if (opts.lazy) {
          var offset = L.offset;
          L.sz.map(function (sz) {
            o.push("\0" + offset.toString(16) + "\0" + sz.toString(16));
            offset += sz;
          })
        } else {
          var taskqueue = [];
          for (var i = 0; i < L.count; i++) {
            taskqueue.push(
              (function (sz) {
                return (
                  function (data) {
                    if (typeof data == 'object' && data.__empty) {
                      //not pushing the first call
                    } else o.push(data);
                    opts.blocksize = sz;
                    load.apply(that, [opts, taskqueue.shift()]);
                  }
                );
              })(L.sz[i])
            );
          }
          //last call to child load
          taskqueue.push(function (data) {
            o.push(data);
            opts.cur = endcur;
            cb.apply(that, [o]);
          });
        }

        if (opts.lazy) cb.apply(that, [o]);
        else {
          taskqueue.shift()({
            __empty: true
          });
        }
      }
    ])
  }

  // item can be any type (variable length)
  // support lazy load
  // structure:
  // signature,5 bytes offset, payload, itemlengths,
  //                    stringarray_signature, keys
  var loadObject = function (opts, blocksize, cb) {
    var that = this;
    var start = opts.cur;
    getArrayLength.apply(this, [opts,
      function (L) {
        opts.blocksize = blocksize - opts.cur + start;
        load.apply(that, [opts,
          function (keys) { //load the keys
            if (opts.keys) { //caller ask for keys
              keys.map(function (k) {
                opts.keys.push(k)
              });
            }

            var o = {};
            var endcur = opts.cur;
            opts.cur = L.offset;
            if (opts.lazy) {
              var offset = L.offset;
              for (var i = 0; i < L.sz.length; i++) {
                //prefix with a \0, impossible for normal string
                o[keys[i]] = "\0" + offset.toString(16) + "\0" + L.sz[i].toString(16);
                offset += L.sz[i];
              }
            } else {
              var taskqueue = [];
              for (var i = 0; i < L.count; i++) {
                taskqueue.push(
                  (function (sz, key) {
                    return (
                      function (data) {
                        if (typeof data == 'object' && data.__empty) {
                          //not saving the first call;
                        } else {
                          o[key] = data;
                        }
                        opts.blocksize = sz;
                        load.apply(that, [opts, taskqueue.shift()]);
                      }
                    );
                  })(L.sz[i], keys[i - 1])

                );
              }
              //last call to child load
              taskqueue.push(function (data) {
                o[keys[keys.length - 1]] = data;
                opts.cur = endcur;

                cb.apply(that, [o]);
              });
            }
            if (opts.lazy) cb.apply(that, [o]);
            else {
              taskqueue.shift()({
                __empty: true
              });
            }
          }
        ]);
      }
    ]);
  }

  //item is same known type
  var loadStringArray = function (opts, blocksize, encoding, cb) {
    var that = this;
    this.fs.readStringArray(opts.cur, blocksize, encoding, function (o) {
      opts.cur += blocksize;
      cb.apply(that, [o]);
    });
  }

  var loadIntegerArray = function (opts, blocksize, unitsize, cb) {
    var that = this;
    loadVInt1.apply(this, [opts,
      function (count) {
        var o = that.fs.readFixedArray(opts.cur, count, unitsize, function (o) {
          opts.cur += count * unitsize;
          cb.apply(that, [o]);
        });
      }
    ]);
  }

  var loadBlob = function (blocksize, cb) {
    var o = this.fs.readBuf(this.cur, blocksize);
    this.cur += blocksize;
    return o;
  }

  var loadbysignature = function (opts, signature, cb) {
    var blocksize = opts.blocksize || this.fs.size;
    opts.cur += this.fs.signature_size;
    var datasize = blocksize - that.fs.signature_size;
    //basic types
    if (signature === DT.int32) {
      opts.cur += 4;
      this.fs.readI32(opts.cur - 4, cb);
    } else if (signature === DT.uint8) {
      opts.cur++;
      this.fs.readUI8(opts.cur - 1, cb);
    } else if (signature === DT.utf8) {
      var c = opts.cur;
      opts.cur += datasize;
      this.fs.readString(c, datasize, 'utf8', cb);
    } else if (signature === DT.ucs2) {
      var c = opts.cur;
      opts.cur += datasize;
      this.fs.readString(c, datasize, 'ucs2', cb);
    } else if (signature === DT.bool) {
      opts.cur++;
      this.fs.readUI8(opts.cur - 1, function (data) {
        cb( !! data)
      });
    } else if (signature === DT.blob) {
      loadBlob(datasize, cb);
    }
    //variable length integers
    else if (signature === DT.vint) {
      loadVInt.apply(this, [opts, datasize, datasize, cb]);
    } else if (signature === DT.pint) {
      loadPInt.apply(this, [opts, datasize, datasize, cb]);
    }
    //simple array
    else if (signature === DT.utf8arr) {
      loadStringArray.apply(this, [opts, datasize, 'utf8', cb]);
    } else if (signature === DT.ucs2arr) {
      loadStringArray.apply(this, [opts, datasize, 'ucs2', cb]);
    } else if (signature === DT.uint8arr) {
      loadIntegerArray.apply(this, [opts, datasize, 1, cb]);
    } else if (signature === DT.int32arr) {
      loadIntegerArray.apply(this, [opts, datasize, 4, cb]);
    }
    //nested structure
    else if (signature === DT.array) {
      loadArray.apply(this, [opts, datasize, cb]);
    } else if (signature === DT.object) {
      loadObject.apply(this, [opts, datasize, cb]);
    } else {
      console.error('unsupported type', signature, opts)
      cb.apply(this, [null]); //make sure it return
      //throw 'unsupported type '+signature;
    }
  }

  var load = function (opts, cb) {
    opts = opts || {}; // this will served as context for entire load procedure
    opts.cur = opts.cur || 0;
    var that = this;
    this.fs.readSignature(opts.cur, function (signature) {
      loadbysignature.apply(that, [opts, signature, cb])
    });
    return this;
  }

  var CACHE = null;
  var KEYS = {};
  var reset = function (cb) {
    if (!CACHE) {
      load.apply(this, [{
          cur: 0,
          lazy: true
        },
        function (data) {
          CACHE = data;
          cb.call(this);
        }
      ]);
    } else {
      cb.call(this);
    }
  }

  var getall = function () {
    throw 'not implement yet'
    var output = {};
    var keys = getkeys();
    for (var i in keys) {
      output[keys[i]] = get([keys[i]], true);
    }
    return output;
  }

  var exists = function (path, cb) {
    if (path.length == 0) return true;
    var key = path.pop();
    var that = this;
    get.apply(this, [path, false,
      function (data) {
        if (!path.join('\0')) return ( !! KEYS[key]);
        var keys = KEYS[path.join('\0')];
        path.push(key); //put it back
        if (keys) cb.apply(that, [keys.indexOf(key) > -1]);
        else cb.apply(that, [false]);
      }
    ]);
  }

  var get = function (path, recursive, cb) {
    if (typeof path == 'undefined') path = [];
    recursive = recursive || false;
    var that = this;

    reset.apply(this, [
      function () {

        var o = CACHE;
        if (path.length == 0 && recursive) {
          getall.apply(that, [cb]);
          return;
        }
        var lazy = !recursive || (i < path.length - 1);
        var pathnow = "",
          taskqueue = [],
          opts = {
            lazy: lazy
          }, r = null;
        var lastkey = "";
        for (var i = 0; i < path.length; i++) {
          var task = (function (key, k) {
            return (function (data) {
              if (!(typeof data == 'object' && data.__empty)) {
                if (typeof o[lastkey] == 'string' && o[lastkey][0] == "\0") o[lastkey] = {};
                o[lastkey] = data;
                o = o[lastkey];
                r = data[key];
                KEYS[pathnow] = opts.keys;
              } else {
                data = o[key];
                r = data;
              }

              if (r === undefined) {
                taskqueue = null;
                cb.apply(that, [r]); //return empty value
              } else {
                if (parseInt(k)) pathnow += "\0";
                pathnow += key;
                if (typeof r == 'string' && r[0] == "\0") { //offset of data to be loaded
                  var p = r.substring(1).split("\0").map(function (item) {
                    return parseInt(item, 16)
                  });
                  var cur = p[0],
                    sz = p[1];
                  opts.blocksize = sz;
                  opts.cur = cur, opts.keys = [];
                  load.apply(that, [opts, taskqueue.shift()]);
                  lastkey = key;
                } else {
                  var next = taskqueue.shift();
                  next.apply(that, [r]);
                }
              }
            })
          })
          (path[i], i);

          taskqueue.push(task);
        }

        if (taskqueue.length == 0) {
          cb.apply(that, [o]);
        } else {
          //last call to child load
          taskqueue.push(function (data) {
            var key = path[path.length - 1];
            o[key] = data;
            KEYS[pathnow] = opts.keys;
            cb.apply(that, [data]);
          });
          taskqueue.shift()({
            __empty: true
          });
        }

      }
    ]); //reset
  }

  // get all keys in given path
  var getkeys = function (path, cb) {
    if (!path) path = []
    var that = this;
    get.apply(this, [path, false,
      function () {
        if (path && path.length) {
          cb.apply(that, [KEYS[path.join("\0")]]);
        } else {
          cb.apply(that, [Object.keys(CACHE)]);
          //top level, normally it is very small
        }
      }
    ]);
  }

  var setupapi = function () {
    this.load = load;
    //    this.cur=0;
    this.cache = function () {
      return CACHE
    };
    this.free = function () {
      CACHE = null;
      KEYS = null;
      this.fs.free();
    }
    this.keys = getkeys;
    this.get = get; // get a field, load if needed
    this.getJSON = get; //compatible with yadb2
    this.exists = exists;
    cb_create(this);
  }

  this._setupapi = setupapi;

  var that = this;

  var t = new Yfs(path, opts, function (yfs) {
    that.fs = yfs;
    that.size = yfs.size;
    that._setupapi.call(that);
  });

  return this;
}

Create.datatypes = DT;

if (module) module.exports = Create;
//return Create;
