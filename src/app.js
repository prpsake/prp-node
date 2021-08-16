// import { pdf } from './cmd/PDF.bs.js'



// pdf({
//   template: '/Users/jerome/projects/PRP/prp-node/testweiu',
//   data: '',
//   output: '/Users/jerome/projects/PRP/prp-node/test',
//   filename: 'kitty.pdf',
//   format: 'A4',
//   html: true,
//   fonts: '',
//   images: '',
//   selector: 'body',
//   host: 'localhost',
//   path: '/',
// })



/* App */
import cli from './cli.js'
import { pdf } from './cmd/PDF.bs.js'



/* Commands */

const command = { pdf }



// QUESTION: work with exit codes
// https://nodejs.org/api/process.html#process_exit_codes
;(async () => {
  const args = cli()
  
  console.log(args)
  // try {
  //   const output = await command[args._[0]](args)
  //   console.log(output)
  //   process.exit(0)

  // } catch(e) {
  //   console.log(e)
  //   process.exit(1)
  // }
})()