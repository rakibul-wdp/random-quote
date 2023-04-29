/**
 * @Title: Initialize Array - Constructor vs Factory
 */

// Constructor Pattern
const a1 = new Array(); // []
console.log(a1, a1.length);

const a2 = new Array(5);
console.log(a2, a2.length);

const a3 = new Array(1, 2, 3, 4, 5); // [1, 2, 3, 4, 5]
console.log(a3, a3.length);

// Factory Pattern