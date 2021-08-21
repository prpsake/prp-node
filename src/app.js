/* App */
import cli from './cli.js'
import { logDefault, logColor } from './Log.bs.js';
import { PDF } from './cmd/PDF.bs.js'



/* Commands */

const command = { pdf: PDF.pdf }



// QUESTION: work with exit codes
// https://nodejs.org/api/process.html#process_exit_codes
;(async () => {
  const args = cli()
  
  try {
    const output = await command[args._[0]](args)
    console.log(output)
    process.exit(0)

  } catch(e) {
    logDefault
    .replace('cmd', args._[0])
    .replace('msg', e.message.replace('args._[0]', args._[0]))
    .replace('color', logColor("red"))
    .log()

    process.exit(1)
  }
})()