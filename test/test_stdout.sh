#!/bin/sh
#
# test_stdout.sh
#
# usage:
#  sh test_stdout.sh translatername interpname filename 
#

translater=../$1
interpreter=../$2
src=$3
jsfile=../sample/$src

wat_file=tmp/$src.wat
wasm_file=tmp/$src.wasm
#wasm_exec=../node_run_wasm.js
wasm_exec=../run_wasm_builtin.js
wasm_exit=0
wasm_stdout=tmp/$src.wasm.stdout.txt

interp_wat_file=tmp/$src.interp.wat
interp_wasm_file=tmp/$src.interp.wasm
interp_wasm_exit=0
interp_wasm_stdout=tmp/$src.interp_wasm.stdout.txt

direct_file=tmp/node_direct_$src
direct_exit=0
helper_file=builtin_helper.js
direct_stdout=tmp/$src.direct.stdout.txt

exitcode_file=tmp/exitcode_$src.txt
echo "" > $exitcode_file

diff_direct_wasm=tmp/$src.diff_wasm.txt
diff_direct_interp_wasm=tmp/$src.diff_interp_wasm.txt

# --- for wat to wasm  --
wat_to_wasm=wat2wasm
if [ $WAT2WASM_FOR_TEST ]
then
  wat_to_wasm=$WAT2WASM_FOR_TEST
fi



# -- translate js to wat with node.js ---
TranslateToWat() {
  echo "--- translate src=$jsfile wat=$wat_file translater=$translater ---"
  node $translater $jsfile
  if [ "$?" -eq "0" ]
  then
    echo "translate SUCCERSS"
    mv generated.wat $wat_file
  else
    echo "ERROR! ... translate FAILED !"
    exit 1
  fi
}

WatToWasm() {
  echo "--- wat $wat_file to wasm $wasm_file --"
  $wat_to_wasm $wat_file -o $wasm_file
  if [ "$?" -eq "0" ]
  then
    echo "wat2wasm SUCCERSS"
  else
    echo "ERROR! ... wat2wasm FAILED !"
    exit 1
  fi
}

ExecWasm() {
  echo "--- exec $wasm_file from node"
  node $wasm_exec $wasm_file > $wasm_stdout
  wasm_exit=$?
  echo "wasm exit code=$wasm_exit"
}

# -- translate js to wat with mininode interpreter ---
InterpTranslateToWat() {
  echo "--- interp-translate src=$jsfile wat=$interp_wat_file translater=$translater interp=$interpreter ---"
  node $interpreter $translater $jsfile
  if [ "$?" -eq "0" ]
  then
    echo "interp-translate SUCCERSS"
    mv generated.wat $interp_wat_file
  else
    echo "ERROR! ... interp-translate FAILED !"
    exit 1
  fi
}

InterpWatToWasm() {
  echo "--- interp-wat $interp_wat_file to interp-wasm $interp_wasm_file --"
  $wat_to_wasm $interp_wat_file -o $interp_wasm_file
  if [ "$?" -eq "0" ]
  then
    echo "interp-wat2wasm SUCCERSS"
  else
    echo "ERROR! ... interp-wat2wasm FAILED !"
    exit 1
  fi
}

InterpExecWasm() {
  echo "--- interp-exec $interp_wasm_file from node"
  #cp $interp_wasm_file generated.wasm
  node $wasm_exec $interp_wasm_file > $interp_wasm_stdout
  interp_wasm_exit=$?
  echo "interp-wasm exit code=$interp_wasm_exit"
}

PreprocessBuiltinForDirect() {
  echo "-- preprocess for builtin func:  src=$jsfile tmp=$direct_file --"
  cat $helper_file > $direct_file # putn(), puts()
  cat $jsfile >>  $direct_file
}

NodeDirect() {
  echo "-- node $src --"
  node $direct_file > $direct_stdout
  direct_exit=$?
  echo "direct exit code=$direct_exit"
}

CompareExitCode() {
  if [ "$direct_exit" -eq "$wasm_exit" ]
  then
    echo "OK ... node <-> wasm exit code match: $direct_exit == $wasm_exit"
  else
    echo "ERROR! ... node <-> wasm exit code NOT MATCH : $direct_exit != $wasm_exit"
    echo "ERROR! ... node <-> wasm exit code NOT MATCH : $direct_exit != $wasm_exit" > $exitcode_file
    exit 1
  fi

  if [ "$direct_exit" -eq "$interp_wasm_exit" ]
  then
    echo "OK ... node <-> interp-wasm exit code match: $direct_exit == $interp_wasm_exit"
  else
    echo "ERROR! ... node <-> interp-wasm exit code NOT MATCH : $direct_exit != $interp_wasm_exit"
    echo "ERROR! ... node <-> interp-wasm exit code NOT MATCH : $direct_exit != $interp_wasm_exit" > $exitcode_file
    exit 1
  fi
}

DiffStdout() {
  diff --strip-trailing-cr $direct_stdout $wasm_stdout > $diff_direct_wasm
  diff --strip-trailing-cr $direct_stdout $interp_wasm_stdout > $diff_direct_interp_wasm
}

CheckStdout() {
  if [ -s $diff_direct_wasm ]
  then
    echo "ERROR! ... node <-> wasm stdout are different"
    cat $diff_direct_wasm
    exit 1
  else
    echo "OK ... node <-> wasm stdout are same"
  fi

  if [ -s $diff_direct_interp_wasm ]
  then
    echo "ERROR! ... node <-> inerp-wasm stdout are different"
    cat $diff_bin
    exit 1
  else
    echo "OK ... node <-> inerp-wasm stdout are same"
  fi
}

CleanUp() {
  #rm generated.wasm
  rm $direct_file
  rm $wat_file
  rm $wasm_file
  rm $interp_wat_file
  rm $interp_wasm_file
  rm $exitcode_file

  rm $direct_stdout
  rm $wasm_stdout
  rm $interp_wasm_stdout
  rm $diff_direct_wasm
  rm $diff_direct_interp_wasm

  echo ""
}

TranslateToWat
WatToWasm
ExecWasm

InterpTranslateToWat
InterpWatToWasm
InterpExecWasm

PreprocessBuiltinForDirect
NodeDirect

DiffStdout
CheckStdout

CleanUp

exit 0


