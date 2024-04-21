"use strict";
var mysql = require("mysql");
var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "phillipr_blog"
});
conn.connect(function (err) {
    if (err)
        return console.log(err);
    console.log("database connected");
});
module.exports = conn;
