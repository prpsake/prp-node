/* CLI */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'



const color = 
  { green: '\x1b[32m'
  , red: '\x1b[31m'
  , dim: '\x1b[2m'
  , reset: '\x1b[0m'
  }



 const log =
  val =>
  ({
    concat: other => log(val += other.val),
    replace: (str, repl) => log(val.replace(`%${str}`, repl)),
    cmd: cmd => log(val).replace('cmd', cmd),
    msg: msg => log(val).replace('msg', msg),
    color: color => log(val).replace('color', color),
    time: () => log(val).replace('time', new Date().toISOString()),
    log: () => console.log(log(val).time().val),
    val
  })



const logDefault = 
  log(
    [ `PRP${color.dim} %time`
    , `${color.reset}prp-node %cmd`
    , `%color%msg`
    ]
    .join(' : ')
    .concat(color.reset)
  )



const coerceNonEmtpyString =
  (cmd, param) =>
  arg => {
    if (arg !== '') return arg
    throw new Error(
      logDefault
      .cmd(cmd)
      .msg(`${param} : Argument must not be empty.`)
      .color(color.red)
      .time().val
    )
  }



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
        coerce: coerceNonEmtpyString('pdf', 'datafile')
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
        coerce: coerceNonEmtpyString('pdf', 'filename'),
        default: 'prp.pdf'
      },
      format: {
        type: 'string',
        demandOption: false,
        alias: 'f',
        describe: 'Format of the output file.',
        coerce: coerceNonEmtpyString('pdf', 'format'),
        default: 'A4'
      },
      waitforselector: {
        type: 'string',
        demandOption: false,
        alias: 's',
        describe: 'CSS selector to wait for before pdf creation.',
        coerce: coerceNonEmtpyString('pdf', 'waitforselector'),
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
        coerce: coerceNonEmtpyString('pdf', 'fonts'),
      },
      images: {
        type: 'string',
        demandOption: false,
        describe: 'Relative path to the template image directory',
        coerce: coerceNonEmtpyString('pdf', 'images'),
      },
      hostname: {
        type: 'string',
        demandOption: false,
        describe: 'Server hostname with protocol.',
        coerce: coerceNonEmtpyString('pdf', 'hostname'),
        default: 'http://localhost'
      },
      hostpathname: {
        type: 'string',
        demandOption: false,
        describe: 'Server host pathname',
        coerce: coerceNonEmtpyString('pdf', 'hostpathname'),
        default: '/'
      }
    },
    handler: args => 
      logDefault
      .cmd(args._[0])
      .msg('Creating pdf.')
      .color(color.green)
      .log()
  })
  .demandCommand(
    1,
    logDefault
    .cmd('<cmd>')
    .msg('You need at least one command before moving on.')
    .color(color.red)
    .time()
    .val
  )
  .help()
  .argv