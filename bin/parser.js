"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
var Parser = /** @class */ (function () {
    function Parser(tokens, removeComment) {
        var _this = this;
        this.tokens = tokens;
        this.removeComment = removeComment;
        this.token = null;
        this.ast = {
            name: "Program",
            tagName: "",
            attributes: [],
            children: [],
            line: -1,
            col: -1,
        };
        this.openedTagsStack = [this.ast];
        this.status = "html";
        this.errors = [];
        this.parseOpenTagStart = function (name) {
            var _a, _b, _c;
            if (!_this.token)
                return;
            _this.status = "attr";
            var element = {
                name: name || "HTMLElement",
                tagName: _this.token.val.slice(1),
                line: _this.token.line,
                col: _this.token.col,
                attributes: [],
                children: []
            };
            if (((_a = _this.currentElement) === null || _a === void 0 ? void 0 : _a.name) === "SelfClose")
                _this.openedTagsStack.pop();
            (_c = (_b = _this.currentElement) === null || _b === void 0 ? void 0 : _b.children) === null || _c === void 0 ? void 0 : _c.push(element);
            _this.openedTagsStack.push(element);
        };
        this.parseOpenTagEnd = function () {
            var _a;
            _this.status = "html";
            if (((_a = _this.currentElement) === null || _a === void 0 ? void 0 : _a.name) === "SelfClose")
                _this.openedTagsStack.pop();
        };
        this.parseCloseTag = function () {
            if (!_this.token) {
                return;
            }
            if (_this.currentElement.name === "SelfClose") {
                _this.openedTagsStack.pop();
            }
            if (_this.token.val === "</" + _this.currentElement.tagName + ">") {
                _this.openedTagsStack.pop();
            }
            else {
                var msg = "[parseCloseTag] \n                Close tag, " + _this.token.val + " does not match an open tag,  \n                " + _this.currentElement.tagName + ", \n                at line " + _this.token.line + ", \n                col " + _this.token.col;
                _this.raise(msg);
            }
        };
        this.parseSelfClose = function () {
            _this.parseOpenTagStart("SelfClose");
        };
        this.parseAttribute = function () {
            var _a, _b;
            if (!_this.token)
                return;
            //there might exist text that looks like 
            //an attribute in the innerHTML
            if (_this.status === "html") {
                (_b = (_a = _this.currentElement) === null || _a === void 0 ? void 0 : _a.children) === null || _b === void 0 ? void 0 : _b.push({
                    name: "Text",
                    val: _this.token.val,
                    line: _this.token.line,
                    col: _this.token.col
                });
            }
            else if (_this.currentElement.attributes) {
                _this.currentElement.attributes.push(_this.token.val);
            }
        };
        this.parseScript = function () {
            _this.parseText();
        };
        this.parseText = function (name) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            if (!_this.token)
                return;
            // dengerous code
            if (_this.token.val === "\n" && _this.status === "attr") {
                if ((_a = _this.currentElement) === null || _a === void 0 ? void 0 : _a.attributes) {
                    _this.currentElement.attributes[((_b = _this.currentElement) === null || _b === void 0 ? void 0 : _b.attributes.length) - 1] += "\n";
                }
            }
            if (_this.status === "attr")
                return;
            var astNode = {
                name: name || "Text",
                val: (_c = _this.token) === null || _c === void 0 ? void 0 : _c.val,
                line: (_d = _this.token) === null || _d === void 0 ? void 0 : _d.line,
                col: (_e = _this.token) === null || _e === void 0 ? void 0 : _e.col
            };
            // this part is comented because it does not look proper
            // text cannot be found as children in selfCloseTags 
            // if (this.currentElement?.name === "SelfClose")
            //     this.openedTagsStack.pop()
            if (((_f = _this.currentElement) === null || _f === void 0 ? void 0 : _f.name) === "SelfClose")
                return;
            (_h = (_g = _this.currentElement) === null || _g === void 0 ? void 0 : _g.children) === null || _h === void 0 ? void 0 : _h.push(astNode);
        };
        this.parseTemplateCall = function () {
            _this.parseText("TemplateCall");
        };
        this.parseTemplate = function () {
            _this.parseStatement("TemplateStatement");
        };
        this.parseForStatement = function () {
            _this.parseStatement("ForStatement");
        };
        this.parseIfStatement = function () {
            _this.parseStatement("IfStatement");
        };
        this.parseElseIfStatement = function () {
            _this.parseEndIf();
            _this.parseStatement("IfStatement");
        };
        this.parseElseStatement = function () {
            _this.parseEndIf();
            _this.parseStatement("IfStatement");
        };
        this.parseStatement = function (name) {
            var _a, _b, _c, _d, _e;
            if (!_this.token)
                return;
            var astNode = {
                name: name,
                predicate: (_a = _this.token) === null || _a === void 0 ? void 0 : _a.val,
                line: (_b = _this.token) === null || _b === void 0 ? void 0 : _b.line,
                col: (_c = _this.token) === null || _c === void 0 ? void 0 : _c.col,
                children: []
            };
            (_e = (_d = _this.currentElement) === null || _d === void 0 ? void 0 : _d.children) === null || _e === void 0 ? void 0 : _e.push(astNode);
            _this.openedTagsStack.push(astNode);
        };
        this.parseEndTemplate = function () {
            if (!_this.token)
                return;
            if (_this.currentElement.name === "SelfClose") {
                _this.openedTagsStack.pop();
            }
            if (_this.currentElement.name === "TemplateStatement") {
                _this.openedTagsStack.pop();
            }
            else {
                var msg = "[parseEndFor] \n                Close tag, " + _this.token.val + " does not match an open tag,  \n                " + _this.currentElement.tagName + ", \n                at line " + _this.token.line + ", \n                col " + _this.token.col;
                _this.raise(msg);
            }
        };
        this.parseEndFor = function () {
            if (!_this.token)
                return;
            if (_this.currentElement.name === "SelfClose") {
                _this.openedTagsStack.pop();
            }
            if (_this.currentElement.name === "ForStatement") {
                _this.openedTagsStack.pop();
            }
            else {
                var msg = "[parseEndFor] \n                Close tag, " + _this.token.val + " does not match an open tag,  \n                " + _this.currentElement.tagName + ", \n                at line " + _this.token.line + ", \n                col " + _this.token.col;
                _this.raise(msg);
            }
        };
        this.parseEndIf = function () {
            if (!_this.token)
                return;
            if (_this.currentElement.name === "SelfClose") {
                _this.openedTagsStack.pop();
            }
            if (_this.currentElement.name === "IfStatement" || _this.currentElement.name === "ElseIfStatement") {
                _this.openedTagsStack.pop();
            }
            else {
                var msg = "[parseEndIf] Unexpected token, " + _this.token.val + ", at line " + _this.token.line + ", " +
                    ("col " + _this.token.col + ".\nThere is not preceding if statement block\n\n");
                _this.raise(msg);
            }
        };
        this.parseDocType = function () {
            _this.parseText();
        };
        this.parseDynamicData = function () {
            _this.parseText("DynamicData");
        };
        this.parseComment = function () {
            if (_this.removeComment)
                return;
            // this.parseText()
        };
        // console.log(this.tokens)
        for (var i = 0; i < this.tokens.length; i++) {
            this.token = tokens[i];
            //@ts-ignore
            if (this["parse" + this.token.type]) {
                //@ts-ignore
                this["parse" + this.token.type]();
            }
            else {
                this.raise("[Parser] Cannot parse token: " + this.token.type);
            }
        }
    }
    Object.defineProperty(Parser.prototype, "currentElement", {
        get: function () {
            return this.openedTagsStack[this.openedTagsStack.length - 1];
        },
        enumerable: false,
        configurable: true
    });
    Parser.prototype.raise = function (msg) {
        this.errors.push(msg);
    };
    return Parser;
}());
exports.Parser = Parser;
