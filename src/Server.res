/* Server */

type t



type req = { url: string }



type routes = Js.Dict.t<req => t>



type server = {
  port: int,
  routes: (. routes) => unit
}



type fn = ((. string) => t) => routes



@module("minikin")
@scope(("default", "default")) 
external run
: unit => Promise.t<server> = "server"



@module("minikin")
@scope("Response")
external fromFile
: (. string) => t = "fromFile"



open Promise



let serve =
  fn =>
  run()
  ->then( 
    server => {
      let routes = fn(. fromFile)
      server.routes(. routes)
      server->resolve
    }
  )