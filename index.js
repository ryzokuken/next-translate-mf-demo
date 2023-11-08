const { MessageFormat } = require("messageformat")

const msg =
    "Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon."

function convertMessageSyntax(msg) {
    const replacedTags = msg
        .replace(/<(\S+)>(.*)<\/\1>/g, "{+$1}$2{-$1}")  // Convert open/close function syntax
        .replace(/<(\S+)\/>/g, "{#$1}")                 // Convert standalone function syntax
        .replace(/{{(\S+)}}/g, "{$$$1}")                // Convert variable expression syntax
    return `{${replacedTags}}`                          // Wrap message, TODO: fix after text mode change
}

const convertedMsg = convertMessageSyntax(msg)

// console.log(convertedMsg)

const mf = new MessageFormat(convertedMsg, 'en');
console.log(mf.resolveMessage({count: 42}).toString());