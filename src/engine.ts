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

function render(filePath: string, srcCode: string, data: {}, views: string) {
    if (templates.get(filePath) && process.env.NODE_ENV?.search(/production/i) !== -1) {
        const template = templates.get(filePath);
        return template && template("", data);
    }

    const lexer = new Lexer(srcCode, filePath, views);
    let tokens = lexer.tokens

    const parser = new Parser(tokens, true);
    let ast = parser.ast

    const gen = new Generator(ast, data, filePath);
    let output = optimizeOutput(gen.output);

    if (lexer.error.length || parser.errors.length || gen.errors.length) {
        throw new Error(lexer.error.join("\n") + parser.errors.join("\n") + gen.errors.join("\n"));
    }

    templates.set(filePath, new Function("template", "data", output))

    const template = templates.get(filePath);
    return template && template("", data);
}

// only add properties that we'll need in this case
interface BasicAppProperties {
    set: (key: string, val: unknown) => {},
    locals: { settings: Record<string, string | {} | (() => any)> }
}

export function engine(app: BasicAppProperties) {

    return (filePath: string, data: {}, callback: (arg: any, arg2?: any) => string) => {

        var views = "views";
        if (app.locals && app.locals.settings) {
            if (!app.locals.settings.views && app.locals.settings.views) {
                app.set('views', 'views');
            }
            if (typeof app.locals.settings.views === "string") {
                views = app.locals.settings.views || "";
            }
        }
        fs.readFile(filePath, { encoding: "utf8" }, function (err, content) {
            if (err)
                return callback(err);
            return callback(null, render(filePath, content, data, views));
        });

    }
}


export function compiler(srcCode: string, data: {}, filePath: string, views: string = "") {

    const lexer = new Lexer(srcCode, filePath, views)
    let tokens = lexer.tokens;

    const parser = new Parser(tokens, true)
    let ast = parser.ast;

    const gen = new Generator(ast, data, filePath);
    let output = gen.output;

    let template = new Function("template", "data", output)
    return template("", data)
}
