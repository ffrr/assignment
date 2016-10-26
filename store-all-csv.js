const fs = require('fs'),
  _ = require('lodash'),
  stringify = require('csv-stringify')
  scrape = require('./scrape');

let stream = fs.createWriteStream('tmp/streamed.csv'), nodeCount = 0;

scrape('82127', (nodes) => {
  _.each(nodes, (node) => { stringify([_.values(node)], { delimiter: ';' }, (err, out) => { stream.write(out); }) } );
}, () => {
  stream.end();
});
