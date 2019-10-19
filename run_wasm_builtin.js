// run_wasm_builtin.js
//  refer https://www.codepool.biz/use-webassembly-node-js.html
//  refer https://medium.com/commitlog/hello-webassembly-882bba5c9fb7

'use strict'

const fs = require('fs');

const filename = process.argv[2]; // 対象とするwasmファイル名
console.warn('Loading wasm file: ' + filename);

const source = fs.readFileSync(filename);
const typedArray = new Uint8Array(source);


const imports = {
  imported_putn: function (arg) { // built-in function putn(): for put i32 to console
    console.log(arg);
  },
  imported_puts: function (offset) { // built-in function puts(): for put static string to console
    let str = '';
    let arr = new Uint8Array(exported_string.buffer);
    for (let i = offset; arr[i]; i++) {
      str += String.fromCharCode(arr[i]);
    }
    console.log(str);
  }
};

let ret = null;
let exported_string = null;

WebAssembly.instantiate(typedArray,
  { imports: imports }
).then(result => {
  exported_string = result.instance.exports.exported_string;
  ret = result.instance.exports.exported_main();
  console.warn('ret code=' + ret);
  process.exit(ret);
}).catch(e => {
  console.log(e);
});



