// Taken from next-translate example.complex
module.exports = {
  locales: ['__default', 'en', 'fr'],
  defaultLocale: '__default',
  localesToIgnore: ['__default'],
  pages: {
    '*': ['common'],
    '/404': ['error'],
    '/': ['home'],
    '/dashboard': ['home'],
    'rgx:^/more-examples': ['more-examples'],
  },
  loadLocaleFrom: async (locale, namespace) =>
    import(`./src/translations/${namespace}_${locale}`).then((r) => r.default),
}
