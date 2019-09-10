function fib(x) {
  let r = 1;
  if (x <= 1) {
    r = x
  }
  else {
    r = fib(x - 1) + fib(x - 2);
  }

  return r;
}

let i = 0;
while (i < 10) {
  putn(fib(i));
  i = i + 1;
}

//0;