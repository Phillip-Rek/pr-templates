import { Lexer } from "./lexer"
import { Parser } from "./parser"
import { Generator } from "./generator"


const templates: Map<string, Function> = new Map()

function fakeRender(filePath: string, srcCode: string, data: {}) {

    console.log(filePath);

    if (templates.get(filePath)) {
        //@ts-ignore
        return templates.get(filePath)("", data)
    }

    const lexer = new Lexer(srcCode, filePath, "");
    let tokens = lexer.tokens

    const parser = new Parser(tokens, true);
    let ast = parser.ast

    const gen = new Generator(ast, data, filePath)
    let output = gen.output

    output = output.replace(/template[ ]*\+\=[ ]*`[\n]+`/g, "").replace(/template[ ]*\+\=[ ]*`[ ]+`/g, `template += " ";\n`).replace(/[\n]+/g, "\n");
    // console.log(output);

    if (lexer.error.length || parser.errors.length || gen.errors.length) {

        throw new Error(lexer.error.join("\n") + parser.errors.join("\n") + gen.errors.join("\n"));

    }

    templates.set(filePath, new Function("template", "data", output))
    //@ts-ignore
    return templates.get(filePath)("", data)
}



const src = `
{% include("./index.html") %}

`
// const expectedOutput = `0134`

const result = fakeRender(
    "index.html",
    src,
    {
        url: "/"
    },
)

console.log(result)

console.log("TEST FILE")