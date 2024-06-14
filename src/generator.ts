import { writeFileSync } from "fs";
import { HTMLElement, Statement, TextNode } from "./parser";

export class Generator {
    errors: string[] = []
    output = "";
    globalVariables = "";

    insideBlockCode = false;
    nestingLevel = 0;

    constructor(private ast: HTMLElement, private data: {}, private filePath: string) {

        this.initGlobals()

        if (ast.name === "Program") {
            this.init()
        }
        else {
            this.raise("[Generator] AST is corrupted or invalid")
        }
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
        if (node.name !== "HTMLElement") this.nestingLevel++;
        //@ts-ignore
        for (const child of node.children) {
            //@ts-ignore
            if (this[`gen${child.name}`]) {
                //@ts-ignore
                this[`gen${child.name}`](child)
            }
        }

        this.insideBlockCode = false;
        if (node.name !== "HTMLElement") this.nestingLevel--;
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

            let testCode = this.output + code

            for (let i = 0; i < this.nestingLevel; i++) {
                testCode += "}";
            }

            testCode += "\nreturn template;"
            // check for syntax errors
            new Function("template", "data", testCode)("", this.data)


            this.output += "\n" + predicate + "{\n"

            this.genChildren(node)

            this.output += "\n}\n"
        } catch (error) {
            this.raise(error + `, line: ${node.line}, file: ${this.filePath}, src: {% ${predicate} %}`);
            // this.raise(`[ ${this.filePath} ] You have syntax error at line: ${node.line}, file: ${this.filePath}` +
            //     `, src: {% ${predicate} %}\n\nTip: Make sure that you write valid JavaScript code\n\n`)
        }

    }

    private genIfStatement = (node: Statement) => {
        let predicate = node.predicate.slice(2, -2).trim()

        const code = predicate + "{}";

        try {

            // console.log(this.output + code);

            let testCode = this.output + code

            for (let i = 0; i < this.nestingLevel; i++) {
                testCode += "}";
            }

            testCode += "\nreturn template;"

            // check for syntax errors
            new Function("template", "data", testCode)("", this.data)

        } catch (error) {
            this.raise(error + `, line: ${node.line}, file: ${this.filePath}`);
            // this.raise(`[ ${this.filePath} ] You have syntax error at line: ${node.line}, file: ${this.filePath}` +
            //     `, src: {% ${predicate} %}\n\nTip: Make sure that you write valid JavaScript code\n\n`)
        }

        this.output += "\n" + predicate + "{\n"
        this.genChildren(node)

        this.output += "\n}\n"
    }

    private genSelfClose = (node: HTMLElement) => {
        this.genHTMLElement(node)
    }

    private raise(msg: string) {
        this.errors.push(msg);
    }
}

