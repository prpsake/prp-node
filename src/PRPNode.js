/* App */
import CLI from './CLI.js'
import { logDefault, logColor } from './Log.bs.js';
import { PDF } from './cmd/PDF.bs.js'



/* Commands */

const command = { pdf: PDF.pdf }



/* Helpers */

const arrayFromObject =
  obj =>
  Object.entries(obj).flat()



/* App */

// QUESTION: work with exit codes
// https://nodejs.org/api/process.html#process_exit_codes
export const PRPNode = 
  async (args_ = {}, mode = 'import') =>
  {
    const args = CLI(arrayFromObject(args_))
    try {
      const output = await command[args._[0]](args)

      if (mode === 'import') {
        return output

      } else if ( mode === 'cli' ) {
        console.log(output)
      }

      process.exit(0)
  
    } catch(e) {
      const error = 
        logDefault
        .replace('cmd', args._[0])
        .replace('msg', e.message.replace('args._[0]', args._[0]))
        .replace('color', logColor('red'))

      if (mode === 'import') {
        return error.val

      } else if (mode === 'cli') {
        error.log()
      }

      process.exit(1)
    }
  }



PRPNode({}, 'cli')