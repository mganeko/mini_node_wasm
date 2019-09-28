#!/bin/sh
#
# test_multi.sh
#
# usage:
#  sh test_multi.sh

# -- test target --
#compiler=mininode_wasm_05.js
#compiler=mininode_wasm_06.js
#compiler=mininode_wasm_07.js
compiler=mininode_wasm_08.js

interpreter=mininode_15.js

compiler_wasi=mininode_wasm_wasi.js


# --- summary ---
case_count=0
ok_count=0
err_count=0
last_case_exit=0

summary_file=tmp/summary.txt
echo "" > $summary_file

# --- test ---
TestSingleExitCode() {
  # --- exec 1 test case --
  testfile=$1

  # usage:
  #  sh test_exitcode.sh compilername interpname filename 
  #
  sh test_exitcode.sh $compiler $interpreter $testfile
  last_case_exit=$?

  # --- check test result--
  case_count=$(($case_count+1))
  if [ "$last_case_exit" -eq 0 ]
  then
    # -- test OK --
    ok_count=$(($ok_count+1))
    echo "$testfile ... OK" >> $summary_file 
  else
    # -- test NG --
    err_count=$(($err_count+1))
    echo "$testfile ... NG" >> $summary_file 
  fi
}

TestSingleStdout() {
  # --- exec 1 test case --
  testfile=$1

  # usage:
  #  sh test_stdout.sh compilername interpname filename 
  #
  sh test_stdout.sh $compiler $interpreter $testfile
  last_case_exit=$?

  # --- check test result--
  case_count=$(($case_count+1))
  if [ "$last_case_exit" -eq 0 ]
  then
    # -- test OK --
    ok_count=$(($ok_count+1))
    echo "$testfile ... OK" >> $summary_file 
  else
    # -- test NG --
    err_count=$(($err_count+1))
    echo "$testfile ... NG" >> $summary_file 
  fi
}

TestSingleWasiStdout() {
  # --- exec 1 test case for wasi --
  testfile=$1

  # usage:
  #  sh test_wasi_stdout.sh compilername interpname filename 
  #
  sh test_wasi_stdout.sh $compiler_wasi $interpreter $testfile
  last_case_exit=$?

  # --- check test result--
  case_count=$(($case_count+1))
  if [ "$last_case_exit" -eq 0 ]
  then
    # -- test OK --
    ok_count=$(($ok_count+1))
    echo "$testfile ... OK" >> $summary_file 
  else
    # -- test NG --
    err_count=$(($err_count+1))
    echo "$testfile ... NG" >> $summary_file 
  fi
}

Report() {
  echo "===== test finish ======"
  echo " total=$case_count"
  echo " OK=$ok_count"
  echo " NG=$err_count"
  echo "======================"

  echo "===== test finish ======" >> $summary_file
  echo " total=$case_count" >> $summary_file
  echo " OK=$ok_count" >> $summary_file
  echo " NG=$err_count" >> $summary_file
}

#--- quick test ---
#TestSingleStdout fib_func.js
#TestSingleStdout fib_func2.js
#Report
#exit $err_count

# ---- exec test case -----
# step_01
TestSingleExitCode one.js
TestSingleExitCode two.js
TestSingleExitCode eight.js

# step_02
TestSingleExitCode add.js
TestSingleExitCode add_many.js
TestSingleExitCode binoperator.js

# step_03
TestSingleStdout putn.js
TestSingleStdout multi_lines.js
TestSingleStdout var0.js
TestSingleStdout var.js

# step_04
TestSingleStdout neq.js
TestSingleStdout comp.js

# step_05
TestSingleStdout if1.js
TestSingleStdout if0.js
TestSingleStdout if.js
TestSingleStdout while.js

# step_06
TestSingleStdout putn_puts.js
TestSingleStdout fizzbuzz_loop.js

# step_07
TestSingleStdout func_add.js
TestSingleStdout fizzbuzz_func.js
TestSingleStdout fib_func.js

#--- quit here ---
#Report
#exit $err_count

# step_08
TestSingleStdout fizzbuzz_func2.js
TestSingleStdout fizzbuzz_func3.js
TestSingleStdout fib_func2.js
TestSingleStdout minus_value.js
TestSingleStdout putn_minus_puts.js

# ---- exec test case for wasi -----
echo "===== test for wasi ======"
echo "===== test for wasi ======" >> $summary_file

# step_01
TestSingleWasiStdout eight.js

# step_02
TestSingleWasiStdout add.js
TestSingleWasiStdout add_many.js
TestSingleWasiStdout binoperator.js

# step_03
TestSingleWasiStdout putn.js
TestSingleWasiStdout multi_lines.js
TestSingleWasiStdout var0.js
TestSingleWasiStdout var.js

# step_04
TestSingleWasiStdout neq.js
TestSingleWasiStdout comp.js

# step_05
TestSingleWasiStdout if1.js
TestSingleWasiStdout if0.js
TestSingleWasiStdout if.js
TestSingleWasiStdout while.js

# step_06
TestSingleWasiStdout putn_puts.js
TestSingleWasiStdout fizzbuzz_loop.js

# step_07
TestSingleWasiStdout func_add.js
TestSingleWasiStdout fizzbuzz_func.js
TestSingleWasiStdout fib_func.js

# step_08
TestSingleWasiStdout fizzbuzz_func2.js
TestSingleWasiStdout fizzbuzz_func3.js
TestSingleWasiStdout fib_func2.js
TestSingleWasiStdout minus_value.js
TestSingleWasiStdout putn_minus_puts.js



# --- report --
Report

# --- exit ----
exit $err_count

