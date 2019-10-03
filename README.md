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

- node v10.x
- wasmtime

## 使い方

## License / ライセンス

* This sample is under the MIT license
* このレポジトリはMITランセンスで提供されます


