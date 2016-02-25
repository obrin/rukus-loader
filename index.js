var fs = require('fs')
var url = require('url')
var path = require('path')
var rukus = require('rukus')

module.exports = function (content) {} // required to be considered a loader

module.exports.pitch = function (remainingRequest, precedingRequest, data) {
  var self = this
  this.cacheable(true)

  var query = url.parse(this.query, true).query
  var options = Object.keys(query)

  // query should be a json array of paths to search for components
  var searchPaths = JSON.parse(options[0])
  var components = rukus.findComponents(searchPaths)
  // turn each found component into a riot tag
  var parts = components.map(function (c) {
    return riotifyComponent.call(self, c, query.css)
  })
  // add the entrypoint content
  parts.push(fs.readFileSync(remainingRequest))
  // add riot require and return the payload
  return "var riot = require('riot'); (window||global).RukusApp = riot.observable();" + parts.join('\n')
}

function riotifyComponent (location, css) {
  var files = fs.readdirSync(location)
  var componentName = path.basename(location)

  if (files.indexOf('index.js') === -1) {
    this.emitError('component at ' + location + ' requires an index.js file.')
  }

  if (files.indexOf('index.html') === -1) {
    this.emitError('component at ' + location + ' requires an index.html file.')
  }

  if (files.indexOf('test.js') === -1) {
    this.emitWarning('component at ' + location + ' missing a test.js file.')
  }

  var js = path.resolve(location, 'index.js')
  var template = path.resolve(location, 'index.html')

  this.addDependency(js)
  this.addDependency(template)

  if ((!css && css !== '') || !~files.indexOf('styles.css')) {
    return "riot.tag('" + componentName + "', `" + fs.readFileSync(template) + "`, require('" + js + "'));"
  }

  var styles = path.resolve(location, 'styles.css')

  this.addDependency(styles)

  if (css === 'module') {
    return "riot.tag('" + componentName + "', `" + fs.readFileSync(template) + "`, function (opts) { this.styles = require('" + styles + "'); require('" + js + "').call(this, opts) });"
  } else {
    // inline mode
    return "riot.tag('" + componentName + "', `" + fs.readFileSync(template) + '`, `' + fs.readFileSync(styles) + "`, require('" + js + "'));"
  }
}
