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

# --- report --
Report

# --- exit ----
exit $err_count

