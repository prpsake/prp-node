type rec log =
  {
    concat: log => log,
    replace: (. string, string) => log,
    time: (. unit) => log,
    log: unit => unit,
    val: string
  }



let logColor = 
  { "green": "\x1b[32m"
  , "red": "\x1b[31m"
  , "dim": "\x1b[2m"
  , "reset": "\x1b[0m"
  }



let rec log: string => log =
  val =>
  {
    concat: other => log(val ++ other.val),
    replace: (. old, new) => log(Js.String2.replace(val, j`%$old`, new)),
    time: (.) => log(val).replace(. "time", Js.Date.toISOString(Js.Date.make())),
    log: () => Js.log(log(val).time(.).val),
    val
  }



let logDefault: log = 
  log(
    Js.Array.joinWith(" : ",
      [ `PRP${logColor["dim"]} %time`
      , `${logColor["reset"]}prp-node %cmd`
      , `%color%msg${logColor["reset"]}`
      ]
    )
  )