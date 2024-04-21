import { Lexer } from "./lexer"
import { Parser } from "./parser"
import { Generator } from "./generator"
import * as fs from "fs"


const optimizeOutput = (output: string) => {
    return output.replace(/template[ ]*\+\=[ ]*`[\n]+`/g, "")
        .replace(/template[ ]*\+\=[ ]*`[ ]+`/g, `template += " ";\n`)
        .replace(/[\n]+/g, "\n");
}

const templates: Map<string, Function> = new Map()

function render(filePath: string, srcCode: string, data: {}) {
    if (templates.get(filePath) && process.env.NODE_ENV?.search(/production/i) !== -1) {
        //@ts-ignore
        return templates.get(filePath)("", data)
    }

    const lexer = new Lexer(srcCode)
    let tokens = lexer.tokens

    const parser = new Parser(tokens, true);
    let ast = parser.ast

    const gen = new Generator(ast, data, filePath);
    let output = optimizeOutput(gen.output);

    if (lexer.error.length || parser.errors.length || gen.errors.length) {
        // console.error(lexer.error)
        // console.error(parser.errors)
        // console.error(gen.errors)
        throw new Error(lexer.error.join("\n") + parser.errors.join("\n") + gen.errors.join("\n"));
    }

    templates.set(filePath, new Function("template", "data", output))
    //@ts-ignore
    return templates.get(filePath)("", data)
}

export function engine(
    filePath: string,
    data: {},
    callback: (arg: any, arg2?: any) => string
) {
    fs.readFile(filePath, { encoding: "utf8" }, (err, content) => {
        if (err) return callback(err);
        let res = render(filePath, content, data);
        return callback(null, res);
    });
}


export function compiler(srcCode: string, data: {}, filePath: string) {
    const lexer = new Lexer(srcCode)
    let tokens = lexer.tokens

    const parser = new Parser(tokens, true)
    let ast = parser.ast

    const gen = new Generator(ast, data, filePath);
    let output = gen.output

    let template = new Function("template", "data", output)
    return template("", data)
}