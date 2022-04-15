/* Index */

import { fileURLToPath } from 'url'
import { CLI } from './CLI.js'
import { logDefault, logColor } from './Log.mjs';
import { PDF } from './cmd/PDF.mjs'



/* Helpers */

const isRunningFromCLI = 
  process.argv[1] === 
  fileURLToPath(import.meta.url).replace('/private', '')



const arrayFromObject =
  obj =>
  Object.entries(obj).flat()



const omitProp = 
  (obj, prop) =>
  ({ [prop]: _, ...rest } = obj, rest )



/* Commands */

const command = { pdf: PDF.pdf }



/* ESMv */

export const PRPNode = 
  async args_ =>
  {
    const args = CLI([
      args_.command, 
      ...arrayFromObject( omitProp(args_, 'command') )
    ])

    try {
      const output = await command[args._[0]](args)
      return output
  
    } catch (e) {
      const error = 
        logDefault
        .replace('cmd', args._[0])
        .replace('msg', e.message.replace('args._[0]', args._[0]))
        .replace('color', logColor('red'))

      return error.val
    }
  }



/* CLIv */

const PRPNodeCLI = 
  async args_ =>
  {
    const args = CLI(args_)

    try {
      const output = await command[args._[0]](args)
      console.log(output)
      process.exit(0)
  
    } catch (e) {
      const error = 
        logDefault
        .replace('cmd', args._[0])
        .replace('msg', e.message.replace('args._[0]', args._[0]))
        .replace('color', logColor('red'))

      error.log()
      process.exit(1)
    }
  }



if (isRunningFromCLI) {
  PRPNodeCLI(process.argv)
}