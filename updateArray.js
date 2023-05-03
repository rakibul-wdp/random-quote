/**
 * @Title: Update Array Elements and Fill Array
 */

// Array Fill Manual Way
const arr1 = new Array(10);
for (let i = 0; i < arr1.length; i++) {
  arr1[i] = false;
}
// console.log(arr1);

// Array Fill
const arr2 = new Array(10);
arr2.fill(0);
// console.log(arr2);

const names = ["Abul", "Babul", "Cabul"];
names[0] = "Cabul";
names[1] = "Chandu";
names[2] = "Abul";
console.log(names);

// Fill Array and Update

// Array is mutable