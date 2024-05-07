// This didn't work until I did:
// npm install -save-exact messageformat@next

import React from 'react'
import useTranslation from 'next-translate/useTranslation'
// import { MessageFormat, MessageFormatOptions, MessageFunctions, MessageValue } from "@messageformat/core";
// import { MessageFormat, MessageFormatOptions, MessageFunctions, MessageValue } from "messageformat";
import { MessageFormat, MessageFormatOptions, MessageFunctions } from "messageformat";
import Trans from "next-translate/Trans"
import I18nProvider from "next-translate/I18nProvider"

const msg = // "{{count}}"
  "Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon."

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
            toString: () => "test",
            toParts: () => [{ type: 'literal', value: 'test-part' }]
        })
    }
});

// const mf = new MessageFormat(convertedMsg, 'en');

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

const parts = mf.formatToParts({count: 1});
// console.log("parts = " + JSON.stringify(parts));

// for (const p in parts) {
//    console.log(parts[p]);
// }

// var domNodes = [];
// for (const p in parts) {
//   if (p.type === 'literal') {
//     domNodes += parts[p];
//   } else if (p.type === 'markup') {
//       if (p.kind === 'open') {
//         domNodes += parts[p];
//       } else if (p.kind === 'close') {
//           var contents = [];
//           for (const n in domNodes.toReversed()) {
// // TODO: nesting/overlapping elements won't work this way
//             if (n.kind === 'open') {
//               break;
//             }
//             contents = n += contents;
//             domNodes.pop();
//           }
//
//       }
//   }
// }

var toDo = [...parts];

console.log(toDo);

function ProcessNodes(parts : [[object]]) {
   if (toDo.length === 0) {
      return parts;
   }
   if (toDo[0].type === 'literal') {
      const head = toDo.pop();
      return ProcessNodes(parts + [head]);
   }
   if (parts[0].type === 'markup') {
      if (parts[0].kind === 'open') {
         const openNode : object = toDo.pop();
         const tree : [object] = ProcessNodes();
         const closeNode : object = toDo.pop();
         if (closeNode.kind !== 'close') {
            console.log("Warning: unmatched tags!");
         }
         return ProcessNodes(parts + [tree]);
      }
      if (parts[0].kind === 'close') {
         return parts;
      }
  }
}

const processed : [[object]] = ProcessNodes(parts);

console.log("Processed:");
console.log(typeof(processed));

for (const p in processed) {
  console.log("Start:");
  console.log(processed[p]);
  console.log("End:");
}


// In the following, change `messageToUse` to `mf2Message` to test
// the `messageFormat2` attribute in Trans (not working yet),
// or change `mf2Message` back to `messageToUse` to test it with
// a message in next-translate syntax
export function Test() {
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
            defaultTrans={mf2Message}
        />
        </I18nProvider>
     </p>
     <example/>
     </>
    )
}

export default function Home() {

}
