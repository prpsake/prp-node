/* App */
import cli from './cli.js'
import { PDF } from './cmd/PDF.bs.js'



/* Commands */

const command = { pdf: PDF.create }



// QUESTION: work with exit codes
// https://nodejs.org/api/process.html#process_exit_codes
;(async () => {
  const args = cli()
  
  try {
    const output = await command[args._[0]](args)
    console.log(output)
    process.exit(0)

  } catch(e) {
    console.log(e)
    process.exit(1)
  }
})()