const fs = require('fs'),
  _ = require('lodash'),
  scrape = require('./scrape');

// super-naive, but works fine
let stream = fs.createWriteStream('tmp/streamed.json'), nodeCount = 0;
stream.write('[');

scrape('82127', (nodes) => {
  _.each(nodes,
    (node) => stream.write(`${ nodeCount++ ? ',':'' }${ JSON.stringify(node) }`));
}, () => {
  stream.write(']');
  stream.end();
});
