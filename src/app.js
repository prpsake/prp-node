const fs = require('fs-extra')
const path = require('path')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { chromium } = require('playwright')
const Server = require('minikin')



const args = 
  yargs(hideBin(process.argv))
  .scriptName('prp-node')
  .usage('$0 <cmd> [args]')
  .showHelpOnFail(false, "use --help for available options")
  .command([ 'pdf', 
      '[template]',
      '[data]',
      '[output]',
      '[filename]',
      '[format]',
      '[html]',
      '[fonts]',
      '[images]',
      '[selector]',
      '[host]',
      '[path]'

    ].join(' '), '', yargs => {
    yargs.positional('template', {
      type: 'string',
      describe: 'absolute path to the template folder',
    })
    yargs.positional('data', {
      type: 'string',
      describe: 'absolute path to the data file',
    })
    yargs.positional('output', {
      type: 'string',
      describe: 'absolute path to an output folder',
    })
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
    yargs.positional('html', {
      type: 'boolean',
      default: false,
      describe: 'also output html',
    })
    yargs.positional('fonts', {
      type: 'string',
      describe: 'w/ html option: relative path to the template fonts folder',
    })
    yargs.positional('images', {
      type: 'string',
      describe: 'w/ html option: relative path to the template images folder',
    })
    yargs.positional('selector', {
      type: 'string',
      default: 'body',
      describe: 'css selector to wait for',
    })
    yargs.positional('host', {
      type: 'string',
      default: 'http://localhost',
      describe: 'server hostname with protocol',
    })
    yargs.positional('path', {
      type: 'string',
      default: '/',
      describe: 'server pathname',
    })

  }).help().argv



/* Helpers */

const copyDir = async (src, dest) => {
  const existsSrc = await fs.pathExists(src)
  if (existsSrc) await fs.copy(src, dest)
}



/* Commands */

const command = {
  pdf: async (args, opts = {}) => {

    // merge options with defaults
    const options = {
      value: 'created',
      ...opts
    }



    // resolve mandatory paths
    const dataPath = path.resolve(args.path, 'data')
    const templateEntryFilePath = path.resolve(args.template, 'index.html')
    const outputPdfPath = path.resolve(args.output, args.filename)



    // start server and browser
    const server = await Server.default.server()
    const browser = await chromium.launch()



    // instruct server
    server.routes({
      [`GET ${args.path}`]: () => Server.Response.fromFile(templateEntryFilePath),
      [`GET ${dataPath}`]: () => Server.Response.fromFile(args.data, null, null),
      "GET *": req => Server.Response.fromFile(path.resolve(args.template, req.url))
    })



    // instruct browser
    const page = await browser.newPage()
    await page.goto(`${args.host}:${server.port}${args.path}`)
    await page.waitForSelector(args.selector, { state: 'attached', timeout: 5000 })



    // output optional html
    if (html) {

      // resolve paths
      const outputHtmlPath = path.resolve(args.output, 'html')
      const outputHtmlFilePath = path.resolve(outputHtmlPath, 'index.html')



      // output rendered html file
      const content = await page.content()
      await fs.outputFile(outputHtmlFilePath, content)
      


      // copy optional assets
      if (args.fonts) {
        copyDir(
          path.resolve(args.template, args.fonts), 
          path.resolve(outputHtmlPath, args.fonts)
        )
      }
  
      if (args.images) {
        copyDir(
          path.resolve(args.template, args.images), 
          path.resolve(outputHtmlPath, args.images)
        )
      }
    }



    // output pdf
    await page.pdf({ path: outputPdfPath, format: args.format })



    // done
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
 
  } catch(e) {
    console.log(e)

  } finally {
    process.exit()
  }
})()