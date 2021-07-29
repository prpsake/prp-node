/* CLI */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'



export default () =>
  yargs(hideBin(process.argv))
  .scriptName('prp-node')
  .usage('$0 <cmd> [args]')
  .showHelpOnFail(false, "use --help for available options")
  .command([ 'pdf',
      // '[template]',
      // '[data]',
      // '[output]',
      // '[filename]',
      // '[format]',
      // '[html]',
      // '[fonts]',
      // '[images]',
      // '[selector]',
      // '[host]',
      // '[path]'

    ].join(' '), '', yargs => {
    // yargs.positional('template', {
    //   type: 'string',
    //   describe: 'absolute path to the template folder',
    // })
    // yargs.positional('data', {
    //   type: 'string',
    //   describe: 'absolute path to the data file',
    // })
    // yargs.positional('output', {
    //   type: 'string',
    //   describe: 'absolute path to an output folder',
    // })
    // yargs.positional('filename', {
    //   type: 'string',
    //   default: 'prp.pdf',
    //   describe: 'name of the generated pdf',
    // })
    // yargs.positional('format', {
    //   type: 'string',
    //   default: 'A4',
    //   describe: 'din format of the generated pdf',
    // })
    // yargs.positional('html', {
    //   type: 'boolean',
    //   default: false,
    //   describe: 'also output html',
    // })
    // yargs.positional('fonts', {
    //   type: 'string',
    //   describe: 'w/ html option: relative path to the template fonts folder',
    // })
    // yargs.positional('images', {
    //   type: 'string',
    //   describe: 'w/ html option: relative path to the template images folder',
    // })
    // yargs.positional('selector', {
    //   type: 'string',
    //   default: 'body',
    //   describe: 'css selector to wait for',
    // })
    // yargs.positional('host', {
    //   type: 'string',
    //   default: 'http://localhost',
    //   describe: 'server hostname with protocol',
    // })
    // yargs.positional('path', {
    //   type: 'string',
    //   default: '/',
    //   describe: 'server pathname',
    // })

  }).help().argv