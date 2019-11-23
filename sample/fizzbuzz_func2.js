
function fizzbuzz(n) {
  let r = n;
  if (n % (3 * 5) === 0) {
    puts('FizzBuzz');
    r = 15;
  }
  else if (n % 3 === 0) {
    puts('Fizz');
    r = 3;
  }
  else if (n % 5 === 0) {
    puts('Buzz');
    r = 5;
  }
  else {
    putn(n);
  }

  return r;
}

let i = 1;
let ret;
while (i <= 100) {
  ret = fizzbuzz(i)
  i = i + 1;
}

0;
