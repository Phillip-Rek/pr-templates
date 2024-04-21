import { Token } from "./lexer"
import * as fs from "fs"

export declare type HTMLElement = {
    name: string,
    tagName: string,
    attributes: Array<string>,
    children: Array<HTMLElement | TextNode | Statement>,
    line: number,
    col: number,
}

export declare type Statement =
    Partial<HTMLElement> & {
        predicate: string
    }

export declare type TextNode = {
    name: string,
    val: string,
    line: number,
    col: number,
}

export class Parser {
    private token: Token | null = null;

    ast = {
        name: "Program",
        tagName: "",
        attributes: [],
        children: [],
        line: -1,
        col: -1,
    }

    private openedTagsStack: Array<HTMLElement | Statement> = [this.ast]

    status: ("html" | "attr") = "html"

    errors: Array<string> = []

    private get currentElement(): (HTMLElement | Statement) {
        return this.openedTagsStack[this.openedTagsStack.length - 1]
    }

    constructor(private tokens: Array<Token>, private removeComment: boolean) {
        // console.log(this.tokens)
        for (let i = 0; i < this.tokens.length; i++) {
            this.token = tokens[i];
            //@ts-ignore
            if (this[`parse${this.token.type}`]) {
                //@ts-ignore
                this[`parse${this.token.type}`]()
            }
            else {
                this.raise("[Parser] Cannot parse token: " + this.token.type)
            }
        }
    }

    raise(msg: string) {
        this.errors.push(msg)
    }

    private parseOpenTagStart = (name: string) => {
        if (!this.token) return

        this.status = "attr"

        let element: HTMLElement = {
            name: name || "HTMLElement",
            tagName: this.token.val.slice(1),
            line: this.token.line,
            col: this.token.col,
            attributes: [],
            children: []
        }

        if (this.currentElement?.name === "SelfClose")
            this.openedTagsStack.pop()
        this.currentElement?.children?.push(element)
        this.openedTagsStack.push(element)
    }

    private parseOpenTagEnd = () => {
        this.status = "html"

        if (this.currentElement?.name === "SelfClose")
            this.openedTagsStack.pop()
    }

    private parseCloseTag = () => {
        if (!this.token) { return }

        if (this.currentElement.name === "SelfClose") {
            this.openedTagsStack.pop()
        }

        if (this.token.val === `</${this.currentElement.tagName}>`) {
            this.openedTagsStack.pop()
        }
        else {
            let msg = `[parseCloseTag] 
                Close tag, ${this.token.val} does not match an open tag,  
                ${this.currentElement.tagName}, 
                at line ${this.token.line}, 
                col ${this.token.col}`
            this.raise(msg)
        }
    }

    private parseSelfClose = () => {
        this.parseOpenTagStart("SelfClose")
    }

    private parseAttribute = () => {
        if (!this.token) return

        //there might exist text that looks like 
        //an attribute in the innerHTML
        if (this.status === "html") {
            this.currentElement?.children?.push({
                name: "Text",
                val: this.token.val,
                line: this.token.line,
                col: this.token.col
            })
        }
        else if (this.currentElement.attributes) {
            this.currentElement.attributes.push(this.token.val)
        }

    }

    private parseScript = () => {
        this.parseText()
    }

    private parseText = (name?: string) => {
        if (!this.token) return

        // dengerous code
        if (this.token.val === "\n" && this.status === "attr") {
            if (this.currentElement?.attributes) {
                this.currentElement.attributes[this.currentElement?.attributes.length - 1] += "\n"
            }
        }

        if (this.status === "attr") return;

        let astNode: TextNode = {
            name: name || "Text",
            val: this.token?.val,
            line: this.token?.line,
            col: this.token?.col
        }

        // this part is comented because it does not look proper
        // text cannot be found as children in selfCloseTags 
        // if (this.currentElement?.name === "SelfClose")
        //     this.openedTagsStack.pop()

        if (this.currentElement?.name === "SelfClose") return

        this.currentElement?.children?.push(astNode)
    }

    parseTemplateCall = () => {
        this.parseText("TemplateCall");
    }

    parseTemplate = () => {
        this.parseStatement("TemplateStatement")
    }

    parseForStatement = () => {
        this.parseStatement("ForStatement")
    }

    parseIfStatement = () => {
        this.parseStatement("IfStatement")
    }

    parseElseIfStatement = () => {
        this.parseEndIf();
        this.parseStatement("IfStatement")
    }

    parseElseStatement = () => {
        this.parseEndIf();
        this.parseStatement("IfStatement")
    }

    parseStatement = (name: string) => {
        if (!this.token) return

        let astNode: Statement = {
            name: name,
            predicate: this.token?.val,
            line: this.token?.line,
            col: this.token?.col,
            children: []
        }

        this.currentElement?.children?.push(astNode)

        this.openedTagsStack.push(astNode)
    }

    parseEndTemplate = () => {
        if (!this.token) return;

        if (this.currentElement.name === "SelfClose") {
            this.openedTagsStack.pop()
        }

        if (this.currentElement.name === "TemplateStatement") {
            this.openedTagsStack.pop()
        }
        else {
            let msg = `[parseEndFor] 
                Close tag, ${this.token.val} does not match an open tag,  
                ${this.currentElement.tagName}, 
                at line ${this.token.line}, 
                col ${this.token.col}`
            this.raise(msg)
        }
    }

    parseEndFor = () => {
        if (!this.token) return

        if (this.currentElement.name === "SelfClose") {
            this.openedTagsStack.pop()
        }

        if (this.currentElement.name === "ForStatement") {
            this.openedTagsStack.pop()
        }
        else {
            let msg = `[parseEndFor] 
                Close tag, ${this.token.val} does not match an open tag,  
                ${this.currentElement.tagName}, 
                at line ${this.token.line}, 
                col ${this.token.col}`
            this.raise(msg)
        }
    }

    parseEndIf = () => {
        if (!this.token) return

        if (this.currentElement.name === "SelfClose") {
            this.openedTagsStack.pop()
        }

        if (this.currentElement.name === "IfStatement" || this.currentElement.name === "ElseIfStatement") {
            this.openedTagsStack.pop()
        }
        else {
            let msg = `[parseEndIf] Unexpected token, ${this.token.val}, at line ${this.token.line}, ` +
                `col ${this.token.col}.\nThere is not preceding if statement block\n\n`
            this.raise(msg)
        }
    }

    parseDocType = () => {
        this.parseText()
    }

    parseDynamicData = () => {
        this.parseText("DynamicData")
    }

    parseComment = () => {
        if (this.removeComment) return;
        // this.parseText()
    }

}

