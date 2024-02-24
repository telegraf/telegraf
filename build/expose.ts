import { readFileSync, writeFileSync } from 'fs'

const modules = process.argv.slice(2)

function write(module: string, script: string, types: string) {
  writeFileSync(`./${module}.js`, script)
  writeFileSync(`./${module}.d.ts`, types)
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

for (const module of modules) {
  write(
    module,
    `module.exports = require('./lib/${module}')\n`,
    `export * from './typings/${module}'\n`
  )

  pkg.exports[`./${module}`] = {
    types: `./${module}.d.ts`,
    default: `./${module}.js`,
  }

  const files = new Set(pkg.files)
  files.add(`${module}.*`)

  pkg.files = Array.from(files)
}

writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')

writeFileSync(
  '.eslintignore',
  modules.map((module) => `/${module}.*`).join('\n')
)
