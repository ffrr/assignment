const
  Promise = require('bluebird'),
  promisify = Promise.promisify,
  fetchUrl = promisify(require('fetch').fetchUrl, { multiArgs: true }),
  parse = promisify(require('xml2js').parseString),
  { throttleTask, resourcesFreed, allResourcesFreed } = require('./throttling'),
  { idOf, nameOf, sizeOf, childrenOf, nodeAsObject } = require('./helpers'),
  _ = require('lodash');

const scrape = (rootId, nodesReceived, done) => {

  const baseUrl = 'http://imagenet.stanford.edu/python/tree.py/SubtreeXML',
    urlFromId = (id) => `${baseUrl}?rootid=${id}`;

  // dataset
  let memo = [], nodesProcessed = 0;

  // dataset processing
  const processUrl = (url, parentName, resolve) => {
    fetchUrl(url)
      .then(([, body]) => {
        resourcesFreed();
        return parse(body);
      })
      .then(rawNode => nodeAsObject(parentName, rawNode.synset))
      .then((node) => {
        [branches, leaves] = _.partition(node.children, (child) => child.size > 1 );
        if(branches.length) { populate(_.map(branches, branch => branch.id), node.name, resolve); }
        resolve(leaves.concat([node]));
      });
  }

  // entrypoint
  const populate = (ids, parentName = null, resolve) => {
    let urls = _.map(ids, urlFromId);

    _.each(urls, (url) => {
      throttleTask(processUrl, url, parentName, resolve);
    });
  };

  // kickoff
  populate([rootId], null, (nodes) => {
    nodes = _.map(nodes, (node) => _.pick(node, 'name', 'size'));
    nodesReceived(nodes);

    nodesProcessed += nodes.length;
    if(allResourcesFreed()) {
      done();
    }
  });
};

module.exports = scrape;
