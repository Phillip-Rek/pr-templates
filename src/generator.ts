import { writeFileSync } from "fs";
import { HTMLElement, Statement, TextNode } from "./parser";
import * as acorn from "acorn";

export class Generator {
    errors: string[] = []
    output = "";
    globalVariables = "";

    insideBlockCode = false;

    constructor(private ast: HTMLElement, private data: {}, private filePath: string) {

        this.initGlobals()

        if (ast.name === "Program")
            this.init()

        else
            this.raise("[Generator] AST is corrupted or invalid")
    }

    //initialize global variables
    private initGlobals = () => {
        let globals = Object.entries(this.data)

        for (let i = 0; i < globals.length; i++) {
            const key = globals[i][0];
            const val = globals[i][1]
            this.globalVariables += `let ${key} = data.${key}\n`
        }

        this.output += this.globalVariables;
    }

    private init(node?: HTMLElement) {
        node ||= this.ast

        for (const child of node.children) {
            //@ts-ignore
            if (this[`gen${child.name}`]) {
                //@ts-ignore
                this[`gen${child.name}`](child)
            }
            else {
                throw new Error("Cannot generate " + child.name);

            }
        }

        this.output += "return template;\n"

    }

    private genChildren = (node: HTMLElement | Statement) => {
        if (node === undefined) return

        this.insideBlockCode = true;
        //@ts-ignore
        for (const child of node.children) {
            //@ts-ignore
            if (this[`gen${child.name}`]) {
                //@ts-ignore
                this[`gen${child.name}`](child)
            }
        }

        this.insideBlockCode = false;
    }

    private genHTMLElement = (element: HTMLElement) => {
        this.output += `template += \`<${element.tagName}\`\n`

        if (element.attributes.length !== 0)
            this.genAttributes(element)
        else this.output += `template += ">"\n`

        if (element.name === "SelfClose") return

        this.genChildren(element)

        this.output += `template += \`</${element.tagName}>\`\n`
    }

    private genAttributes = (element: HTMLElement) => {
        this.output += `template += \` ${element.attributes.join(" ")}>\`\n`
    }

    private genText = (node: TextNode) => {
        this.output += `template += \`${node.val}\`\n`
    }

    private genDynamicData = (node: TextNode) => {
        let data = node.val.slice(2, -2).trim()
        this.output += `template += ${data};\n`
    }

    private genTemplateCall = (node: TextNode) => {
        const call = node.val.slice(2, -2).replace(/call[]*\:/, "").trim();
        this.output += call + ";\n";
    }

    private genTemplateStatement = (node: Statement) => {
        let predicate = node.predicate.slice(2, -2).trim().replace("template", "function")

        this.output += "\n" + predicate + "{\n"
        this.genChildren(node)

        this.output += "\n}\n"
    }

    private genForStatement = (node: Statement) => {
        let predicate = node.predicate.slice(2, -2).trim()

        const code = predicate + "{}";

        let tmp = "let template;\n"

        try {
            acorn.parse(code, { ecmaVersion: "latest" });

            this.output += "\n" + predicate + "{\n"
            this.genChildren(node)

            this.output += "\n}\n"
        } catch (error) {
            this.errors.push(`[ ${this.filePath} ] You have syntax error at line: ${node.line}, file: ${this.filePath}` +
                `, src: {% ${predicate} %}\n\nTip: Make sure that you write valid JavaScript code\n\n`)
        }

    }

    private genIfStatement = (node: Statement) => {
        let predicate = node.predicate.slice(2, -2).trim()

        const code = predicate + "{}";

        try {

            if (code.search("else") !== -1) {
                acorn.parse("if(1===1){ hello(5)\n} " + code, { ecmaVersion: "latest" });
            }
            else {
                acorn.parse(code, { ecmaVersion: "latest" });
            }

            this.output += "\n" + predicate + "{\n"
            this.genChildren(node)

            this.output += "\n}\n"
        } catch (error) {

            console.log(error)

            this.errors.push(`[ ${this.filePath} ] You have syntax error at line: ${node.line}, file: ${this.filePath}` +
                `, src: {% ${predicate} %}\n\nTip: Make sure that you write valid JavaScript code\n\n`)
        }
    }

    private genSelfClose = (node: HTMLElement) => {
        this.genHTMLElement(node)
    }

    private raise(msg: string) {
        this.errors.push(msg)
    }
}

