module type PDF = {
  
  type args
  let create: args => Promise.t<string>
  
}



module PDF: PDF = {

  type t



  type args = {
    templatedir: string,
    datafile: string,
    outputdir: string,
    filename: string,
    format: string,
    html: bool,
    fonts: string,
    images: string,
    waitforselector: string,
    hostname: string,
    hostpathname: string,
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
    content: (. unit) => Promise.t<t>,
    pdf: (. pdfOptions) => Promise.t<unit>
  }



  type browser = {
    newPage: (. unit) => Promise.t<page>,
    close: (. unit) => Promise.t<unit>
  }



  @module("fs-extra")
  external outputFile
  : string => t => Promise.t<unit> = "outputFile"



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



  /* Helpers */

  let buildUrl =
    ( host: string
    , path: string
    , port: int
    ) =>
    j`$host:$port$path`



  /* Command */

  let create =
    (args: args) =>

    // start server and browser
    all2((
      Server.serve(),
      launch()
    ))

    ->then(
      (( server, browser )) => {
        let url = buildUrl(args.hostname, args.hostpathname, server.port)
        let routes = Js.Dict.empty()

        if args.datafile !== "" {
          Js.Dict.set(
            routes,
            "GET " ++ joinPath([ args.hostpathname, "data" ]),
            ( _: Server.req ) => 
            Server.respond.fromFile(. 
              args.datafile, 
              Js.Nullable.null, 
              Js.Nullable.null
            )
          )
        }

        Js.Dict.set(
          routes,
          "GET " ++ args.hostpathname,
          ( _: Server.req ) =>
          Server.respond.fromFile(. 
            joinPath([ args.templatedir, "index.html" ]),
            Js.Nullable.null, 
            Js.Nullable.return(#utf8)
          )
        )

        Js.Dict.set(
          routes,
          "GET *",
          ( req: Server.req ) =>
          Server.respond.fromFile(. 
            joinPath([ args.templatedir, req.url ]),
            Js.Nullable.null,
            Js.Nullable.return(#utf8)
          )
        )

        server.routes(. routes)
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
      page.waitForSelector(. args.waitforselector, { 
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
        path: joinPath([args.outputdir, args.filename]),
        format: args.format
      })->thenResolve(
        _ => ( browser, page )
      )
    )

    // optionally output html
    ->then(
      (( browser, page )) => {
        if args.html {
          let htmlPath = joinPath([args.outputdir, "html"])
          all(
            Js.Array.map(
              x =>
              Promise.make((resolve, _) => {
                resolve(. copy(
                  joinPath([args.templatedir, x]), 
                  joinPath([htmlPath, x])
                )->ignore)
              }),
              Js.Array.filter(x => x !== "", [
                args.fonts,
                args.images
              ])
            )
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
}