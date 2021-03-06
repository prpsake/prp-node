# prp-node

_This repo is still a wip._

Macos excecutable based on NodeJS for use in a private productivity app, but can be used standalone. Currently it offers only one functionality, which is the creation of PDFs off a local html file. It makes use of [playwright](https://www.npmjs.com/package/playwright) for this purpose.
If converting (hosted) HTML to PDF is the only thing you're looking for, it probably makes more sense to implement something of your own so as not to depend on this little piece of work.

## Install and build
```
$ pnpm install
$ pnpm build
```

This outputs the binary file `prp-node` to the dist folder.

## Usage
```
$ ./dist/prp-node pdf --help
prp-node pdf

Create a pdf from a prp document template.

Options:
      --version          Show version number                           [boolean]
      --help             Show help                                     [boolean]
  -t, --templatedir      Absolute path to a template directory.
                                                             [string] [required]
  -d, --datafile         Absolute path to a data file.                  [string]
  -o, --outputdir        Absolute path to an output directory.
                                                             [string] [required]
  -n, --filename         Name of the output file.  [string] [default: "prp.pdf"]
  -f, --format           Format of the output file.     [string] [default: "A4"]
  -s, --waitforselector  CSS selector to wait for before pdf creation.
                                                      [string] [default: "body"]
      --html             Also output html version.
      --fonts            Relative path to the template font directory   [string]
      --images           Relative path to the template image directory  [string]
      --hostname         Server hostname with protocol.
                                          [string] [default: "http://localhost"]
      --hostpathname     Server host pathname            [string] [default: "/"]
```

The help suggests that it is meant to operate on a prp document template.
You can ignore this as it basically works on any webpage Chromium is able to render.

The only important thing besides what's shown in the help text: An `index.html` file is expected to be the entry file in the template directory.

## Notes

- Smaller builds: https://github.com/pnpm/pnpm/issues/881