/* Server */

type server = {
  port: string,
  routes: (. {}) => unit
}



type fn = string => unit



@module("minikin")
@scope(("default", "default")) 
external run: () => Promise.t<server> = "server"



@module("minikin")
@scope("Response")
external fromFile: (. string) => () = "fromFile"



open Promise



let serve =
  fn =>
  run()
  ->then( 
    server => {
      let routes = fn(. fromFile)
      server.routes(. routes)
      server
    }->resolve
  )