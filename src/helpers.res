/* Helpers */

@module("fs-extra") 
external copy: string => string => Promise.t<unit> = "copy"



open Promise



let copyDir = 
  ( src: string
  , dest: string
  ) =>
  copy(src, dest)
  ->then( () => Ok("ok")->resolve )
  ->catch( e => Error(e)->resolve )
