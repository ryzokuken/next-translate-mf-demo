// This didn't work until I did:
// npm install -save-exact messageformat@next

import React from 'react'
import useTranslation from 'next-translate/useTranslation'
// import { MessageFormat, MessageFormatOptions, MessageFunctions, MessageValue } from "@messageformat/core";
// import { MessageFormat, MessageFormatOptions, MessageFunctions, MessageValue } from "messageformat";
import { MessageFormat, MessageFormatOptions, MessageFunctions } from "messageformat";
import Trans from "next-translate/Trans"
import I18nProvider from "next-translate/I18nProvider"

const msg =  "{{count}}"
  //  "Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon."

function convertMessageSyntax(msg :string) {
    const replacedTags = msg
    .replace(/<(\S+)>(.*)<\/\1>/g, "{#$1}$2{/$1}")  // Convert open/close function syntax
        .replace(/<(\S+)\/>/g, "{:$1}")                 // Convert standalone function syntax
        .replace(/{{(\S+)}}/g, "{$$$1}")                // Convert variable expression syntax
        return `${replacedTags}`                        // No need to wrap message (this is a simple message)
}

const convertedMsg = convertMessageSyntax(msg)
console.log(convertedMsg);
console.log("1");

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
            toString: () => "test"
        })
    }
});
console.log(mf.formatToParts({count: 'cat'}));
console.log("2");

// function newMessageValue(): MessageValue {
//     return {
//         locale: 'en',
//         type: 'literal',
//         source: 'NA',
//         toString: () => 'hello there!'
//     }
// }

const message = "Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon."
const mf2Message = convertMessageSyntax(message)
const messageToUse = message
console.log("Converted: " + mf2Message)

export default function Home() {
    return (
    <>
    <p><b>Hello</b></p>
    <p> <I18nProvider
          lang="en"
          >
        <Trans
            messageFormat2="true"
            i18nKey="ns"
            components={{
                link: <a href="/" />,
                b: <b style={{ color: "purple" }} />,
                icon: <img src="https://imgs.xkcd.com/comics/purity.png"/>,
            }}
            // This is without pluralizing the count value
            values={{ count: 42 }}
            defaultTrans={messageToUse}
        />
        </I18nProvider>
     </p>
     <example/>
     </>
    )
}
