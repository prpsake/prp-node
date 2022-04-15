// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Log from "../Log.mjs";
import * as Path from "path";
import * as Server from "../Server.mjs";
import * as Browser from "../Browser.mjs";
import * as $$Promise from "../Promise.mjs";
import * as FsExtra from "fs-extra";
import * as Validator from "../Validator.mjs";

function buildUrl(host, path, port) {
  return "" + host + ":" + port + path;
}

function pdf(args) {
  var templatePath = Path.join(args.templatedir, "index.html");
  var dataFilePath = args.datafile;
  var pathsToValidate = [
      templatePath,
      dataFilePath
    ].filter(Validator.isStringNotEmpty);
  return $$Promise.$$catch(Validator.pathsExist(pathsToValidate).then(function (param) {
                              return Promise.all([
                                          Server.launch(undefined),
                                          Browser.launch(undefined)
                                        ]);
                            }).then(function (param) {
                            var browser = param[1];
                            var server = param[0];
                            var url = buildUrl(args.hostname, args.hostpathname, server.port);
                            if (Validator.isStringNotEmpty(dataFilePath)) {
                              server.route("GET " + Path.join(args.hostpathname, "data"), (function (param) {
                                      return Server.respond.fromFile(dataFilePath, null, null);
                                    }));
                            }
                            server.route("GET " + args.hostpathname, (function (param) {
                                    return Server.respond.fromFile(templatePath, null, "utf8");
                                  }));
                            server.route("GET *", (function (req) {
                                    return Server.respond.fromFile(Path.join(args.templatedir, req.url), null, "utf8");
                                  }));
                            return browser.newPage().then(function (page) {
                                        return [
                                                browser,
                                                page,
                                                url
                                              ];
                                      });
                          }).then(function (param) {
                          var page = param[1];
                          var browser = param[0];
                          return page.goto(param[2]).then(function (param) {
                                      return [
                                              browser,
                                              page
                                            ];
                                    });
                        }).then(function (param) {
                        var page = param[1];
                        var browser = param[0];
                        return page.waitForSelector(args.waitforselector, {
                                      state: "attached",
                                      timeout: 5000
                                    }).then(function (param) {
                                    return [
                                            browser,
                                            page
                                          ];
                                  });
                      }).then(function (param) {
                      var page = param[1];
                      var browser = param[0];
                      return page.pdf({
                                    path: Path.join(args.outputdir, args.filename),
                                    format: args.format
                                  }).then(function (param) {
                                  return [
                                          browser,
                                          page
                                        ];
                                });
                    }).then(function (param) {
                    var browser = param[0];
                    if (!args.html) {
                      return Promise.resolve(browser);
                    }
                    var page = param[1];
                    var htmlPath = Path.join(args.outputdir, "html");
                    return Promise.all([
                                          args.fonts,
                                          args.images
                                        ].filter(Validator.isStringNotEmpty).map(function (x) {
                                          return new Promise((function (resolve, param) {
                                                        return resolve((FsExtra.copy(Path.join(args.templatedir, x), Path.join(htmlPath, x)), undefined));
                                                      }));
                                        })).then(function (param) {
                                    return page.content();
                                  }).then(function (content) {
                                  return FsExtra.outputFile(Path.join(htmlPath, "index.html"), content);
                                }).then(function (param) {
                                return browser;
                              });
                  }).then(function (browser) {
                  return browser.close().then(function (param) {
                              return Promise.resolve(Log.logDefault.replace("cmd", "pdf").replace("msg", "created").replace("color", Log.logColor("green")).time().val);
                            });
                }), (function (e) {
                var logError = Log.logDefault.replace("cmd", "pdf").replace("color", Log.logColor("red")).time();
                var tmp;
                if (e.RE_EXN_ID === $$Promise.JsError) {
                  var msg = e._1.message;
                  tmp = msg !== undefined ? logError.replace("msg", "failed : " + msg).val : logError.replace("msg", "failed : no message available (probably no js error value).").val;
                } else {
                  tmp = logError.replace("msg", "failed : unknown error.").val;
                }
                return Promise.resolve(tmp);
              }));
}

var PDF = {
  pdf: pdf
};

export {
  PDF ,
  
}
/* Log Not a pure module */
