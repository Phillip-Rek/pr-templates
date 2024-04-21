"use strict";
var express = require("express");
var app = express();
var engine = require("../index");

app.engine('html', engine);
app.set('view engine', 'html');
app.set('views', 'views');

app.use((req, res) => {
    console.log(req.body)
})

var domainName = "http://localhost:3000";

app.get("/", function (req, res) {
    res.render("main", { message: "", domainName });
});

app.get("/main", function (req, res) {
    res.render("test", {});
});

app.listen(3000, () => { });
