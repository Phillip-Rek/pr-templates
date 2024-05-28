"use strict";
var express = require("express");
var app = express();
// const engine = require("../index");

// import { engine } from "../index";
const { engine } = require("../index");

app.engine('html', engine(app));
app.set('view engine', 'html');
app.set('views', 'views');

// app.use((req, res) => {
//     console.log(req.body)
// })

// console.log(app.locals.settings.views)

var domainName = "http://localhost:3000";

app.get("/", function (req, res) {
    res.render("home", { message: "", domainName });
});

app.get("/main", function (req, res) {
    res.render("test", {});
});

app.listen(3000, () => { });
