type args = {
  template: string,
  data: string,
  output: string,
  filename: string,
  format: string,
  html: bool,
  fonts: string,
  images: string,
  selector: string,
  host: string,
  path: string,
}



type waitForSelectorOptions = {
  state: string,
  timeout: int
}



type pdfOptions = {
  path: string,
  format: string
}



type page = {
  goto: (. string) => Promise.t<unit>,
  waitForSelector: (. string, waitForSelectorOptions) => Promise.t<unit>,
  content: (. unit) => Promise.t<string>,
  pdf: (. pdfOptions) => Promise.t<unit>
}



type browser = {
  newPage: (. unit) => Promise.t<page>,
  close: (. unit) => Promise.t<unit>
}



@module("fs-extra")
external outputFile
: string => string => Promise.t<unit> = "outputFile"



@module("fs-extra") 
external copy
: string => string => Promise.t<unit> = "copy"



@module("path")
@variadic
external joinPath
: array<string> => string = "join"



@module("playwright")
@scope("chromium")
external launch
: unit => Promise.t<browser> = "launch"



open Promise



/* Command */

let pdf =
  (args: args) =>

  // start server
  Server.serve(
    (. fromFile) =>
    Js.Dict.fromList(list{
      ( "GET " ++ args.path,
        ( _: Server.req ) =>
        fromFile(. joinPath([ args.template, "index.html" ]) )
      ),
      ( "GET " ++ joinPath([ args.path, "data" ]),
        ( _: Server.req ) => 
        fromFile(. args.data )
      ),
      ( "GET *",
        ( req: Server.req ) =>
        fromFile(. joinPath([ args.template, req.url ]))
      )
    })
  )

  // start browser
  ->then(
    server =>
    launch()->then( 
      browser => ( browser, server.port )->resolve
    )
  )

  // open a new tab
  ->then(
    (( browser, port )) => {
      let url = Helpers.buildUrl(args.host, args.path, port)
      browser.newPage(.)->then(
        page => ( page, url, browser )->resolve
      )
    }
  )

  // visit url
  ->then(
    (( page, url, browser )) =>
    page.goto(. url)->then(
      _ => ( page, browser )->resolve
    )
  )

  // wait for page to load
  ->then(
    (( page, browser )) =>
    page.waitForSelector(. args.selector, { 
      state: "attached", 
      timeout: 5000 
    })->then( 
      _ => ( page, browser )->resolve
    )
  )

  // generate pdf
  ->then(
    (( page, browser )) =>
    page.pdf(. {
      path: joinPath([args.output, args.filename]),
      format: args.format
    })->then(
      _ => (page, browser)->resolve
    )
  )

  // optionally output html
  ->then(
    (( page, browser )) => {
      if args.html {
        let htmlPath = joinPath([args.output, "html"])
        all(Js.Array.map(
          x =>
          Promise.make((resolve, _) => {
            resolve(. copy(
              joinPath([args.template, x]), 
              joinPath([htmlPath, x])
            )->ignore)
          }),
          Js.Array.filter(x => x != "", [
            args.fonts,
            args.images
          ]))
        )
        ->then( 
          _ => 
          page.content(.)->then( content => content->resolve )
        )
        ->then(
          content =>
          outputFile(
            joinPath([htmlPath, "index.html"]),
            content
          )
        )
        ->then(
          _ => browser->resolve
        )
      } else {
        browser->resolve
      }
    }
  )

  // close the browser
  ->then(
    browser => 
    browser.close(.)->then(
      _ => "success"->resolve
    )
  )


//   // output optional html
//   if (html) {

//     // resolve paths
//     const outputHtmlPath = joinPath(args.output, 'html')



//     // output rendered html file
//     const content = await page.content()
//     await outputFile(
//       joinPath(outputHtmlPath, 'index.html'), 
//       content
//     )
    


//     // copy optional assets
//     if (args.fonts) {
//       copyDir(
//         joinPath(args.template, args.fonts), 
//         joinPath(outputHtmlPath, args.fonts)
//       )
//     }

//     if (args.images) {
//       copyDir(
//         joinPath(args.template, args.images), 
//         joinPath(outputHtmlPath, args.images)
//       )
//     }
//   }