/* Validator */

type filehandle = {
  close: unit => Promise.t<unit>
}



@module("fs")
@scope("promises")
external open_
: string => string => Promise.t<filehandle> = "open"




let pathsExist = {
  open Promise

  (paths: array<string>) =>
  all(
    Js.Array.map(
      path =>
      open_(path, "r"),
      paths
    )
  )
  ->then(
    filehandles =>
    all(
      Js.Array.map(
        fh => fh.close(),
        filehandles
      )
    )
  )
}



let isStringEmpty: string => bool = 
  x =>
  Js.Types.test(x, String) && 
  Js.String2.length(x) === 0



let isStringNotEmpty: string => bool =
  x =>
  Js.Types.test(x, String) && 
  Js.String2.length(x) > 0



let coerceString: string => string = 
  x =>
  switch Js.Types.classify(x) {
  | JSString(x) => x
  | _ =>  ""
  }



let coerceBool: bool => bool =
  x =>
  switch Js.Types.classify(x) {
  | JSTrue => true
  | JSString(_) => true
  | _ => false
  }



let throwOnStringEmpty: string => string => string =
  msg =>
  x =>
  switch isStringNotEmpty(x) {
  | true => x
  | false => Js.Exn.raiseError(msg)
  }