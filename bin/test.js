"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lexer_1 = require("./lexer");
var parser_1 = require("./parser");
var generator_1 = require("./generator");
var templates = new Map();
function fakeRender(filePath, srcCode, data) {
    console.log(filePath);
    if (templates.get(filePath)) {
        //@ts-ignore
        return templates.get(filePath)("", data);
    }
    var lexer = new lexer_1.Lexer(srcCode, filePath, "");
    var tokens = lexer.tokens;
    var parser = new parser_1.Parser(tokens, true);
    var ast = parser.ast;
    var gen = new generator_1.Generator(ast, data, filePath);
    var output = gen.output;
    output = output.replace(/template[ ]*\+\=[ ]*`[\n]+`/g, "").replace(/template[ ]*\+\=[ ]*`[ ]+`/g, "template += \" \";\n").replace(/[\n]+/g, "\n");
    // console.log(output);
    if (lexer.error.length || parser.errors.length || gen.errors.length) {
        throw new Error(lexer.error.join("\n") + parser.errors.join("\n") + gen.errors.join("\n"));
    }
    templates.set(filePath, new Function("template", "data", output));
    //@ts-ignore
    return templates.get(filePath)("", data);
}
var src = "\n{% for(let user of users) %}\n    {{ user }}\n{% end_for %}\n\n";
// const expectedOutput = `0134`
var result = fakeRender("file.html", src, {
    url: "/",
});
console.log(result);
console.log("TEST FILE");
