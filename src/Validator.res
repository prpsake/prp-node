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
      Js.Array.filter(x => x !== "", paths)
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
  