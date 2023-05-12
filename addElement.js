/**
 * @Title: Add New Elements
 */

// Use push to insert at the end
const arrP1 = [1, 2, 3];
const arrP2 = [8, 9];
arrP1[arrP1.length] = 4
arrP1.push(5);
arrP1.push(6, 7);
// arrP1.push(...arrP2);
Array.prototype.push.apply(arrP1, arrP2);

// console.log(arrP1);