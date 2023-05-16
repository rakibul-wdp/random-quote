const { argv } = require("yargs");
const path = require("path");
const Todo = require("./Todo");
const { saveFile, readFile } = require("./utils");
const { ADD, UPDATE, NEXT, DONE, FIND, LIST } = require("./commands");