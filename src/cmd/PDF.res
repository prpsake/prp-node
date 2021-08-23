/* PDF */

module type PDF = {
  
  type args
  let pdf: args => Promise.t<string>
  
}



module PDF: PDF = {

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



  @module("fs-extra")
  external outputFile
  : string => 'a => Promise.t<unit> = "outputFile"



  @module("fs-extra") 
  external copy
  : string => string => Promise.t<unit> = "copy"



  @module("path")
  @variadic
  external joinPath
  : array<string> => string = "join"



  /* Helpers */

  let buildUrl =
    ( host: string
    , path: string
    , port: int
    ) =>
    j`$host:$port$path`



  /* Command */

  let pdf = {
    open Promise

    (args: args) => {

      let templatePath = joinPath([ args.templatedir, "index.html" ])
      let dataFilePath = args.datafile
      let pathsToValidate = Js.Array.filter(
        Validator.isStringNotEmpty,
        [ templatePath
        , dataFilePath
        ]
      )

      // validate paths
      Validator.pathsExist(pathsToValidate)

      // start server and browser
      ->then(
        _ =>
        all2((
          Server.launch(),
          Browser.launch()
        ))
      )

      // set server routes and open browser 'tab'
      ->then(
        (( server, browser )) => {
          let url = buildUrl(args.hostname, args.hostpathname, server.port)

          if Validator.isStringNotEmpty(dataFilePath) {
            server.route(.
              "GET " ++ joinPath([ args.hostpathname, "data" ]),
              _ => 
              Server.respond.fromFile(. 
                dataFilePath, 
                Js.Nullable.null, 
                Js.Nullable.null
              )
            )
          }

          server.route(.
            "GET " ++ args.hostpathname,
            _ =>
            Server.respond.fromFile(. 
              templatePath,
              Js.Nullable.null, 
              Js.Nullable.return(#utf8)
            )
          )

          server.route(.
            "GET *",
            req =>
            Server.respond.fromFile(. 
              joinPath([ args.templatedir, req.url ]),
              Js.Nullable.null,
              Js.Nullable.return(#utf8)
            )
          )

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
                Js.Array.filter(
                  Validator.isStringNotEmpty,
                  [ args.fonts
                  , args.images
                  ]
                )
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
          _ => {
            resolve(
              Log
              .logDefault
              .replace(. "cmd", "pdf")
              .replace(. "msg", "created")
              .replace(. "color", Log.logColor(#green))
              .time(.).val
            )
          }
        )
      )

      ->catch(
        e => {
          let logError = 
            Log
            .logDefault
            .replace(. "cmd", "pdf")
            .replace(. "color", Log.logColor(#red))
            .time(.)
          
          switch e {
          | JsError(obj) =>
            switch Js.Exn.message(obj) {
            | Some(msg) =>
              logError
              .replace(. "msg", "failed : " ++ msg)
              .val
            | None =>
              logError
              .replace(. "msg", "failed : no message available (probably no js error value).")
              .val
            }
          // QUESTION: Custom errors? If so, match here.
          | _ =>
            logError
            .replace(. "msg", "failed : unknown error.")
            .val
          }->resolve
        }
      )

    }
  }
}