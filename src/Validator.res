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
  


let coerceString: Js.Nullable.t<string> => string = 
  x =>
  switch Js.Nullable.toOption(x) {
  | Some(x) =>
    switch Js.typeof(x) {
    | "string" => x
    | _ => ""
    }
  | None => ""
  }



let coerceBool: Js.Nullable.t<bool> => bool =
  x =>
  switch Js.Nullable.toOption(x) {
  | Some(x) =>
    switch Js.typeof(x) {
    | "boolean" => x
    | _ => false
    }
  | None => false
  }



let throwOnStringEmpty: string => string => string =
  msg =>
  x =>
  switch isStringNotEmpty(x) {
  | true => x
  | false => Js.Exn.raiseError(msg)
  }