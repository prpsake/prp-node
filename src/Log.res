/* Log */

type rec log =
  { 
    concat: log => log
  , replace: (. string, string) => log
  , time: (. unit) => log
  , log: unit => log
  , val: string
  }



type segments =
  | Default(
      {
        org: string
      , time: string
      , ctx: string
      , msg: string
      }
    )



let delimiter = " :: " 



// NB: warning for unicode string literal in normal quote ""
// SOURCE: https://github.com/rescript-lang/rescript-compiler/issues/3691
let logColor = 
  name =>
  switch name {
  | #green => `\x1b[32m`
  | #red => `\x1b[31m`
  | #dim => `\x1b[2m`
  | #reset => `\x1b[0m`
  }



let rec log: string => log =
  val =>
  {
    concat: other => log(val ++ other.val),
    replace: (. old, new) => log(Js.String2.replace(val, j`%$old`, new)),
    time: (.) => log(val).replace(. "time", Js.Date.toISOString(Js.Date.make())),
    log: () => {
      let stdout = log(val).time(.).val
      Js.log(stdout)
      log(stdout)
    },
    val
  }



let parseDefault: string => segments =
  string => {
    let segments = Js.String2.split(string, delimiter)
    Default({
      org: segments[0]
    , time: segments[1]
    , ctx: segments[2]
    , msg: segments[3]
    })
  }



let logDefault: log = 
  log(
    Js.Array.joinWith(delimiter,
      [ `PRP`
      , `${logColor(#dim)}%time`
      , `${logColor(#reset)}prp-node %cmd`
      , `%color%msg${logColor(#reset)}`
      ]
    )
  )