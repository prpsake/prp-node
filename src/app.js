const fs = require('fs-extra')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { chromium } = require('playwright')
const Server = require('minikin')



const args = 
  yargs(hideBin(process.argv))
  .scriptName('prp-node')
  .usage('$0 <cmd> [args]')
  .showHelpOnFail(false, "use --help for available options")
  .command('pdf [template] [data] [output] [filename] [format]', '', yargs => {
    yargs.positional('template', {
      type: 'string',
      describe: 'absolute path to the template folder',
    }),
    yargs.positional('data', {
      type: 'string',
      describe: 'absolute path to the data file',
    }) 
    yargs.positional('output', {
      type: 'string',
      describe: 'absolute path to an output folder',
    }),
    yargs.positional('filename', {
      type: 'string',
      default: 'prp.pdf',
      describe: 'name of the generated pdf',
    })
    yargs.positional('format', {
      type: 'string',
      default: 'A4',
      describe: 'din format of the generated pdf',
    })
  })
  .help()
  .argv



const command = {
  pdf: async (args, opts = {}) => {
    const options = {
      serverPath: '/',
      value: 'created',
      waitForSelector: 'the-app[ready-preview]',
      ...opts
    }

    const server = await Server.default.server()
    const browser = await chromium.launch()

    await fs.copy(args.input, `${args.output}/html`)

    server.routes({
      [`GET ${options.serverPath}`]: () => Server.Response.fromFile(`${args.output}/html/index.html`),
      [`GET ${options.serverPath}/data`]: () => Server.Response.fromFile(`${args.output}/data.json`),
      "GET *": req => Server.Response.fromFile(`${args.output}/html${req.url}`)
    })

    const page = await browser.newPage()

    await page.goto(`http://localhost:${server.port}${options.serverPath}}`)
    await page.waitForSelector(options.waitForSelector)

    const content = await page.content()

    await fs.outputFile(`${args.output}/html/index.html`, content)

    await page.pdf({ path: `${args.output}/${args.filename}`, format: args.format })
    await browser.close()

    return options.value
  }
}



// QUESTION: work with exit codes
// https://nodejs.org/api/process.html#process_exit_codes
;(async () => {
  try {
    const output = await command[args._[0]](args)

    console.log(output)
    process.exit()
  
  } catch(e) {
    console.log(e)
    process.exit()
  }
})()