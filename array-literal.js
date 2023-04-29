// Array Literal
const arr = [];
arr[0] = 1;
arr[1] = 2;
arr[2] = 3;
arr[99] = 100;
console.log(arr.length);
console.log(arr);

// Length = LastIndex + 1
// LastIndex = Length - 1

const names = [
  "Abul",
  "Babul",
  "Cabul",
  "Dabul",
  "Ebul",
  "Jabul"
]
// names[5] = "Fabul";
names[names.length] = "Fabul";

console.log(names.length);
console.log(names);