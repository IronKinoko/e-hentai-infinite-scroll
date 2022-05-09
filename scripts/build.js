const pkg = require('../package.json')
const banner = `// ==UserScript==
// @name         ${pkg.name}
// @namespace    https://github.com/IronKinoko/e-hentai-infinite-scroll
// @version      ${pkg.version}
// @description  ${pkg.description}
// @author       IronKinoko
// @match        https://exhentai.org/s/*
// @match        https://exhentai.org/g/*
// @grant        none
// ==/UserScript==
`

const [watch] = process.argv.slice(2)

require('esbuild')
  .build({
    entryPoints: ['src/index.ts'],
    watch: watch
      ? {
          onRebuild(error, result) {
            if (error) console.error('watch build failed:', error)
            else console.log('watch build succeeded')
          },
        }
      : false,
    bundle: true,
    format: 'iife',
    outfile: 'index.user.js',
    legalComments: 'inline',
    banner: {
      js: banner,
    },
  })
  .then(() => {
    console.log('done')
  })
