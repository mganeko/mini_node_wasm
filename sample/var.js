// --- putn() test ---
putn(1); // 1

// --- declare variable ---
let a = 1 + 2 + 3;
putn(a); // 6

// --- assigne variable, refer variable ---
let b;
b = a + 1;
b = b + 2;
putn(b); // 9
putn(a + b * 2); // 24

b; // expect 9
