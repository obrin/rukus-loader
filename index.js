var fs = require('fs');
var rukus = require('rukus');


module.exports = function(context) {};  // required to be considered a loader

module.exports.pitch = function(remainingRequest, precedingRequest, data) {
    var self = this;
    this.cacheable(true);

    //query should be a json array of paths to search for components
    var searchPaths = JSON.parse(this.query.slice(1));
    var components = rukus.findComponents(searchPaths);
    //turn each found component into a riot tag
    var parts = components.map(function(c) { 
        return rukus.riotifyComponent(self, c);
    });
    //add the entrypoint content
    parts.push(fs.readFileSync(remainingRequest));
    //add riot require and return the payload
    return "var riot = require('riot');" + parts.join('\n');
};

