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
    launch()->thenResolve( 
      browser => ( browser, server.port )
    )
  )

  // open a new tab
  ->then(
    (( browser, port )) => {
      let url = Helpers.buildUrl(args.host, args.path, port)
      browser.newPage(.)->thenResolve(
        page => ( browser, page, url )
      )
    }
  )

  // visit url
  ->then(
    (( browser, page, url )) =>
    page.goto(. url)->thenResolve(
      _ => ( browser, page )
    )
  )

  // wait for page to load
  ->then(
    (( browser, page )) =>
    page.waitForSelector(. args.selector, { 
      state: "attached", 
      timeout: 5000 
    })->thenResolve( 
      _ => ( browser, page )
    )
  )

  // generate pdf
  ->then(
    (( browser, page )) =>
    page.pdf(. {
      path: joinPath([args.output, args.filename]),
      format: args.format
    })->thenResolve(
      _ => ( browser, page )
    )
  )

  // optionally output html
  ->then(
    (( browser, page )) => {
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
        ->then( _ => page.content(.) )
        ->thenResolve(
          content =>
          outputFile(
            joinPath([htmlPath, "index.html"]),
            content
          )
        )
        ->thenResolve( _ => browser )
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

  ->catch(
    _ => {
      resolve("failure")
    }
  )