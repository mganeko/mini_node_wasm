// -------------------------
// mininode_wasm.js - Mini Node.js WASM translator by Node.js
// - 01: i32 literal
// - binary operator
//   - +
//   - -, *, /, % 

"use strict"

const loadAndParseSrc = require('./module_parser_15.js');
const println = require('./module_println.js');
const printObj = require('./module_printobj.js');
const abort = require('./module_abort.js');
//const getTypeOf = require('./module_gettypeof.js');
//const getLength = require('./module_getlength.js');
//const getKeys = require('./module_getkeys.js');
const printWarn = require('./module_printwarn.js');
//const isDouble = require('./module_isdouble.js');
const writeFile = require('./module_writefile.js');

// ======== for comiler =======
function LF() {
  return '\n';
}

function TAB() {
  return '  ';
}

// ==== compile to WAT/WASM =====

// ---- compile simplified tree into WAT ---
function compile(tree) {
  const mainBlock = generate(tree);

  let block = '(module' + LF();
  block = block + TAB() + '(export "exported_main" (func $main))' + LF();
  block = block + TAB() + '(func $main (result i32)' + LF();
  block = block + TAB() + TAB() + mainBlock + LF();
  block = block + TAB() + TAB() + 'return' + LF();
  block = block + TAB() + ')' + LF();
  block = block + ')';

  return block;
}

// ---- genereate WAT block ---
function generate(tree) {
  if (tree === null) {
    return '';
  }

  if (tree[0] === 'lit') {
    const v = tree[1];

    const block = 'i32.const ' + v;
    return block;
  }

  println('-- ERROR: unknown node in generate() ---');
  printObj(tree);
  abort();
}

// ======== start compiler =======

// --- load and parse source ---
printWarn('-- start WAT translator --');
const tree = loadAndParseSrc();
printWarn('--- source parsed ---');
printObj(tree);

// --- compile to WAT --
const wat = compile(tree);
printWarn('--- WAT generated ---');
println(wat);
writeFile('generated.wat', wat);

// -- to comvert to wasm ---
// $ wat2wasm generated.wat