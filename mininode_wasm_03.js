// -------------------------
// mininode_wasm.js - Mini Node.js WASM translator by Node.js
// - 01: i32 literal
// - 02: binary operator
//   - 02: +
//   - 02: -, *, /, % 
// - 03: multi-lines
// - 03: local variable
//   - 03: declare
//   - 03: initial value
//   - 03: refer
//   - 03: assign
// - 03: temp func
//   - 03: putn()

"use strict"

const loadAndParseSrc = require('./module_parser_15.js');
const println = require('./module_println.js');
const printObj = require('./module_printobj.js');
const abort = require('./module_abort.js');
//const getTypeOf = require('./module_gettypeof.js');
const getLength = require('./module_getlength.js');
const getKeys = require('./module_getkeys.js');
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

function TABs(n) {
  let tabs = '';
  let i = 0;
  while (i < n) {
    tabs = tabs + TAB();
    i = i + 1;
  }

  return tabs;
}

// ==== compile to WAT/WASM =====
function initialLocalContext() {
  const ctx = {
  };
  return ctx;
}
let l_ctx = initialLocalContext(); // top level local context


// ---- compile simplified tree into WAT ---
function compile(tree, lctx) {
  const mainBlock = generate(tree, 2, lctx);
  const varBlock = generateVariableBlock(tree, 2, lctx);

  let block = '(module' + LF();
  block = block + TAB() + '(func $putn (import "imports" "imported_putn") (param i32))' + LF();
  block = block + TAB() + '(export "exported_main" (func $main))' + LF();
  block = block + TAB() + '(func $main (result i32)' + LF();
  block = block + varBlock + LF();
  block = block + mainBlock + LF();
  block = block + TAB() + TAB() + 'return' + LF();
  block = block + TAB() + ')' + LF();
  block = block + ')';

  return block;
}

// ---- genereate WAT block ---
function generate(tree, indent, lctx) {
  if (tree === null) {
    return '';
  }

  // --- multi lines ---
  if (tree[0] === 'stmts') {
    let i = 1;
    let block = '';
    while (tree[i]) {
      block = block + generate(tree[i], indent, lctx) + LF() + LF();
      i = i + 1;
    }
    return block;
  }

  // === tentative func call for debug (putn) ====
  if (tree[0] === 'func_call') {  // tree = ['func_call', 'name', arg1, arg2, ... ]
    const funcName = tree[1];
    if (funcName === 'putn') {
      return generateCallPutn(tree, indent, lctx);
    }

    println('-- ERROR: unknown func in generate() ---');
    printObj(tree);
    abort();
  }


  // --- local variable --
  if (tree[0] === 'var_decl') {
    const block = declareVariable(tree, indent, lctx);
    return block;
  }
  if (tree[0] === 'var_assign') {
    const block = assignVariable(tree, indent, lctx);
    return block;
  }
  if (tree[0] === 'var_ref') {
    const block = referVariable(tree, indent, lctx);
    return block;
  }

  if (tree[0] === 'lit') {
    return generateLiteral(tree, indent, lctx);
  }

  // --- binary operator ---
  if (tree[0] === '+') {
    return generateBinaryOperator(tree, indent, 'add', lctx);
  }
  if (tree[0] === '-') {
    return generateBinaryOperator(tree, indent, 'sub', lctx);
  }
  if (tree[0] === '*') {
    return generateBinaryOperator(tree, indent, 'mul', lctx);
  }
  if (tree[0] === '/') {
    return generateBinaryOperator(tree, indent, 'div_s', lctx);
  }
  if (tree[0] === '%') {
    return generateBinaryOperator(tree, indent, 'rem_s', lctx);
  }

  println('-- ERROR: unknown node in generate() ---');
  printObj(tree);
  abort();
}

// --- debug func putn() ---
function generateCallPutn(tree, indent, lctx) {
  // tree = ['func_call', 'name', arg1, arg2, ... ]

  const valueBlock = generate(tree[2], indent, lctx);
  if (!valueBlock) {
    println('---ERROR: empty args for putn() --');
    abort();
  }

  //let block = TABs(indent) + '(call $putn' + LF();
  //block = block + valueBlock + LF();
  //block = block + TABs(indent) + ')';

  let block = valueBlock + LF();
  block = block + TABs(indent) + 'call $putn' + LF();

  return block;
}

// --- declare variable ---
function declareVariable(tree, indent, lctx) {
  // -- check NOT exist --
  const name = tree[1];
  if (name in lctx) {
    println('---ERROR: varbable ALREADY exist (compiler) --');
    abort();
  }

  // -- add local variable --
  const varName = '$' + name;
  lctx[name] = varName;

  // --- assign initial value --
  let init = generate(tree[2], indent, lctx);

  let block = '';
  if (init) {
    //block = TABs(indent) + '(set_local ' + varName + LF();
    //block = block + init + LF();
    //block = block + TABs(indent) + ')';

    block = block + init + LF();
    block = block + TABs(indent) + 'set_local ' + varName + LF();
  }

  return block;
}

// --- refer variable ---
function referVariable(tree, indent, lctx) {
  // -- check EXIST --
  const name = tree[1];
  if (name in lctx) {
    let block = '';
    const varName = lctx[name];

    //block = TABs(indent) + '(get_local ' + varName + ')'
    block = TABs(indent) + 'get_local ' + varName;

    return block;
  }

  println('---ERROR: varibable NOT declarated (ref)--:' + name);
  abort();
}

// --- assign variable ---
function assignVariable(tree, indent, lctx) {
  // -- check EXIST --
  const name = tree[1];
  if (name in lctx) {
    let block = '';
    const varName = lctx[name];

    const valueBlock = generate(tree[2], indent, lctx);
    if (!valueBlock) {
      println('---ERROR: var assign value NOT exist --');
      abort();
    }

    //block = TABs(indent) + '(set_local ' + varName + LF();
    //block = block + valueBlock + LF();
    //block = block + TABs(indent) + ')';

    block = block + valueBlock + LF();
    block = block + TABs(indent) + 'set_local ' + varName + LF();

    return block;
  }

  println('---ERROR: varibable NOT declarated (assign)--:' + name);
  abort();
}


function generateVariableBlock(tree, indent, lctx) {
  const variables = getKeys(lctx);
  const len = getLength(variables);
  let key;
  let i = 0;
  let block = '';
  let varName;
  while (i < len) {
    key = variables[i];
    varName = lctx[key];

    //  (local $a i32)
    block = block + TABs(indent) + '(local ' + varName + ' i32)' + LF();
    i = i + 1;
  }

  return block;
}

// --- lit ---
function generateLiteral(tree, indent, lctx) {
  const v = tree[1];

  const block = TABs(indent) + 'i32.const ' + v;
  return block;
}


// --- binary operator ---
function generateBinaryOperator(tree, indent, operator, lctx) {
  const leftBlock = generate(tree[1], indent, lctx);
  const rightBlock = generate(tree[2], indent, lctx);
  const op = 'i32.' + operator;

  let block = '';
  block = block + leftBlock + LF();
  block = block + rightBlock + LF();
  block = block + TABs(indent) + op + LF();
  return block;
}



// ======== start compiler =======

// --- load and parse source ---
printWarn('-- start WAT translator --');
const tree = loadAndParseSrc();
printWarn('--- source parsed ---');
printObj(tree);

// --- compile to WAT --
const wat = compile(tree, l_ctx);
printWarn('--- WAT generated ---');
println(wat);
writeFile('generated.wat', wat);

// -- to comvert to wasm ---
// $ wat2wasm generated.wat