import { MessageFormat, MessageFormatOptions, MessageFunctions, MessageValue } from "messageformat";

const msg =
    "Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon."

function convertMessageSyntax(msg) {
    const replacedTags = msg
        .replace(/<(\S+)>(.*)<\/\1>/g, "{+$1}$2{-$1}")  // Convert open/close function syntax
        .replace(/<(\S+)\/>/g, "{:$1}")                 // Convert standalone function syntax
        .replace(/{{(\S+)}}/g, "{$$$1}")                // Convert variable expression syntax
    return `{${replacedTags}}`                          // Wrap message, TODO: fix after text mode change
}

const convertedMsg = convertMessageSyntax(msg)
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

const mf = new MessageFormat(convertedMsg, 'en', {
    functions: {
        icon: (ctx, opts, input) => ({
            type: 'standalone',
            locale: ctx.locales[0],
            source: 'NA',
            toString: () =>
        })
    }
});
console.log(mf.format({count: 42}));

// function newMessageValue(): MessageValue {
//     return {
//         locale: 'en',
//         type: 'literal',
//         source: 'NA',
//         toString: () => 'hello there!'
//     }
// }