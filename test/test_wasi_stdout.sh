#!/bin/sh
#
# test_wasi_stdout.sh
#
# usage:
#  sh test_wasi_stdout.sh translatername interpname filename 
#

translater=../$1
interpreter=../$2
src=$3
jsfile=../sample/$src

wat_file=tmp/$src.wasi.wat
#wasm_file=tmp/$src.wasm
#wasm_exec=../node_run_wasm.js
#wasm_exec=../run_wasm_builtin.js
wasi_exit=0
wasi_stdout=tmp/$src.wasm.stdout.txt

interp_wat_file=tmp/$src.interp.wat
#interp_wasm_file=tmp/$src.interp.wasm
interp_wasi_exit=0
interp_wasi_stdout=tmp/$src.interp_wasm.stdout.txt

direct_file=tmp/node_direct_$src
direct_exit=0
helper_file=builtin_helper.js
direct_stdout=tmp/$src.direct.stdout.txt

exitcode_file=tmp/exitcode_$src.txt
echo "" > $exitcode_file

diff_direct_wasi=tmp/$src.diff_wasi.txt
diff_direct_interp_wasi=tmp/$src.diff_interp_wasi.txt

# --- for wasi runtime --
wasi_runtime=wasmtime
if [ $WASI_RUNTIME_FOR_TEST ]
then
  wasi_runtime=$WASI_RUNTIME_FOR_TEST
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

#WatToWasm() {
#  echo "--- wat $wat_file to wasm $wasm_file --"
#  $wat_to_wasm $wat_file -o $wasm_file
#  if [ "$?" -eq "0" ]
#  then
#    echo "wat2wasm SUCCERSS"
#  else
#    echo "ERROR! ... wat2wasm FAILED !"
#    exit 1
#  fi
#}

ExecWasi() {
  echo "--- exec $wat_file from $wasi_runtime"
  $wasi_runtime $wat_file > $wasi_stdout
  wasi_exit=$?
  echo "wasi exit code=$wasi_exit"
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

#InterpWatToWasm() {
#  echo "--- interp-wat $interp_wat_file to interp-wasm $interp_wasm_file --"
#  $wat_to_wasm $interp_wat_file -o $interp_wasm_file
#  if [ "$?" -eq "0" ]
#  then
#    echo "interp-wat2wasm SUCCERSS"
#  else
#    echo "ERROR! ... interp-wat2wasm FAILED !"
#    exit 1
#  fi
#}

InterpExecWasi() {
  echo "--- interp-exec $interp_wasi_file from $wasi_runtime"
  #cp $interp_wasm_file generated.wasm
  $wasi_runtime $interp_wat_file > $interp_wasi_stdout
  interp_wasi_exit=$?
  echo "interp-wasi exit code=$interp_wasi_exit"
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

CheckExitCode() {
  if [ "$wasi_exit" -eq 0 ]
  then
    echo "OK ... wasi exit code == 0"
  else
    echo "ERROR! ... wasi_exit exit code NOT 0 : $wasi_exit"
    echo "ERROR! ... wasi_exit exit code NOT 0 : $wasi_exit" > $exitcode_file
    exit 1
  fi

  if [ "$interp_wasi_exit" -eq 0 ]
  then
    echo "OK ... interp-wasi exit code == 0"
  else
    echo "ERROR! ... interp-wasi exit code NOT 0 : $interp_wasi_exit"
    echo "ERROR! ... interp-wasi exit code NOT 0 : $interp_wasi_exit" > $exitcode_file
    exit 1
  fi
}

DiffStdout() {
  diff --strip-trailing-cr $direct_stdout $wasi_stdout > $diff_direct_wasi
  diff --strip-trailing-cr $direct_stdout $interp_wasi_stdout > $diff_direct_interp_wasi
}

CheckStdout() {
  if [ -s $diff_direct_wasi ]
  then
    echo "ERROR! ... node <-> wasi stdout are different"
    cat $diff_direct_wasi
    exit 1
  else
    echo "OK ... node <-> wasi stdout are same"
  fi

  if [ -s $diff_direct_interp_wasi ]
  then
    echo "ERROR! ... node <-> inerp-wasi stdout are different"
    cat $diff_bin
    exit 1
  else
    echo "OK ... node <-> inerp-wasi stdout are same"
  fi
}


PrepareTemplate() {
  cp ../wasi_builtin_template.watx .
}

CleanUp() {
  #rm generated.wasm
  rm $direct_file
  rm $wat_file
  #rm $wasm_file
  rm $interp_wat_file
  #rm $interp_wasm_file
  rm $exitcode_file

  rm $direct_stdout
  rm $wasi_stdout
  rm $interp_wasi_stdout
  rm $diff_direct_wasi
  rm $diff_direct_interp_wasi

  rm wasi_builtin_template.watx

  echo ""
}

PrepareTemplate

TranslateToWat
#WatToWasm
ExecWasi

InterpTranslateToWat
#InterpWatToWasm
InterpExecWasi

PreprocessBuiltinForDirect
NodeDirect

CheckExitCode

DiffStdout
CheckStdout

CleanUp

exit 0


