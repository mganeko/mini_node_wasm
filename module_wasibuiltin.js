// -------------------------
// module_wasibuiltin.js - WASM builtin for WASI
// - puts()
// - putn()
// -------------------------

'use strict'

const fs = require('fs');
const println = require('./module_println.js');
const abort = require('./module_abort.js');
const printWarn = require('./module_printwarn.js');

const builtinTamplateFile = 'wasi_builtin_template.watx';

// === exports ===

// --- parser ----
module.exports = wasiBuiltin;

function wasiBuiltin() {
  const builtinFuncs = fs.readFileSync(builtinTamplateFile, 'utf-8');
  //println(builtinFuncs);
  return builtinFuncs;
}