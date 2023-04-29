/**
 * @Title: Traverse Array Elements
 */

const arr = [38, 92, 28, 69, 29, 25, 73, 88, 99];
const m = arr[2]
const n = arr[3]
const x = 1, y = 0;
// console.log(m, n, arr[x], arr[y], arr[x] + arr[y], arr[x + y + 1]);

/**
 * 1 2 3 4 5
 * 0 1 2 3 4
 *
 * "A" "B" "C" "C"
 *  0   1   2   3
 *
 * 1 B 3 5 F O true
 * 0 1 2 3 4 5 6
 */

// Simple Traverse
for (let i = 0; i < arr.length; i++) {
  // console.log(arr[i]);
}

// Array Sum & Avg
/**
 * sum = 0
 * sum = 0 + 1 => 1
 * sum = 1 + 2 => 3
 * sum = 3 + 3 => 6
 * sum = 6 + 4 => 10
 */

let sum = 0;
for (let i = 0; i < arr.length; i++) {
  sum += (arr[i]);
}
// console.log(sum);
// console.log(sum / arr.length);

// Find Large Number
let largestNumber = arr[0];
for (let i = 0; i < arr.length; i++) {
  if (arr[i] > largestNumber) {
    largestNumber = arr[i];
  }
}
console.log(largestNumber);

// Find Small Number
let smallestNumber = arr[0];
for (let i = 0; i < arr.length; i++) {
  if (arr[i] < smallestNumber) {
    smallestNumber = arr[i];
  }
}
console.log(smallestNumber);