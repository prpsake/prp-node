import test from 'ava'
import sinon from 'sinon'
import execa from 'execa'



import cmd from './cmd/pdf.js'



const setupStubs =
  value =>
  [ sinon
    .stub(cmd, 'pdf')
    .returns(value),
  ];



test.serial( 'desc me',

  async t => {

    //s
    const value = 'path/to/rome'
    const stubs = setupStubs(value);

    //e
    const result = await execa.node('src/app', [
      'pdf'
      // '--template', 'some/path',
      // '--data', 'some/path.json',
      // '--output', 'some/path',
      // '--filename', 'some-file-name.pdf',
      // '--format', 'A4',
      // '--html', true,
      // '--fonts', 'some/path',
      // '--images', 'some/path',
      // '--selector', '#some-selector',
      // '--host', 'some://host',
      // '--path', '/'
    ])

    //v
    t.deepEqual(result.stdout, value);

    //td
    stubs.map(x => x.restore());
  }
);