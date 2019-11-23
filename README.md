# Node.jsでつくるミニミニnode-WASMコンパイラー

## はじめに

ミニミニNode.jsを、WebAssembly(WASM) に変換するコンパイラーです。
ミニマムなNode.jsインタープリターで実行できるように書かれています。

## できること

- 扱えるのは32ビット符号あり整数のみ
- 四則演算、余りの計算
- ローカル変数
  -  配列やハッシュ（連想配列）は使えない
- if - else
- ループはwhileのみ
- 組込関数として、整数の出力と、固定文字列の出力ができる
- ユーザ定義関数が使える
- FizzBuzzと、再帰によるフィボナッチ数列の計算がゴール

## 前提環境

macOS 10.14で動作を確認 / tested on macOS 10.14

- node v10.x
- wabt ... The WebAssembly Binary Toolkit: [WebAssembly/wabt](https://github.com/WebAssembly/wabt)
  - ビルドにはCMakeが必要 / use CMake for build
- wasmtime ... Standalone JIT-style runtime for WebAssembly, using Cranelift: [CraneStation/wasmtime](https://github.com/CraneStation/wasmtime)
  - ビルドにはrust & cargoが必要 / use rust & cargo for build

## 使い方

### WASMコンパイラー

- jsファイルを用意（※仕様には制限あり）
  - 仮に source.js とする
- テキスト表現ファイル(.watファイル)にコンパイル
  - $ node mininode_wasm_08.js source.js
  - generated.wat が生成される
- WASM(.wasm)に変換
  - $ wat2wasm generated.wat
  - generated.wasm が生成される
- WASMを実行
  - $ node runwasm_bultin.js generated.wat

### WASI コンパイラー

- jsファイルを用意（※仕様には制限あり）
  - 仮に source.js とする
- テキスト表現ファイル(.watファイル)にコンパイル
  - $ node mininode_wasm_wasi.js source.js
  - generated.wat が生成される
- WASIを実行
  - $ wasmtime generated.wat

## 関連記事

- [Node.jsでつくるNode.js-WASMコンパイラ - もくじ](https://qiita.com/massie_g/items/c663095759a80c53c126)

## License / ライセンス

* This sample is under the MIT license
* このレポジトリはMITランセンスで提供されます


