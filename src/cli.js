/* CLI */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { logDefault, logColor } from './Log.bs.js';



const coerceNonEmtpyString =
  (cmd, param) =>
  arg => {
    if (arg !== '') return arg
    throw new Error(
      logDefault
      .replace('cmd', cmd)
      .replace('msg', `${param} : Argument must not be empty.`)
      .replace('color', logColor.red)
      .time().val
    )
  }



const coerceString = arg => arg || ""



const coerceBoolean = arg => !!arg



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
        coerce: coerceNonEmtpyString('pdf', 'templatedir')
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
        coerce: coerceNonEmtpyString('pdf', 'outputdir')
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
        coerce: coerceBoolean
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
      .replace('msg', 'Creating pdf.')
      .replace('color', logColor.green)
      .log()
  })
  .demandCommand(
    1,
    logDefault
    .replace('cmd', '<cmd>')
    .replace('msg', 'You need at least one command before moving on.')
    .replace('color', logColor.red)
    .time().val
  )
  .help()
  .argv