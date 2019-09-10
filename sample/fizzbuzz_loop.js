let i = 1;
while (i <= 100) {
  if (i % (3*5) === 0) {
    puts('FizzBuzz');
    //putn(15151);
  }
  else if (i % 3 === 0) {
    puts('Fizz');
    //putn(333);
  }
  else if (i % 5 === 0) {
    puts('Buzz');
    //putn(555);
  }
  else {
    putn(i);
  }

  i = i + 1;
}

0;

