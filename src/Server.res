/* Server */

type headers = array<(string, string)>



type responseOptions = 
  { 
    statusCode: Js.Nullable.t<int>
  , statusMessage: Js.Nullable.t<string>
  , headers: Js.Nullable.t<headers>
  , trailers: Js.Nullable.t<headers>
  }



type encoding = 
  [
    #utf8
  | #binary
  | #hex
  | #ascii
  | #base64
  | #latin1
  ]



type rec response = {
 fromFile: (.
    string, 
    Js.Nullable.t<responseOptions>, 
    Js.Nullable.t<encoding>
  ) => response
}



type req = { url: string }



type routes = Js.Dict.t<req => response>



type server = 
  {
    port: int
  , routes: (. routes) => unit
  }



@module("minikin")
@scope(("default", "default")) 
external server
: unit => Promise.t<server> = "server"



@module("minikin")
external response
: response = "Response"



let serve = server
let respond = response