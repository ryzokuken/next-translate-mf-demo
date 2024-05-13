const withMDX = require('@next/mdx')()
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

console.log('Webpack version', require('webpack').version)

module.exports = withBundleAnalyzer(withMDX())
