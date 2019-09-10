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
// - 06: temp func
//   - 03: putn()
//   - 06: puts()
//   - 06: static string
// - 04: compare operator (===, !==, <, > <=, >=)
//   - NOT NEED?: convert between bool <--> i32
// - 05: if
//   - 05: if
//   - 05: if-else
// - 05: while
// - user defined function
//   - 07: single arg
//   - 07: multi args
//   - 07: ret
//   - 07: call user defined / builtin
//   - dummy ret code?
//   - 07: generate function code
//   - 07: declare local variable in func
//   - 07: self call (fib)

// refer https://www.kabuku.co.jp/developers/webassembly
// refer https://blog.scottlogic.com/2018/04/26/webassembly-by-hand.html
// refer https://qiita.com/bellbind/items/2619f8b71c3a69cc28be

"use strict"

const loadAndParseSrc = require('./module_parser_15.js');
const println = require('./module_println.js');
const printObj = require('./module_printobj.js');
const abort = require('./module_abort.js');
const getTypeOf = require('./module_gettypeof.js');
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

let g_ctx = {
  'strIdx': 0, // string index
  'strOffset': 0, // offset of next string
  'strList': {}, // string hash:  strList['$s_1'] = ['xxxxx', offset, length]
  'funcList': {},  // function hash: funcList['func1'] = [func_type, func_symbol, ret_type, args_count, func_body]
  //  ex) funcList['add'] = ['user_defined', '$add', 'i32', 2, '.....']
};

// -- add global string, return name of string --
function addGlobalString(str, gctx) {
  // -- strings --
  // '$s_1' : ['xxxxxxx', offset, len],

  // --- name of string
  let idx = gctx['strIdx'];
  const name = '$s_' + idx;
  idx = idx + 1;
  gctx['strIdx'] = idx;

  const len = getLength(str);
  const cstr = str + '\\00';
  const clen = len + 1;
  const coffset = gctx['strOffset'];
  const nextOffset = coffset + clen;
  gctx['strOffset'] = nextOffset;

  const globalString = [cstr, coffset, clen];
  let strList = gctx['strList'];
  strList[name] = globalString;

  return coffset;
}

function generateGlobalString(gctx) {
  let block = '';
  const strList = gctx['strList'];
  const strings = getKeys(strList);
  const len = getLength(strings);
  let key;
  let i = 0;
  let gstr;
  let offset;
  let str;
  while (i < len) {
    key = strings[i];
    gstr = strList[key]; // ['xxxxxxx', offset, length]
    str = gstr[0];
    offset = gstr[1];

    block = block + TAB() + '(data (i32.const ' + offset + ') "' + str + '")' + LF();
    i = i + 1;
  }

  return block;
}

//ex) funcList['add'] = ['user_defined', '$add', 'i32', '.....']
function addGlobalFunc(gctx, name, symbol, type, funcBlock) {
  let funcList = gctx['funcList'];
  funcList[name] = ['user_defined', symbol, type, funcBlock];
}

function getGlobalFunc(gctx, name) {
  const funcList = gctx['funcList'];
  return funcList[name];
}

function getGlobalFunctionNames(gctx) {
  const funcList = gctx['funcList'];
  const names = getKeys(funcList);
  return names;
}

function generateGlobalFunctions(gctx) {
  let block = LF();
  block = block + TAB() + ';; --- user_defined functions ---' + LF();

  const names = getGlobalFunctionNames(gctx);
  const len = getLength(names);
  println('--getGlobalFunctionNames() len=' + len);
  let key;
  let i = 0;
  let gfunc;
  while (i < len) {
    key = names[i];
    gfunc = getGlobalFunc(gctx, key);
    // gfunc : ['user_defined', symbol, type, funcBlock];
    if (gfunc[0] === 'user_defined') {
      block = block + gfunc[3] + LF();
    }

    i = i + 1;
  }

  return block;
}

// ---- compile simplified tree into WAT ---
function compile(tree, gctx, lctx) {
  const indent = 1;
  const mainBlock = generate(tree, indent + 1, gctx, lctx);
  const varOffset = 0;
  const varBlock = generateVariableBlock(indent + 1, lctx, varOffset);

  let block = '(module' + LF();
  // -- builtin func (imports) --
  block = block + TAB() + ';; ---- builtin func imports ---' + LF();
  block = block + TAB() + '(func $putn (import "imports" "imported_putn") (param i32))' + LF();
  block = block + TAB() + '(func $puts (import "imports" "imported_puts") (param i32))' + LF();

  // --- mempory segment (static string) --
  const stringBlock = generateGlobalString(gctx);
  block = block + LF();
  block = block + TAB() + ';; ---- export static string  ---' + LF();
  block = block + TAB() + '(memory $string_area 1) ;; string_area 64KiB' + LF();
  //block = block + TAB() + '(data (i32.const 0) "Hello world!\\00") ;; 13 bytes' + LF();
  //block = block + TAB() + '(data (i32.const 13) "Hello WASM!\\00") ;; 12 bytes' + LF();
  block = block + stringBlock;
  block = block + TAB() + '(export "exported_string" (memory $string_area))' + LF();

  // --- export main function  --
  block = block + LF();
  block = block + TAB() + ';; ---- export main function  ---' + LF();
  block = block + TAB() + '(export "exported_main" (func $main))' + LF();
  block = block + TAB() + '(func $main (result i32)' + LF();
  block = block + varBlock + LF();
  block = block + mainBlock + LF();
  block = block + TAB() + TAB() + 'return' + LF();
  block = block + TAB() + ')' + LF();

  // ---- global user_defined functions ---
  block = block + generateGlobalFunctions(gctx);

  block = block + ')';

  return block;
}

// ---- genereate WAT block ---
function generate(tree, indent, gctx, lctx) {
  if (tree === null) {
    return '';
  }

  // --- multi lines ---
  if (tree[0] === 'stmts') {
    let i = 1;
    let block = '';
    let lineBlock = '';
    while (tree[i]) {
      lineBlock = generate(tree[i], indent, gctx, lctx);
      if (lineBlock !== '') {
        //block = block + lineBlock + LF() + LF();
        block = block + lineBlock + LF();
      }
      i = i + 1;
    }
    return block;
  }

  // === tentative func call for debug (putn, puts) ====
  if (tree[0] === 'func_call') {  // tree = ['func_call', 'name', arg1, arg2, ... ]
    const funcName = tree[1];

    // --- builtin function ---
    if (funcName === 'putn') {
      return generateCallPutn(tree, indent, gctx, lctx);
    }
    if (funcName === 'puts') {
      return generateCallPuts(tree, indent, gctx, lctx);
    }

    // --- user defined functions ---
    const block = generateFunCall(tree, indent, gctx, lctx);
    return block;

    //println('-- ERROR: unknown func in generate() ---');
    //printObj(tree);
    //abort();
  }

  // --- func_def user_defined function ---
  if (tree[0] === 'func_def') {
    const block = generateFuncDef(tree, 1, gctx);
    return block;
  }

  // --- return from function ---
  if (tree[0] === 'ret') {
    const block = generateFuncRet(tree, indent, gctx, lctx);
    return block;
  }

  // --- while ---
  if (tree[0] === 'while') {
    const block = genereateWhile(tree, indent, gctx, lctx);
    return block;
  }

  // --- if ---
  if (tree[0] === 'if') {
    const block = genereateIf(tree, indent, gctx, lctx);
    return block;
  }

  // --- local variable --
  if (tree[0] === 'var_decl') {
    const block = declareVariable(tree, indent, gctx, lctx);
    return block;
  }
  if (tree[0] === 'var_assign') {
    const block = assignVariable(tree, indent, gctx, lctx);
    return block;
  }
  if (tree[0] === 'var_ref') {
    const block = referVariable(tree, indent, gctx, lctx);
    return block;
  }

  if (tree[0] === 'lit') {
    return generateLiteral(tree, indent, gctx, lctx);
  }

  // --- binary operator ---
  if (tree[0] === '+') {
    return generateBinaryOperator(tree, indent, 'add', gctx, lctx);
  }
  if (tree[0] === '-') {
    return generateBinaryOperator(tree, indent, 'sub', gctx, lctx);
  }
  if (tree[0] === '*') {
    return generateBinaryOperator(tree, indent, 'mul', gctx, lctx);
  }
  if (tree[0] === '/') {
    return generateBinaryOperator(tree, indent, 'div_s', gctx, lctx);
  }
  if (tree[0] === '%') {
    return generateBinaryOperator(tree, indent, 'rem_s', gctx, lctx);
  }

  // --- compare operator ---
  if (tree[0] === '===') {
    return generateCompareOperator(tree, indent, 'eq', gctx, lctx);
  }
  if (tree[0] === '==') {
    return generateCompareOperator(tree, indent, 'eq', gctx, lctx);
  }
  if (tree[0] === '!==') {
    return generateCompareOperator(tree, indent, 'ne', gctx, lctx);
  }
  if (tree[0] === '!=') {
    return generateCompareOperator(tree, indent, 'ne', gctx, lctx);
  }
  if (tree[0] === '>') {
    return generateCompareOperator(tree, indent, 'gt_s', gctx, lctx);
  }
  if (tree[0] === '>=') {
    return generateCompareOperator(tree, indent, 'ge_s', gctx, lctx);
  }
  if (tree[0] === '<') {
    return generateCompareOperator(tree, indent, 'lt_s', gctx, lctx);
  }
  if (tree[0] === '<=') {
    return generateCompareOperator(tree, indent, 'le_s', gctx, lctx);
  }


  println('-- ERROR: unknown node in generate() ---');
  printObj(tree);
  abort();
}

// --- define function --- 
function generateFuncDef(tree, indent, gctx) {
  // tree = ["func_def", name, args[], body[]]
  // -- append to global context --
  // function hash: funcList['func1'] = [func_type, func_symbol, ret_type, func_block]
  //  ex) funcList['add'] = ['user_defined', '$add', 'i32', '...']

  const funcName = tree[1];
  const args = tree[2];
  const argCount = getLength(tree[2]);
  const funcSymbol = '$' + funcName;
  const funcType = 'i32';
  const funcResult = '(result ' + funcType + ')';

  let funcBlock = TABs(indent) + '(func ' + funcSymbol;

  // -- add temporary with empty body ---
  addGlobalFunc(gctx, funcName, funcSymbol, funcType, '');

  // --- agrs ---
  let argBlock = '';
  let i = 0;
  while (i < argCount) {
    argBlock = argBlock + ' ' + '(param $' + args[i] + ' i32)';
    i = i + 1;
  }
  funcBlock = funcBlock + argBlock + ' ' + funcResult + LF();

  // --- func bocy ---
  // --- prepare new local context for inside of function --
  let newLctx = initialLocalContext();
  // --- NEED to add args as localVar
  i = 0;
  let name;
  let varName;
  while (i < argCount) {
    name = args[i];
    varName = '$' + name;
    newLctx[name] = varName;
    i = i + 1;
  }
  let funcBody = generate(tree[3], indent + 1, gctx, newLctx);

  // --- build func block ---
  const varOffset = argCount;
  const varBlock = generateVariableBlock(indent + 1, newLctx, varOffset);
  funcBlock = funcBlock + varBlock + funcBody;

  // --- add dummy return ---
  funcBlock = funcBlock + TABs(indent + 1) + 'i32.const 88' + LF();
  funcBlock = funcBlock + TABs(indent + 1) + 'return' + LF();

  // --- close func definition ---
  funcBlock = funcBlock + TABs(indent) + ')' + LF();

  // ==== whole func definition ===
  addGlobalFunc(gctx, funcName, funcSymbol, funcType, funcBlock);
  println('---funcBlock--');
  println(funcBlock);

  // --- no code in this timing --
  const empty = '';
  return empty;
}

/*--
  (func $sub_func (param $x i32) (param $y i32) (result i32)
    (i32.sub
      (get_local $x)
      (get_local $y)
    )
  )
--*/

function generateFuncRet(tree, indent, gctx, lctx) {
  const valueBlock = generate(tree[1], indent, gctx, lctx);
  // let block = TABs(indent) + '(return' + LF();
  // block = block + valueBlock + LF();
  // block = block + TABs(indent) + ')' + LF();

  let block = valueBlock + LF();
  block = block + TABs(indent) + 'return' + LF();

  return block;
}

// --- user defined functions ---
function generateFunCall(tree, indent, gctx, lctx) {
  // tree ['func_call', 'name', arg1, arg2, ... ]
  const funcName = tree[1];
  const gfunc = getGlobalFunc(gctx, funcName);
  // gfunc : ['user_defined', symbol, type, funcBlock];
  if (gfunc) {
    let block = '';

    // --- args ---
    let argBlock = '';
    let i = 0;
    while (tree[2 + i]) {
      argBlock = argBlock + generate(tree[2 + i], indent, gctx, lctx) + LF();
      i = i + 1;
    }

    // --- call ---
    // block = block + TABs(indent) + '(call ' + gfunc[1] + LF();
    // block = block + argBlock;
    // block = block + TABs(indent) + ')';

    block = block + argBlock;
    block = block + TABs(indent) + 'call ' + gfunc[1] + LF();

    return block;
  }

  println('-- ERROR: unknown func in generateFunCall() name=' + funcName);
  abort();
}
// (call $sub_func
//   (get_local $a)
//   (i32.const 2)
// )

// --- debug func putn() ---
function generateCallPutn(tree, indent, gctx, lctx) {
  // tree = ['func_call', 'name', arg1, arg2, ... ]

  const valueBlock = generate(tree[2], indent, gctx, lctx);
  if (!valueBlock) {
    println('---ERROR: empty args for putn() --');
    abort();
  }

  let block = valueBlock + LF();
  block = block + TABs(indent) + 'call $putn' + LF();

  return block;
}

// --- debug func puts() ---
function generateCallPuts(tree, indent, gctx, lctx) {
  // tree = ['func_call', 'name', arg1, arg2, ... ]

  const valueBlock = generate(tree[2], indent, gctx, lctx);

  let block = valueBlock + LF();
  block = block + TABs(indent) + 'call $puts' + LF();

  return block;
}

// --- while ---
// tree = ['while', condition, then, else]
function genereateWhile(tree, indent, gctx, lctx) {
  const conditionBlock = generate(tree[1], indent + 1, gctx, lctx);
  const innerBlock = generate(tree[2], indent + 2, gctx, lctx);

  let block = TABs(indent) + 'loop ;; --begin of while loop--' + LF();
  block = block + conditionBlock;
  block = block + TABs(indent + 1) + 'if' + LF();
  block = block + innerBlock;
  block = block + TABs(indent + 2) + 'br 1 ;; --jump to head of while loop--' + LF();
  block = block + TABs(indent + 1) + 'end ;; end of if-then' + LF();
  block = block + TABs(indent) + 'end ;; --end of while loop--';

  return block;
}


// --- if ---
// tree = ['if', condition, then, else]
function genereateIf(tree, indent, gctx, lctx) {
  const conditionBlock = generate(tree[1], indent, gctx, lctx);
  const positiveBlock = generate(tree[2], indent + 1, gctx, lctx);

  // -- condition --
  let block = conditionBlock + LF();

  // -- if-then --
  block = block + TABs(indent) + 'if' + LF();
  block = block + positiveBlock;

  // -- else ---
  if (tree[3]) {
    const negativeBlock = generate(tree[3], indent + 1, gctx, lctx);
    block = block + TABs(indent) + 'else' + LF();
    block = block + negativeBlock;
  }

  // -- end --
  block = block + TABs(indent) + 'end' + LF();

  return block;
}


// --- declare variable ---
function declareVariable(tree, indent, gctx, lctx) {
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
  let init = generate(tree[2], indent, gctx, lctx);

  let block = '';
  if (init) {
    block = block + init + LF();
    block = block + TABs(indent) + 'set_local ' + varName + LF();
  }

  return block;
}

// --- refer variable ---
function referVariable(tree, indent, gctx, lctx) {
  // -- check EXIST --
  const name = tree[1];
  if (name in lctx) {
    let block = '';
    const varName = lctx[name];

    block = TABs(indent) + 'get_local ' + varName;

    return block;
  }

  println('---ERROR: varibable NOT declarated (ref)--:' + name);
  abort();
}

// --- assign variable ---
function assignVariable(tree, indent, gctx, lctx) {
  // -- check EXIST --
  const name = tree[1];
  if (name in lctx) {
    let block = '';
    const varName = lctx[name];

    const valueBlock = generate(tree[2], indent, gctx, lctx);
    if (!valueBlock) {
      println('---ERROR: var assign value NOT exist --');
      abort();
    }

    block = block + valueBlock + LF();
    block = block + TABs(indent) + 'set_local ' + varName + LF();

    return block;
  }

  println('---ERROR: varibable NOT declarated (assign)--:' + name);
  abort();
}


function generateVariableBlock(indent, lctx, offset) {
  const variables = getKeys(lctx);
  const len = getLength(variables);
  let key;
  let i = offset;
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
function generateLiteral(tree, indent, gctx, lctx) {
  const v = tree[1];
  const t = getTypeOf(v);

  if (t === 'number') {
    const block = TABs(indent) + 'i32.const ' + v;
    return block;
  }

  if (t === 'string') {
    // --- string literal ---
    const offset = addGlobalString(tree[1], gctx);
    const block = TABs(indent) + 'i32.const ' + offset;
    return block;
  }

  println('---ERROR: unknwon type of literal--:' + t);
  abort();
}


// --- binary operator ---
function generateBinaryOperator(tree, indent, operator, gctx, lctx) {
  const leftBlock = generate(tree[1], indent, gctx, lctx);
  const rightBlock = generate(tree[2], indent, gctx, lctx);
  const op = 'i32.' + operator;

  let block = '';
  block = block + leftBlock + LF();
  block = block + rightBlock + LF();
  block = block + TABs(indent) + op + LF();

  return block;
}

// --- compare operator ---
function generateCompareOperator(tree, indent, operator, gctx, lctx) {
  const leftBlock = generate(tree[1], indent, gctx, lctx);
  const rightBlock = generate(tree[2], indent, gctx, lctx);
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
const wat = compile(tree, g_ctx, l_ctx);
printWarn('--- WAT generated ---');
println(wat);
writeFile('generated.wat', wat);

// -- to comvert to wasm ---
// $ wat2wasm generated.wat