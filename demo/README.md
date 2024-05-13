This demo is a [Next.js](https://nextjs.org/) project. It aims to provide functionality akin to [next-translate](https://github.com/aralroca/next-translate) on top of the MessageFormat 2 JavaScript implementation.

## Getting Started

### Install dependencies

```bash
npm install
```

### Running the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Editing pages

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file. Start by reading the `export default function Demo()` at the end of the file.

### Message data

The demo reads messages in JSX format stored in JSON files. It converts the message to MF2 and uses the MF2 polyfill to format the result.

An example data file is stored under `locales/en-US/`. To try using different files, edit the `i18nkey` attribute in the `MF2Trans` component in `pages/index.tsx`. For example, it currently has the `i18nkey` set to "messages:default-message". This loads the file `locales/en-US/messages.json` and selects the `default-message` message defined in that file. Other directories for different locales could be added under `locales/`.

You can also embed a literal message in `pages/index.tsx` by removing the `i18nkey` attribute and adding a `message` attribute, which takes a literal string that's a message in JSX format.
