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
	type MessageLiteralPart,
	type MessageMarkupPart,
	type MessagePart,
} from "messageformat";
import Trans from "next-translate/Trans";
import I18nProvider from "next-translate/I18nProvider";

const msg =
	//	"Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon.";
	"Click <link>here</link>. {{count}} or <b><i>{{count}}</i></b>. <icon/> is an icon.";

function convertMessageSyntax(msg: string) {
	const replacedTags = msg
		.replace(/<(\S+)>(.*)<\/\1>/g, "{#$1}$2{/$1}") // Convert open/close function syntax
		.replace(/<(\S+)\/>/g, "{#$1/}") // Convert standalone function syntax
		.replace(/{{(\S+)}}/g, "{$$$1}"); // Convert variable expression syntax
	return `${replacedTags}`; // No need to wrap message (this is a simple message)
}

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

const message =
	"Click <link>here</link>. {{count}} or <b>{{count}}</b>. <icon/> is an icon.";
const mf2Message = convertMessageSyntax(message);
const messageToUse = message;

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

type PartsListNode = MessagePart | Array<PartsListNode> | Markup;
type PartsList = Array<PartsListNode>;
class Markup {
	#markup: boolean;
	name: string;
	child: PartsList;

	constructor(name, child) {
		this.#markup = true;
		this.name = name;
		this.child = child;
	}

	static isMarkup(obj: any): boolean {
		try {
			return obj.#markup;
		} catch {
			return false;
		}
	}
}

function ProcessPartsList(parts: MessagePart[]): PartsList {
	// Make a copy of `parts` so we can modify it
	const toDo: MessagePart[] = [...parts];

	// ProcessNodes() processes a flat list of message parts
	// into a tree structure.
	// (Currently only handles one level of nesting.)
	// `accum` is the list of already-processed subtrees.
	// The individual elements in the list are all `MessageParts`,
	// but the lists in the returned value may be nested arbitrarily.
	function ProcessNodes(accum: PartsList): PartsList {
		if (toDo.length === 0) {
			return accum;
		}
		// Literal node: append onto the existing list
		if (toDo[0].type === "literal") {
			return ProcessNodes(
				accum.toSpliced(accum.length, 0, toDo.shift() as MessagePart),
			);
		}
		// Markup node: should be an `open` node if the output of formatToParts()
		// is valid.
		if (toDo[0].type === "markup") {
			const markupNode = toDo[0] as MessageMarkupPart;
			if (markupNode.kind === "open") {
				const openNode: MessageMarkupPart = toDo.shift() as MessageMarkupPart;
				// Recursively process everything between the open and close nodes
				const tree = ProcessNodes([]);
				const closeNode: MessageMarkupPart = toDo.shift() as MessageMarkupPart;
				if (closeNode.kind !== "close") {
					console.log("Warning: unmatched tags!");
				}
				// Append a new subtree representing the tree denoted by this markup open/close pair
				// TODO: To handle arbitrary nesting, we really want `tree` and not `...tree`
				const subtree: Markup = new Markup(openNode.name, tree);
				return ProcessNodes(accum.toSpliced(accum.length, 0, subtree));
			}
			// When we see a close tag, we just return the accumulator
			if (markupNode.kind === "close") {
				return accum;
			}
		}
		// Default case (not markup or literal): append onto the existing list
		return ProcessNodes(
			accum.toSpliced(accum.length, 0, toDo.shift() as MessagePart),
		);
	}
	return ProcessNodes([]);
}

// hetList is really a list of arbitrarily-nested lists where all the
// leaf elements are MessageParts
function HetListToDOMTree(
	hetList: PartsList,
	components: Record<string, React.JSX.Element>,
): JSX.Element[] {
	return hetList.flatMap((part: PartsListNode, key) => {
		// part is either a (nested) list of MessageParts, or a single MessagePart
		if (Markup.isMarkup(part)) {
			// `subtree` is all the nodes between the open and the close
			const markup = part as Markup;
			const subtree: JSX.Element[] = HetListToDOMTree(markup.child, components);
			// Use the name of the open node to look up the component in the map
			// (we assume open.name === close.name)
			// TODO: this means overlapping tags don't work
			const component = components[markup.name]; //assert
			// Finally, wrap the sublist in a component of the kind
			// that matches its markup's name
			return React.cloneElement(component, { key }, ...subtree);
		}
		if (Array.isArray(part)) {
			return HetListToDOMTree(part, components);
		}
		// If part is not an array, it must be a MessagePart
		const messagePart = part as
			| MessageLiteralPart
			| MessageMarkupPart
			| MessageExpressionPart;
		switch (messagePart.type) {
			case "literal":
				// Literals are just strings
				return (
					<React.Fragment key={key}>
						{(messagePart as MessageLiteralPart).value}
					</React.Fragment>
				);
			case "markup":
				// assert part.kind=standalone
				return React.cloneElement(
					components[(messagePart as MessageMarkupPart).name],
					{ key },
				);
			case "number":
			case "datetime": {
				return (
					<React.Fragment key={key}>
						{messagePart.parts?.reduce((acc, part) => acc + part.value, "")}
					</React.Fragment>
				);
			}
			default:
				throw new Error("unreachable: " + messagePart.type);
		}
	});
}

// In the following, change `messageToUse` to `mf2Message` to test
// the `messageFormat2` attribute in Trans (not working yet),
// or change `mf2Message` back to `messageToUse` to test it with
// a message in next-translate syntax
/*
export default function Home() {
	return (
		<>
			<p>
				<b>Hello</b>
			</p>
			<p>
				{" "}
				<I18nProvider lang="en">
					<Trans
					//	messageFormat2="true"
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
*/

function MF2Trans(props) {
	// const converted = convertMessageSyntax(props.message);
	const converted =
		//	"Click {#link}here{/link}. {$count} or {#b}{#i}{$count}{/i}{/b}. {#icon/} is an icon.";
		// "hello {$count :number minimumFractionDigits=5}";
		// ".match {$count :number} one {{one}} 1 {{=1}} * {{other}}"
		"{|2006-01-02T15:04:06| :datetime dateStyle=long timeStyle=long}";
	const mf = new MessageFormat(converted, props.locale);
	const list = mf.formatToParts(props.values);
	const processed = ProcessPartsList(list);
	const contents = HetListToDOMTree(processed, props.components);
	return <>{...contents}</>;
}

export default function Home() {
	return (
		<>
			<p>
				<MF2Trans
					locale="en"
					message={msg}
					components={{
						link: <a href="/" />,
						b: <b style={{ color: "purple" }} />,
						i: <i />,
						icon: (
							<img src="https://imgs.xkcd.com/comics/purity.png" alt="dummy" />
						),
					}}
					values={{ count: 42.2 }}
				/>
			</p>
		</>
	);
}
