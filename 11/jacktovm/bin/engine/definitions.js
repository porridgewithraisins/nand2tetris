"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delimiter = exports.IDENTIFIER = exports.STRINGCONST = exports.INTCONST = exports.SYMBOL = exports.KEYWORD = void 0;
exports.KEYWORD = /^class$|^method$|^constructor$|^function$|^field$|^static$|^var$|^int$|^char$|^boolean$|^void$|^true$|^false$|^null$|^this$|^let$|^do$|^if$|^else$|^while$|^return$/;
exports.SYMBOL = /\{|\}|\(|\)|\[|\]|\.|,|;|\+|-|\*|\/|&|\||\<|\>|=|~/;
exports.INTCONST = /^\d+$/;
exports.STRINGCONST = /"[^"]*"/;
exports.IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
exports.delimiter = new RegExp("(" + exports.SYMBOL.source + "|" + exports.STRINGCONST.source + '|' + /\s+/.source + ")");
//# sourceMappingURL=definitions.js.map