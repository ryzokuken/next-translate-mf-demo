"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var messageformat_1 = require("messageformat");
var msg = "Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon.";
function convertMessageSyntax(msg) {
    var replacedTags = msg
        .replace(/<(\S+)>(.*)<\/\1>/g, "{+$1}$2{-$1}") // Convert open/close function syntax
        .replace(/<(\S+)\/>/g, "{:$1}") // Convert standalone function syntax
        .replace(/{{(\S+)}}/g, "{$$$1}"); // Convert variable expression syntax
    return "{".concat(replacedTags, "}"); // Wrap message, TODO: fix after text mode change
}
var convertedMsg = convertMessageSyntax(msg);
console.log(convertedMsg);
// const functions = {
//     link: ({ source, locales: [locale] }, _opt, input) => ({
//       type: 'custom',
//       source,
//       locale,
//       toParts: () => [
//         { type: 'custom', source, locale, value: `part:${input}` }
//       ],
//       toString: () => "<link>heyo!</link>"
//     })
// };
var mf = new messageformat_1.MessageFormat(convertedMsg, 'en', {
    functions: {}
});
console.log(mf.format({ count: 42 }));
// function newMessageValue(): MessageValue {
//     return {
//         locale: 'en',
//         type: 'literal',
//         source: 'NA',
//         toString: () => 'hello there!'
//     }
// }
