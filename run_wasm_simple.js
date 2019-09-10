// run_wasm_simple.js
//  refer https://www.codepool.biz/use-webassembly-node-js.html
//  refer https://medium.com/commitlog/hello-webassembly-882bba5c9fb7

'use strict'

const fs = require('fs');
const filename = process.argv[2]; // 対象とするwasmファイル名
console.warn('Loading wasm file: ' + filename);

let source = fs.readFileSync(filename);
let typedArray = new Uint8Array(source);
let ret = null;


WebAssembly.instantiate(typedArray, 
  {} // 実行時の環境
).then(result => {
  ret = result.instance.exports.exported_main();
  console.warn('ret code=' + ret);
  process.exit(ret);
}).catch(e => {
  console.log(e);
});



