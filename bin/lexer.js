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
exports.Lexer = void 0;
var fs = __importStar(require("fs"));
// const for_reg: RegExp = /{%[ ]*for\([ \s]*let[ \s]+[\w_\*]+[ \s]+of[ \s]+[\w_\*]+\)[ \s]+%}/
var end_for_reg = /{%[ ]*end_for[ ]*%}/;
var empty_reg = /{% empty %}/;
var block_reg = /{%[ \s]*block[ \s]*%}/;
var end_block_reg = /{%[ \s]*end_block[ \s]*%}/;
// templates are like javascript functions
var template_reg = /{%[ ]*template [ ]*/;
var end_template_reg = /{%[ ]*end_template[ ]*%}/;
var template_call_reg = /{%[ ]*call:[ ]*/;
var dynamic_data_reg = /{{[ \s]*[ \s\w_\.\,\-\[\]\)\(\|_\&\$'"\+\?\=\:\;]+[ \s]*}}/;
// const if_reg = /{%[ ]*if[ \s]*\([ \s]*[\w_\*=>< \s"'\|\&\[\]\.\!]+[ \s]*\)[ \s]*%}/
var else_reg = /{%[ ]*else[ ]*%}/;
var end_if_reg = /{%[ ]*end_if[ ]*%}/;
var open_tag_start_reg = /<[\w-.,%$#@+-=\(\)\[\]\{\}\~\^&\(\)_\+]+/;
var close_tag_reg = /<\/[\w-.,% $#@+-=\(\)\{\}\~\^&\(\)_\+]+>/;
var attr_reg = /[\w-_\*]+="[ \|\/\w=\+\.\{\}\[\]_\)\'\(\?><\:\;\\,~`!\@\#\$\%\^\&\*\-\n]*"/;
var attr_reg_2 = /[\w-_\*]+='[ \|\/\w=\+\.\{\}\[\]_\)\"\(\?><\:\;\\,~`!\@\#\$\%\^\&\*\-\n]*'/;
var text_reg = /[ \w"'=\(\)!&\^%\$#@\-_+\\\|/\;\:,\.?\[\]\n\t\s>]+/;
var doc_type_reg = "<!DOCTYPE html>";
var self_close_reg = /(<area|<base|<br|<col|<embed|<hr|<img|<input|<link|<meta|<param|<source|<track|<wbr|<command|<keygen|<menuitem)/;
var includes_reg = /{% include[ \s]*\([ \s]*"[ \w\-\_\=\/\+\.\<\>\$\#\@]+"[ \s]*\) %}/;
var comment_reg = /<!--/;
var Lexer = /** @class */ (function () {
    function Lexer(src, filePath, views) {
        var _this = this;
        this.src = src;
        this.filePath = filePath;
        this.views = views;
        this.tokens = [];
        this.cursor = 0;
        this.error = [];
        this.line = 1;
        this.col = 0;
        this.token = null;
        this.eat = function (token) {
            _this.cursor += token.length;
            _this.col += token.length;
            _this.src = _this.src.substr(token.length);
        };
        this.skipLine = function () {
            _this.createToken("Text", "\n");
            if (_this.token)
                _this.tokens.push(_this.token);
            _this.cursor += "\n".length;
            _this.line++;
            _this.col = 0;
            _this.src = _this.src.substr("\n".length);
        };
        this.is = function (query) { var _a; return _this.has(query) && ((_a = _this.src.match(query)) === null || _a === void 0 ? void 0 : _a.index) === 0; };
        this.skipWhiteSpace = function () {
            var whiteS = _this.src.match(/[ \s]+/);
            var val = whiteS && whiteS[0] || "";
            if (val.search("\n") !== -1) {
                val = val.substring(0, val.search("\n"));
            }
            _this.createToken("Text", val);
            if (_this.token)
                _this.tokens.push(_this.token);
            // if (val.search("\n") !== -1)
            //     console.log(this.token);
            _this.eat(val);
        };
        while (!this.error.length && !this.eof) {
            switch (true) {
                case this.forStatenemt:
                case this.endFor:
                case this.empty:
                case this.ifStatement:
                case this.elseIfStatement:
                case this.elseStatement:
                case this.endIf:
                    {
                        this.tokenPush();
                    }
                    break;
                case this.rawText:
                    {
                        break;
                    }
                    ;
                case this.template:
                    {
                        this.tokenPush();
                    }
                    break;
                case this.endTemplate:
                    {
                        this.tokenPush();
                    }
                    break;
                case this.templateCall:
                    {
                        this.tokenPush();
                    }
                    break;
                case this.dynamicData:
                case this.comment:
                case this.script:
                case this.selfClose:
                case this.closeTag:
                case this.openTagStart:
                case this.openTagEnd:
                    {
                        this.tokenPush();
                    }
                    break;
                case this.endLine:
                    {
                        this.skipLine();
                    }
                    break;
                case this.whiteSpace:
                    {
                        this.skipWhiteSpace();
                    }
                    break;
                case this.attribute:
                    {
                        break;
                    }
                    ; //{ this.tokenPush() } break;
                case this.text:
                    {
                        break;
                    }
                    ;
                case this.docType:
                    {
                        this.tokenPush();
                    }
                    break;
                case this.includes:
                    {
                        this.handleIncludes();
                    }
                    break;
                default:
                    {
                        var msg = "[Lexer] Unexpected character, " + this.src[0] + ", at line " + this.line + ", col " + this.col + ", file " + this.filePath + " ...src: " + this.src.slice(0, 50);
                        this.error.push(msg);
                    }
                    break;
            }
        }
        // console.log(this.tokens);
    }
    Object.defineProperty(Lexer.prototype, "includes", {
        get: function () {
            return this.is(includes_reg);
        },
        enumerable: false,
        configurable: true
    });
    Lexer.prototype.handleIncludes = function () {
        var match = this.src.match(includes_reg);
        var val = match && match[0] || "";
        var file = val.slice(val.indexOf('"') + 1, val.lastIndexOf('"')).trim();
        var fileSrc = "";
        if (file.startsWith("./")) {
            fileSrc = this.views && this.views + "/" + file.substring(2, file.length) || file;
        }
        else {
            fileSrc = this.views + "/" + file;
        }
        var code = fs.readFileSync(fileSrc, { encoding: "utf8" });
        var lex = new Lexer(code, file, this.views);
        this.error = this.error.concat(lex.error);
        this.tokens = this.tokens.concat(lex.tokens);
        this.eat(val);
    };
    Lexer.prototype.tokenPush = function () {
        if (!this.token) {
            var msg = "[tokenPush] Expected a token but got null, \n                " + this.src[0] + ", at line " + this.line + ", col " + this.col;
            this.error.push(msg);
            return;
        }
        this.tokens.push(this.token);
        this.eat(this.token.val);
    };
    Lexer.prototype.correctCol = function () {
        if (this.token)
            this.col = this.token.val.slice(this.token.val.lastIndexOf("\n") + 1).length;
    };
    Lexer.prototype.has = function (str) {
        return this.src.search(str) !== -1;
    };
    Object.defineProperty(Lexer.prototype, "forStatenemt", {
        get: function () {
            if (!this.is(/{%[ ]*for\([ \s]*let/))
                return false;
            if (this.src.substring(0, this.src.search(/\n/g)).search(/%}/) === -1) {
                this.error.push("Lexer -> forStatenemt: " +
                    ("Invalid for statement, " + this.src.slice(0, this.src.search(/\n/g)) + ",") +
                    ("at line " + this.line + " col " + this.col + "."));
            }
            var header = this.src.substring(0, this.src.search(/%}/) + 2);
            this.createToken("ForStatement", header);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "endTemplate", {
        get: function () {
            if (!this.is(end_template_reg))
                return false;
            var match = this.src.match(end_template_reg);
            this.createToken("EndTemplate", match && match[0] || "");
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "templateCall", {
        get: function () {
            if (!this.is(template_call_reg))
                return false;
            if (this.src.search("%}") === -1)
                return false;
            var match = this.src.substring(0, this.src.search("%}") + 2);
            this.createToken("TemplateCall", match);
            if (match.search("\n") !== -1) {
                this.line += ((match.split("\n").length) - 1);
                this.col = match.substring(match.lastIndexOf("\n"), match.length).length;
            }
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "template", {
        get: function () {
            if (!this.is(template_reg))
                return false;
            if (this.src.indexOf("%}") === -1)
                return false;
            var match = this.src.substring(0, this.src.indexOf("%}") + 2);
            this.createToken("Template", match || "");
            if (match.search("\n") !== -1) {
                this.line += ((match.split("\n").length) - 1);
                this.col = match.substring(match.lastIndexOf("\n"), match.length).length;
            }
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "dynamicData", {
        get: function () {
            if (!this.is(dynamic_data_reg))
                return false;
            var match = this.src.match(dynamic_data_reg);
            var val = match && match[0] || "";
            this.createToken("DynamicData", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "endFor", {
        get: function () {
            if (!this.is(end_for_reg))
                return false;
            var match = this.src.match(end_for_reg);
            var val = match && match[0] || "";
            this.createToken("EndFor", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "ifStatement", {
        get: function () {
            if (!this.is(/{%[ ]*if[ \s]*\(/))
                return false;
            if (this.src.substring(0, this.src.search(/\n/g)).search(/%}/) === -1) {
                this.error.push("Lexer -> forStatenemt: " +
                    ("Invalid 'If Statement', " + this.src.slice(0, this.src.search(/\n/g)) + ",") +
                    ("at line " + this.line + " col " + this.col + "."));
            }
            var header = this.src.substring(0, this.src.search(/%}/) + 2);
            // const match = this.src.match(if_reg)
            // const val = match && match[0] || ""
            // this.createToken("IfStatement", val)
            this.createToken("IfStatement", header);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "elseIfStatement", {
        get: function () {
            if (!this.is(/{%[ ]*else if[ \s]*\(/))
                return false;
            if (this.src.substring(0, this.src.search(/\n/g)).search(/%}/) === -1) {
                this.error.push("Lexer -> forStatenemt: " +
                    ("Invalid 'If Statement', " + this.src.slice(0, this.src.search(/\n/g)) + ",") +
                    ("at line " + this.line + " col " + this.col + "."));
            }
            var header = this.src.substring(0, this.src.search(/%}/) + 2);
            // const match = this.src.match(if_reg)
            // const val = match && match[0] || ""
            // this.createToken("IfStatement", val)
            this.createToken("ElseIfStatement", header);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "elseStatement", {
        get: function () {
            if (!this.is(else_reg))
                return false;
            var match = this.src.match(else_reg);
            var val = match && match[0] || "";
            this.createToken("ElseStatement", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "openTagStart", {
        get: function () {
            if (!this.is(open_tag_start_reg))
                return false;
            var match = this.src.match(open_tag_start_reg);
            var val = match && match[0] || "";
            this.createToken("OpenTagStart", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "selfClose", {
        get: function () {
            if (!this.is(self_close_reg))
                return false;
            var match = this.src.match(self_close_reg);
            var val = match && match[0] || "";
            this.createToken("SelfClose", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "empty", {
        get: function () {
            if (!this.is(empty_reg))
                return false;
            var match = this.src.match(empty_reg);
            var val = match && match[0] || "";
            this.createToken("Empty", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "docType", {
        get: function () {
            if (!this.is(doc_type_reg))
                return false;
            var match = this.src.match(doc_type_reg);
            var val = match && match[0] || "";
            this.createToken("DocType", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "openTagEnd", {
        get: function () {
            if (!this.is(">"))
                return false;
            var match = this.src.match(">");
            var val = match && match[0] || "";
            this.createToken("OpenTagEnd", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "closeTag", {
        get: function () {
            if (!this.is(close_tag_reg))
                return false;
            var match = this.src.match(close_tag_reg);
            var val = match && match[0] || "";
            this.createToken("CloseTag", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "endIf", {
        get: function () {
            if (!this.is(end_if_reg))
                return false;
            var match = this.src.match(end_if_reg);
            var val = match && match[0] || "";
            this.createToken("EndIf", val);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "rawText", {
        get: function () {
            if (!this.is(block_reg))
                return false;
            var val = this.src.slice(0, this.src.search(end_block_reg));
            var text_content = val.replace(block_reg, "");
            this.src = this.src.replace(end_block_reg, "");
            this.createToken("Text", text_content);
            if (this.token)
                this.tokens.push(this.token);
            // correct lines and columns
            if (val.indexOf("\n") !== -1) {
                this.line += (val.split("\n").length - 1);
                if (val.endsWith("\n")) {
                    this.col = 0;
                }
                else {
                    this.col = (val.length - 1) - val.lastIndexOf("\n");
                }
            }
            else {
                this.col += val.length - 1;
            }
            this.cursor += val.length;
            this.src = this.src.substr(val.length);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "text", {
        get: function () {
            if (!this.is(text_reg))
                return false;
            var match = this.src.match(text_reg);
            var val = match && match[0] || "";
            this.createToken("Text", val);
            if (this.token)
                this.tokens.push(this.token);
            // correct lines and columns
            if (val.indexOf("\n") !== -1) {
                this.line += (val.split("\n").length - 1);
                if (val.endsWith("\n")) {
                    this.col = 0;
                }
                else {
                    this.col = (val.length - 1) - val.lastIndexOf("\n");
                }
            }
            else {
                this.col += val.length - 1;
            }
            this.cursor += val.length;
            this.src = this.src.substr(val.length);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "attribute", {
        get: function () {
            var match;
            var val;
            if (this.is(attr_reg)) {
                match = this.src.match(attr_reg);
                val = match && match[0] || "";
                this.createToken("Attribute", val);
                // return true
            }
            else if (this.is(attr_reg_2)) {
                match = this.src.match(attr_reg_2);
                val = match && match[0] || "";
                this.createToken("Attribute", val);
                // return true
            }
            else
                return false;
            if (this.token)
                this.tokens.push(this.token);
            // correct lines and columns
            if (val.indexOf("\n") !== -1) {
                this.line += (val.split("\n").length - 1);
                if (val.endsWith("\n")) {
                    this.col = 0;
                }
                else {
                    this.col = (val.length - 1) - val.lastIndexOf("\n");
                }
            }
            else {
                this.col += val.length - 1;
            }
            this.cursor += val.length;
            this.src = this.src.substr(val.length);
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "script", {
        get: function () {
            if (!this.is("<scrip"))
                return false;
            var val = this.src.slice(0, this.src.indexOf("</script>") + "</script>".length);
            this.createToken("Script", val);
            if (val.search("\n") !== -1) {
                this.line += val.split("\n").length - 1;
                this.correctCol();
            }
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "whiteSpace", {
        get: function () {
            // console.log("Lexer -> whiteSpace()")
            // console.log(`line ${this.line}, col ${this.col}`)
            return this.is(/[ \s]+/);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "endLine", {
        get: function () {
            var _a;
            if (!this.has("\n"))
                return false;
            // if (this.src.match("\n")?.index !== 0)
            //     console.log(this.src.match("\n"));
            if (((_a = this.src.match("\n")) === null || _a === void 0 ? void 0 : _a.index) !== 0)
                return false;
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Lexer.prototype, "comment", {
        get: function () {
            if (!this.is("<!--"))
                return false;
            var val = this.src.slice(0, this.src.indexOf("-->") + "-->".length);
            this.createToken("Comment", val);
            //count lines and columns correctly
            if (val.search("\n") !== -1) {
                this.line += val.split("\n").length - 1;
                this.correctCol();
            }
            return true;
        },
        enumerable: false,
        configurable: true
    });
    Lexer.prototype.createToken = function (type, val) {
        this.token = {
            type: type,
            line: this.line,
            col: this.col,
            val: val
        };
    };
    Object.defineProperty(Lexer.prototype, "eof", {
        get: function () {
            return this.src[0] === undefined;
        },
        enumerable: false,
        configurable: true
    });
    return Lexer;
}());
exports.Lexer = Lexer;
