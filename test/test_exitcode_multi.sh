#!/bin/sh
#
# test_multi.sh
#
# usage:
#  sh test_exitcode_multi.sh

# -- test target --
compiler=mininode_wasm_02.js
interpreter=mininode_14.js


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

# ---- exec test case -----
# step_01
TestSingleExitCode one.js
TestSingleExitCode two.js
TestSingleExitCode eight.js

# step_02
TestSingleExitCode add.js
TestSingleExitCode add_many.js
TestSingleExitCode binoperator.js

# --- report --
Report

# --- exit ----
exit $err_count

