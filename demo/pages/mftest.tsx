// This didn't work until I did:
// npm install -save-exact messageformat@next

import React from "react";
import useTranslation from "next-translate/useTranslation";
// import { MessageFormat, MessageFormatOptions, MessageFunctions, MessageValue } from "@messageformat/core";
// import { MessageFormat, MessageFormatOptions, MessageFunctions, MessageValue } from "messageformat";
import {
	MessageFormat,
	MessageFormatOptions,
	MessageFunctions,
	type MessageExpressionPart,
	type MessagePart,
} from "messageformat";
import Trans from "next-translate/Trans";
import I18nProvider from "next-translate/I18nProvider";

const msg = // "{{count}}"
	"Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon.";

function convertMessageSyntax(msg: string) {
	const replacedTags = msg
		.replace(/<(\S+)>(.*)<\/\1>/g, "{#$1}$2{/$1}") // Convert open/close function syntax
		.replace(/<(\S+)\/>/g, "{:$1}") // Convert standalone function syntax
		.replace(/{{(\S+)}}/g, "{$$$1}"); // Convert variable expression syntax
	return `${replacedTags}`; // No need to wrap message (this is a simple message)
}

const convertedMsg = convertMessageSyntax(msg);
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

const mf = new MessageFormat(convertedMsg, "en", {
	functions: {
		icon: (ctx, opts, input) => ({
			type: "standalone",
			locale: ctx.locales[0],
			source: "NA",
			toString: () => "test",
			toParts: () => [
				{ type: "literal", value: "test-part" } as MessageExpressionPart,
			],
		}),
	},
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

const message =
	"Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon.";
const mf2Message = convertMessageSyntax(message);
const messageToUse = message;
console.log("Converted: " + mf2Message);

const list = mf.formatToParts({ count: 1 });
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

function ProcessPartsList(parts: MessagePart[]) {
	const toDo: MessagePart[] = [...parts];

	function ProcessNodes(accum: MessagePart[][]) {
		if (toDo.length === 0) {
			return accum;
		}
		if (toDo[0].type === "literal") {
			const head = toDo.shift() as MessagePart;
			return ProcessNodes(accum.toSpliced(accum.length, 0, head));
		}
		if (toDo[0].type === "markup") {
			if (toDo[0].kind === "open") {
				const openNode: MessagePart = toDo.shift() as MessagePart;
				const tree: MessagePart[] = ProcessNodes([]);
				const closeNode: MessagePart = toDo.shift() as MessagePart;
				if (closeNode.kind !== "close") {
					console.log("Warning: unmatched tags!");
				}
				return ProcessNodes(
					accum.toSpliced(accum.length, 0, [openNode, ...tree, closeNode]),
				);
			}
			if (toDo[0].kind === "close") {
				return accum;
			}
		}
		return ProcessNodes(accum.toSpliced(accum.length, 0, toDo.shift()));
	}
	return ProcessNodes([]);
}

let count = 0;

function HetListToDOMTree(
	hetList: MessagePart[][],
	components: Record<string, React.JSX.Element>,
): JSX.Element[] {
	return hetList.map((part) => {
		if (Array.isArray(part)) {
			// asserts
			const newPart = [...part];
			if (newPart.length === 0) return [];
			const open = newPart.shift();
			const _close = newPart.pop();
			const subtree = HetListToDOMTree(newPart, components);
			const component = components[open.name]; //assert
			return React.cloneElement(component, { key: count++ }, ...subtree);
		}
		switch (part.type) {
			case "literal":
				return <React.Fragment key={count++}>{part.value}</React.Fragment>;
			case "number":
				return (
					<React.Fragment key={count++}>
						{JSON.stringify(part.parts)}
					</React.Fragment>
				);
			default:
				throw new Error("unreachable");
		}
	});
}

const processed = ProcessPartsList(list);
console.log("Processed:");
console.log(processed);

// In the following, change `messageToUse` to `mf2Message` to test
// the `messageFormat2` attribute in Trans (not working yet),
// or change `mf2Message` back to `messageToUse` to test it with
// a message in next-translate syntax
export function Test() {
	return (
		<>
			<p>
				<b>Hello</b>
			</p>
			<p>
				{" "}
				<I18nProvider lang="en">
					<Trans
						messageFormat2="true"
						i18nKey="ns"
						components={{
							link: <a href="/" />,
							b: <b style={{ color: "purple" }} />,
							icon: <img src="https://imgs.xkcd.com/comics/purity.png" />,
						}}
						// This is without pluralizing the count value
						values={{ count: 42 }}
						defaultTrans={messageToUse}
					/>
				</I18nProvider>
			</p>
			<example />
		</>
	);
}

export default function Home() {
	return (
		<>
			<p>
				{...HetListToDOMTree(processed, {
					link: <a href="/" />,
					b: <b style={{ color: "purple" }} />,
					icon: (
						<img src="https://imgs.xkcd.com/comics/purity.png" alt="dummy" />
					),
				})}
			</p>
		</>
	);
}
