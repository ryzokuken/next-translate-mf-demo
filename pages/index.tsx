import React from "react";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
	MessageFormat,
	type MessageLiteralPart,
	type MessageMarkupPart,
	type MessagePart,
} from "messageformat";

function convertMessageSyntax(message: string) {
	return message
		.replace(/<(\w+\/?)>/g, "{#$1}") // open/standalone
		.replace(/<(\/\w+)>/g, "{$1}") // close
		.replace(/{{(\S+)}}/g, "{$$$1}"); // variable expressions
}

type PartsList = Array<MessagePart | Markup>;

class Markup {
	#markup: boolean;
	name: string;
	child: PartsList;

	constructor(name: string, child: PartsList) {
		this.#markup = true;
		this.name = name;
		this.child = child;
	}

	static isMarkup(obj: object): boolean {
		return #markup in obj;
	}
}

function ProcessPartsList(parts: MessagePart[]): PartsList {
	// Make a copy of `parts` so we can modify it
	const toDo = [...parts];

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
		// Markup node: should be an `open` node if the output of formatToParts()
		// is valid.
		if (toDo[0].type === "markup") {
			const markupNode = toDo[0] as MessageMarkupPart;
			if (markupNode.kind === "open") {
				const openNode = toDo.shift() as MessageMarkupPart;
				// Recursively process everything between the open and close nodes
				const tree = ProcessNodes([]);
				const closeNode = toDo.shift() as MessageMarkupPart;
				if (closeNode.kind !== "close") {
					console.log("Warning: unmatched tags!");
				}
				// Append a new subtree representing the tree denoted by this markup open/close pair
				// TODO: To handle arbitrary nesting, we really want `tree` and not `...tree`
				const subtree = new Markup(openNode.name, tree);
				return ProcessNodes(accum.toSpliced(accum.length, 0, subtree));
			}
			// When we see a close tag, we just return the accumulator
			if (markupNode.kind === "close") {
				return accum;
			}
		}
		// Default case (not markup): append onto the existing list
		return ProcessNodes(accum.toSpliced(accum.length, 0, toDo.shift()!));
	}
	return ProcessNodes([]);
}

type Element = React.JSX.Element;

// hetList is really a list of arbitrarily-nested lists where all the
// leaf elements are MessageParts
function HetListToDOMTree(
	hetList: PartsList,
	components: Record<string, Element>,
): Element[] {
	return hetList.flatMap((part) => {
		// part is either a (nested) list of MessageParts, or a single MessagePart
		if (Markup.isMarkup(part)) {
			// `subtree` is all the nodes between the open and the close
			const markup = part as Markup;
			const subtree = HetListToDOMTree(markup.child, components);
			// Use the name of the open node to look up the component in the map
			// (we assume open.name === close.name)
			// TODO: this means overlapping tags don't work
			const component = components[markup.name]; //assert
			// Finally, wrap the sublist in a component of the kind
			// that matches its markup's name
			return React.cloneElement(component, undefined, ...subtree);
		}
		if (Array.isArray(part)) {
			return HetListToDOMTree(part, components);
		}
		// If part is not an array, it must be a MessagePart
		const messagePart = part as MessagePart;
		switch (messagePart.type) {
			case "literal":
				// Literals are just strings
				return <>{(messagePart as MessageLiteralPart).value}</>;
			case "markup":
				// assert part.kind=standalone
				return React.cloneElement(
					components[(messagePart as MessageMarkupPart).name],
				);
			case "number":
			case "datetime": {
				return (
					<>{messagePart.parts?.reduce((acc, part) => acc + part.value, "")}</>
				);
			}
			case "fallback": {
				return <>{`{${messagePart.source}}`}</>;
			}
			default: {
				throw new Error(`unreachable: ${messagePart.type}`);
			}
		}
	});
}

type TransProps = {
	locale: string;
	i18nKey?: string;
	fallback?: string;
	defaultTrans?: string;
	values: Record<string, unknown>;
	components: Record<string, Element>;
};

// Splits a string like 'a:b' into {ns: a, suffix: b}
function splitKey(k: string): { ns: string; suffix: string } {
	const i = k.indexOf(":");
	if (i < 0) throw new Error(`namespace required, got ${k}`);
	return { ns: k.slice(0, i), suffix: k.slice(i + 1) };
}

// Not sure if this is necessary to do first:
// npm i babel-plugin-syntax-dynamic-import -D
// Takes a key like ns:name and looks for the ${ns}.json file
// in the relevant locale directory. `name` is used to index
// within the file.
// TODO: should probably get this directory from config instead
// of hardcoding it
async function getMessage(i18nKey: string, lang: string): Promise<string> {
	const { ns, suffix } = splitKey(i18nKey);
	return await import(`../locales/${lang}/${ns}.json`).then(
		(m) => m.default[suffix],
	);
}

function MF2Trans(props: TransProps) {
	const [element, setElement] = useState<Element[]>();
	if (setElement) {
		useEffect(mf2TransFun(props, setElement));
		return <>{element}</>;
	}
	return <></>;
}

function mf2TransFun(
	props: TransProps,
	setElement: Dispatch<SetStateAction<Element[] | undefined>>,
) {
	return () => {
		// If i18nKey is supplied, read a message from the given namespace.
		// Otherwise, use our hardcoded message that gets converted to MF2.
		const convertedPromise = props.i18nKey
			? getMessage(props.i18nKey ?? props.fallback, props.locale)
			: Promise.resolve(props.defaultTrans ?? "");
		convertedPromise.then((jsxMessage) => {
			const converted = convertMessageSyntax(jsxMessage);
			const mf = new MessageFormat(converted, props.locale);
			const list = mf.formatToParts(props.values);
			const processed = ProcessPartsList(list);
			const contents = HetListToDOMTree(processed, props.components);
			setElement(contents);
		});
	};
}

export default function Demo() {
	return (
		<MF2Trans
			i18nKey="messages:default-message"
			locale="en-US"
			components={{
				// biome-ignore lint/a11y/useAnchorContent: content will be added by the formatter
				link: <a href="/" />,
				b: <b style={{ color: "purple" }} />,
				i: <i />,
				icon: <img src="https://imgs.xkcd.com/comics/purity.png" alt="dummy" />,
			}}
			values={{ count: 42.2 }}
		/>
	);
}
