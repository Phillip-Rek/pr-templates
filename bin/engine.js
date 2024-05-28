"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.engine = void 0;
var lexer_1 = require("./lexer");
var parser_1 = require("./parser");
var generator_1 = require("./generator");
var fs = __importStar(require("fs"));
var optimizeOutput = function (output) {
    return output.replace(/template[ ]*\+\=[ ]*`[\n]+`/g, "")
        .replace(/template[ ]*\+\=[ ]*`[ ]+`/g, "template += \" \";\n")
        .replace(/[\n]+/g, "\n");
};
var templates = new Map();
function render(filePath, srcCode, data, views) {
    var _a;
    if (templates.get(filePath) && ((_a = process.env.NODE_ENV) === null || _a === void 0 ? void 0 : _a.search(/production/i)) !== -1) {
        //@ts-ignore
        return templates.get(filePath)("", data);
    }
    // const viewsDirectory = filePath.substring
    var lexer = new lexer_1.Lexer(srcCode, filePath, views);
    var tokens = lexer.tokens;
    var parser = new parser_1.Parser(tokens, true);
    var ast = parser.ast;
    var gen = new generator_1.Generator(ast, data, filePath);
    var output = optimizeOutput(gen.output);
    if (lexer.error.length || parser.errors.length || gen.errors.length) {
        // console.error(lexer.error)
        // console.error(parser.errors)
        // console.error(gen.errors)
        throw new Error(lexer.error.join("\n") + parser.errors.join("\n") + gen.errors.join("\n"));
    }
    templates.set(filePath, new Function("template", "data", output));
    //@ts-ignore
    return templates.get(filePath)("", data);
}
// export let viewsDirectory: string = "";
function engine(app) {
    // if (!viewsDirectory.length) {
    //     // viewsDirectory = filePath.substring
    //     console.log(__dirname)
    // }
    // console.log(__dirname)
    // console.log(filePath)
    return function (filePath, data, callback) {
        //@ts-ignore
        var views = "./" + app.locals.settings.views || "";
        fs.readFile(filePath, { encoding: "utf8" }, function (err, content) {
            if (err)
                return callback(err);
            var res = render(filePath, content, data, views);
            return callback(null, res);
        });
    };
}
exports.engine = engine;
// export function compiler(srcCode: string, data: {}, filePath: string) {
//     const lexer = new Lexer(srcCode, filePath)
//     let tokens = lexer.tokens
//     const parser = new Parser(tokens, true)
//     let ast = parser.ast
//     const gen = new Generator(ast, data, filePath);
//     let output = gen.output
//     let template = new Function("template", "data", output)
//     return template("", data)
// }
