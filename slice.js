/**
 * @Title: Slice Array into Multiple Array
 */

const arr = [1, 2, 3, 4, 5, 6];

// Slice
const sliced = arr.slice(1, 3);
console.log(sliced);

// Clone Array
const cloned = arr.slice();
console.log(arr === cloned);


// Array Like Objects to Array
function toArray() {
  return Array.prototype.slice.call(arguments);
}
const argArray = toArray(4, 2, 7, 9, "test");
console.log(argArray);
console.log(argArray.__proto__.constructor);