/**
 * @Title: Array of Anything
 */

const arr = [10, "Ten", true, getTen, { ten: 10 }, [10, 10]];
console.log(arr);

function getTen() {
  return 10;
}

// Array of Objects
const favChannels = [
  { name: "Stack Learner", url: "https://youtube.com/stacklearner" },
  { name: "JS Bangladesh", url: "https://youtube.com/jsbangladesh" },
  { name: "Traversy Media", url: "https://youtube.com/techguyweb" },
  { name: "Wes Bos", url: "https://youtube.com/wesbos" },
];