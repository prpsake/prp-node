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



let isStringEmpty: string => bool = x => x === ""



let isStringNotEmpty: string => bool =
   x => 
   Js.typeof(x) === "string" &&
   Js.String2.length(x) > 0
  


let coerceString: option<string> => string = 
  x =>
  switch x {
  | Some(x) => j`$x`
  | None => ""
  }



let coerceBool: option<bool> => bool =
  x =>
  switch x {
  | Some(_) => true
  | None => false
  }



let throwOnEmtpyString: string => string => string =
  msg =>
  x =>
  if isStringNotEmpty(x) {
    x
  } else {
    Js.Exn.raiseError(msg)
  }