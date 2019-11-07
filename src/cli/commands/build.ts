import { Command, flags } from '@oclif/command'
import * as fs from 'fs'
import * as path from 'path'
import {
  compile,
  findProjectDir,
  getTranspiledPath,
  readTsConfig,
} from '../../utils'
import { generateArtifacts } from '../../utils/artifact-generation'

export class Build extends Command {
  static description = 'Build a production-ready server'

  static examples = [`$ pumpkins build`]

  static flags = {
    entrypoint: flags.string({ char: 'e' }),
  }

  static args = []

  async run() {
    const { flags } = this.parse(Build)
    const tsConfig = readTsConfig()
    const { error, entrypoint } = generateArtifacts(tsConfig, flags.entrypoint)
    const projectDir = findProjectDir()
    const transpiledEntrypointPath = getTranspiledPath(
      projectDir,
      entrypoint,
      tsConfig.options.outDir!
    )

    if (error) {
      this.error(error, { exit: 1 })
    }

    compile(tsConfig.fileNames, tsConfig.options)

    const entryPointContent = fs
      .readFileSync(transpiledEntrypointPath)
      .toString()
    const wrapperContent = `
process.env.PUMPKINS_SHOULD_GENERATE_ARTIFACTS = "false"

require("./__index.js")
    `

    fs.writeFileSync(
      path.join(path.dirname(transpiledEntrypointPath), '__index.js'),
      entryPointContent
    )
    fs.writeFileSync(transpiledEntrypointPath, wrapperContent)

    this.log('🎃  Pumpkins server successfully compiled!')
  }
}