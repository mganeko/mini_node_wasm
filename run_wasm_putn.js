// run_wasm_putn.js
//  refer https://www.codepool.biz/use-webassembly-node-js.html
//  refer https://medium.com/commitlog/hello-webassembly-882bba5c9fb7

'use strict'

const fs = require('fs');

const filename = process.argv[2]; // 対象とするwasmファイル名
console.warn('Loading wasm file: ' + filename);

let source = fs.readFileSync(filename);
let typedArray = new Uint8Array(source);


const imports = {
  imported_putn: function (arg) { // built-in function putn(): for put i32 to console
    console.log(arg);
  }
};


WebAssembly.instantiate(typedArray,
  { imports: imports }
).then(result => {
  const ret = result.instance.exports.exported_main();
  console.warn('ret code=' + ret);
  process.exit(ret);
}).catch(e => {
  console.log(e);
});



