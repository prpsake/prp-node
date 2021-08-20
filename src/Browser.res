/* Browser */

type waitForSelectorOptions = {
  state: string,
  timeout: int
}



type pdfOptions = {
  path: string,
  format: string
}



type page<'a> = {
  goto: (. string) => Promise.t<unit>,
  waitForSelector: (. string, waitForSelectorOptions) => Promise.t<unit>,
  content: (. unit) => Promise.t<'a>,
  pdf: (. pdfOptions) => Promise.t<unit>
}



type browser<'a> = {
  newPage: (. unit) => Promise.t<page<'a>>,
  close: (. unit) => Promise.t<unit>
}



@module("playwright")
@scope("chromium")
external launch
: unit => Promise.t<browser<'a>> = "launch"



let launch = launch