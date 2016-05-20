// Credits:
// Guy Bedford https://github.com/guybedford
// -----------
// [harsh.r]
// Updated to get output file from vulvanizeHTML options 
// and consider systemGlobal if available while generating output snippets.

var Vulcan = System._nodeRequire('vulcanize');
var Promise = global.Promise || System._nodeRequire('es6-promise').Promise;

// it's bad to do this in general, as code is now heavily environment specific
var fs = System._nodeRequire('fs');

var isWin = process.platform.match(/^win/);

function fromFileURL(address) {
  address = address.replace(/^file:(\/+)?/i, '');

  if (isWin) {
    address = address.replace(/\//g, '\\');
  } else {
    address = '/' + address;
  }

  return address;
}

function extend(a, b) {
  for (var p in b) {
    if (b.hasOwnProperty(p)) {
      a[p] = b[p];
    }
  }
  return a;
}

module.exports = function bundle(loads, opts) {
  var loader = this;

  var options = {
    excludes: [],
    inlineScripts: true,
    inlineCss: true,
    implicitStrip: true,
    stripComments: false
  };

  if (loader.vulvanizeHTML) {
    extend(options, loader.vulvanizeHTML);
  }

  var vulcan = new Vulcan(options);

  var outFile = opts.outFile.replace(/\.js$/, '.html');

  var output = loads.map(function (load) {
    return '<link rel="import" href="' + fromFileURL(load.address) + '">';
  }).join('\n');

  var stubDefines = loads.map(function (load) {
    return (opts.systemGlobal || 'System') + "\.register('" + load.name + "', [], false, function() {});";
  }).join('\n');

  return new Promise(function (resolve, reject) {
    fs.writeFileSync(outFile, output);
    console.log('     Vulcanizing ', outFile);

    vulcan.process(outFile, function (error, output) {
      if (error) {
        return reject(error);
      }

      fs.writeFileSync(options.outFile || outFile, output);
      resolve(stubDefines);
    });
  });
};
