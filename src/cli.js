/* CLI */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { throwOnEmtpyString, coerceString, coerceBool } from './Validator.bs.js'
import { logDefault, logColor } from './Log.bs.js';



export default () =>
  yargs(hideBin(process.argv))
  .scriptName('prp-node')
  .usage('$0 <cmd> [args]')
  .showHelpOnFail(false, "use --help for available options")
  .command({
    command: 'pdf',
    describe: 'Create a pdf from a prp document template.',
    builder: {
      templatedir: {
        type: 'string',
        demandOption: true,
        alias: 't',
        describe: 'Absolute path to a template directory.',
        coerce: 
          arg => 
          throwOnEmtpyString(
            logDefault
            .replace('cmd', 'pdf')
            .replace('msg', 'templatedir : Argument must not be empty.')
            .replace('color', logColor("red"))
            .time().val,
            arg
          )
      },
      datafile: {
        type: 'string',
        demandOption: false,
        alias: 'd',
        describe: 'Absolute path to a data file.',
        coerce: coerceString
      },
      outputdir: {
        type: 'string',
        demandOption: true,
        alias: 'o',
        describe: 'Absolute path to a output directory.',
        coerce: 
          arg => 
          throwOnEmtpyString(
            logDefault
            .replace('cmd', 'pdf')
            .replace('msg', 'outputdir : Argument must not be empty.')
            .replace('color', logColor("red"))
            .time().val,
            arg
          )
      },
      filename: {
        type: 'string',
        demandOption: false,
        alias: 'n',
        describe: 'Name of the output file.',
        default: 'prp.pdf'
      },
      format: {
        type: 'string',
        demandOption: false,
        alias: 'f',
        describe: 'Format of the output file.',
        default: 'A4'
      },
      waitforselector: {
        type: 'string',
        demandOption: false,
        alias: 's',
        describe: 'CSS selector to wait for before pdf creation.',
        default: 'body'
      },
      html: {
        demandOption: false,
        describe: 'Also output html version.',
        coerce: coerceBool
      },
      fonts: {
        type: 'string',
        demandOption: false,
        describe: 'Relative path to the template font directory',
        coerce: coerceString
      },
      images: {
        type: 'string',
        demandOption: false,
        describe: 'Relative path to the template image directory',
        coerce: coerceString
      },
      hostname: {
        type: 'string',
        demandOption: false,
        describe: 'Server hostname with protocol.',
        default: 'http://localhost'
      },
      hostpathname: {
        type: 'string',
        demandOption: false,
        describe: 'Server host pathname',
        default: '/'
      }
    },
    handler: args => 
      logDefault
      .replace('cmd', args._[0])
      .replace('msg', 'creating')
      .replace('color', logColor("green"))
      .log()
  })
  .demandCommand(
    1,
    logDefault
    .replace('cmd', '<cmd>')
    .replace('msg', 'You need at least one command before moving on.')
    .replace('color', logColor("red"))
    .time().val
  )
  .help()
  .argv