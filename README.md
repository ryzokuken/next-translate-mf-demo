# next-translate-mf-demo

I had to do something like the following to get this to work.
Your mileage may vary.

* Clone https://github.com/catamorphism/next-translate
* Clone https://github.com/aralroca/next-translate-plugin
* Clone this repo

In this repo:
`cd demo`
`yarn`
This installs react, react-dom, @types/react, and @types/react-dom under demo/node-modules.
For each of these 4 packages:

- Go into the right subdir under node-modules/
- Type "yarn link"

Then go into next-translate:
1. yarn link react
2. yarn link react-dom
3. yarn link @types/react
4. yarn link @types/react-dom

Repeat the process in next-translate-plugin.

Then build next-translate and next-translate-plugin with `yarn`.

In next-translate/, `yarn link`. Then go back into this repo and type `yarn link next-translate`. Repeat the process for `next-translate-plugin`.

This is telling the two libraries to use the exact same versions of the React libraries that this demo app is using. Otherwise, the app ends up containing multiple versions of React and you get a runtime error about a null dispatcher.

To confirm that each of the 4 react libraries only has one version:
$ yarn why react
(repeating for each library)
You should see only one entry, whether you do that in this repo or in next-translate or next-translate-plugin.

Finally: return to the next-translate-mf-demo/demo directory and do:
yarn link next-translate
yarn link next-translate-plugin
npm run dev

In a browser, visit the URL:
http://localhost:3000/mftest
