import { outputFile } from 'fs-extra'
import { join as joinPath } from 'path'
import { chromium } from 'playwright'



import { serve } from '../server.js';



/* Helpers */

const mergeOptions =
  options =>
  ({
    value: 'created',
    ...options
  })



const buildUrl =
  ({ host, path }) =>
  ({ port }) =>
  `${host}:${port}${path}`



/* Command */

export const pdf = 
  options =>
  async (args, opts = mergeOptions(options)) => {



  // start server and browser
  const server = 
    await serve(resp => 
    ({
      [`GET ${path}`]:                    () => resp.fromFile(joinPath(template, 'index.html')),
      [`GET ${joinPath(path, 'data')}`]:  () => resp.fromFile(data, null, null),
      "GET *":                            req => resp.fromFile(joinPath(template, req.url))
    }))

  const browser = await chromium.launch()



  // instruct browser
  const page = await browser.newPage()
  await page.goto(buildUrl(args, server))
  await page.waitForSelector(args.selector, { state: 'attached', timeout: 5000 })



  // output optional html
  if (html) {

    // resolve paths
    const outputHtmlPath = joinPath(args.output, 'html')



    // output rendered html file
    const content = await page.content()
    await outputFile(
      joinPath(outputHtmlPath, 'index.html'), 
      content
    )
    


    // copy optional assets
    if (args.fonts) {
      copyDir(
        joinPath(args.template, args.fonts), 
        joinPath(outputHtmlPath, args.fonts)
      )
    }

    if (args.images) {
      copyDir(
        joinPath(args.template, args.images), 
        joinPath(outputHtmlPath, args.images)
      )
    }
  }



  // output pdf
  await page.pdf({ path: joinPath(args.output, args.filename), format: args.format })



  // done
  await browser.close()
  return opts.value
}



export default { pdf }