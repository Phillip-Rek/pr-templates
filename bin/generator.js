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
exports.Generator = void 0;
var acorn = __importStar(require("acorn"));
var Generator = /** @class */ (function () {
    function Generator(ast, data, filePath) {
        var _this = this;
        this.ast = ast;
        this.data = data;
        this.filePath = filePath;
        this.errors = [];
        this.output = "";
        this.globalVariables = "";
        this.insideBlockCode = false;
        //initialize global variables
        this.initGlobals = function () {
            var globals = Object.entries(_this.data);
            for (var i = 0; i < globals.length; i++) {
                var key = globals[i][0];
                var val = globals[i][1];
                _this.globalVariables += "let " + key + " = data." + key + "\n";
            }
            _this.output += _this.globalVariables;
        };
        this.genChildren = function (node) {
            if (node === undefined)
                return;
            _this.insideBlockCode = true;
            //@ts-ignore
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                //@ts-ignore
                if (_this["gen" + child.name]) {
                    //@ts-ignore
                    _this["gen" + child.name](child);
                }
            }
            _this.insideBlockCode = false;
        };
        this.genHTMLElement = function (element) {
            _this.output += "template += `<" + element.tagName + "`\n";
            if (element.attributes.length !== 0)
                _this.genAttributes(element);
            else
                _this.output += "template += \">\"\n";
            if (element.name === "SelfClose")
                return;
            _this.genChildren(element);
            _this.output += "template += `</" + element.tagName + ">`\n";
        };
        this.genAttributes = function (element) {
            _this.output += "template += ` " + element.attributes.join(" ") + ">`\n";
        };
        this.genText = function (node) {
            _this.output += "template += `" + node.val + "`\n";
        };
        this.genDynamicData = function (node) {
            var data = node.val.slice(2, -2).trim();
            _this.output += "template += " + data + ";\n";
        };
        this.genTemplateCall = function (node) {
            var call = node.val.slice(2, -2).replace(/call[]*\:/, "").trim();
            _this.output += call + ";\n";
        };
        this.genTemplateStatement = function (node) {
            var predicate = node.predicate.slice(2, -2).trim().replace("template", "function");
            _this.output += "\n" + predicate + "{\n";
            _this.genChildren(node);
            _this.output += "\n}\n";
        };
        this.genForStatement = function (node) {
            var predicate = node.predicate.slice(2, -2).trim();
            var code = predicate + "{}";
            var tmp = "let template;\n";
            try {
                acorn.parse(code, { ecmaVersion: "latest" });
                _this.output += "\n" + predicate + "{\n";
                _this.genChildren(node);
                _this.output += "\n}\n";
            }
            catch (error) {
                _this.errors.push("[ " + _this.filePath + " ] You have syntax error at line: " + node.line + ", file: " + _this.filePath +
                    (", src: {% " + predicate + " %}\n\nTip: Make sure that you write valid JavaScript code\n\n"));
            }
        };
        this.genIfStatement = function (node) {
            var predicate = node.predicate.slice(2, -2).trim();
            var code = predicate + "{}";
            try {
                if (code.search("else") !== -1) {
                    acorn.parse("if(1===1){ hello(5)\n} " + code, { ecmaVersion: "latest" });
                }
                else {
                    acorn.parse(code, { ecmaVersion: "latest" });
                }
                _this.output += "\n" + predicate + "{\n";
                _this.genChildren(node);
                _this.output += "\n}\n";
            }
            catch (error) {
                console.log(error);
                _this.errors.push("[ " + _this.filePath + " ] You have syntax error at line: " + node.line + ", file: " + _this.filePath +
                    (", src: {% " + predicate + " %}\n\nTip: Make sure that you write valid JavaScript code\n\n"));
            }
        };
        this.genSelfClose = function (node) {
            _this.genHTMLElement(node);
        };
        this.initGlobals();
        if (ast.name === "Program")
            this.init();
        else
            this.raise("[Generator] AST is corrupted or invalid");
    }
    Generator.prototype.init = function (node) {
        node || (node = this.ast);
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            //@ts-ignore
            if (this["gen" + child.name]) {
                //@ts-ignore
                this["gen" + child.name](child);
            }
            else {
                throw new Error("Cannot generate " + child.name);
            }
        }
        this.output += "return template;\n";
    };
    Generator.prototype.raise = function (msg) {
        this.errors.push(msg);
    };
    return Generator;
}());
exports.Generator = Generator;
