const Promise = require('bluebird'),
  promisify = Promise.promisify,
  jsonfile = require('jsonfile'),
  fetchUrl = promisify(require('fetch').fetchUrl, { multiArgs: true }),
  parse = promisify(require('xml2js').parseString),
  _ = require('lodash');

const baseUrl = 'http://imagenet.stanford.edu/python/tree.py/SubtreeXML',
  urlFromId = (id) => `${baseUrl}?rootid=${id}`;

// helpers
const
  idOf = (node) => node.$.synsetid,
  nameOf = (node) => node.$.words,
  sizeOf = (node) => node.$.subtree_size,
  childrenOf = (parentName, node) => {
    if(node.synset) {
      return _.map(node.synset, child => {
        return _.assign(nodeAsObject(parentName, child), { id: idOf(child) });
      });
    } else {
      return [];
    }
  },
  nodeAsObject = (parentName, node) => {
    let prefix = parentName ? `${parentName} > `:'',
      nodeName = `${prefix}${nameOf(node)}`;
    return {
      name: nodeName, size: sizeOf(node), children: childrenOf(nodeName, node)
    };
  };


// connection throttling
const MAX_RESOURCES = 100;
let occupiedResources = 0, waiting = [];

const throttleTask = (task, ...rest) => {
  if(MAX_RESOURCES > occupiedResources) {
    occupiedResources++;
    task.apply(null, rest);
  } else {
    waiting.unshift([task, ...rest]);
  }
}, resourcesFreed = () => {
  occupiedResources--;
  if(waiting.length) throttleTask.apply(null, waiting.pop());
};

// dataset
let memo = [], nodesProcessed = 0;

// dataset processing
const processUrl = (url, parentName, resolve) => {
  fetchUrl(url)
    .then(([meta, body]) => {
      resourcesFreed();
      return parse(body);
    })
    .then(rawNode => nodeAsObject(parentName, rawNode.synset) )
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

// wrap-up
const done = () => {
  jsonfile.writeFileSync('full.json', memo);
};


// kickoff
populate(['82127'], null, (nodes) => {
  nodes = _.map(nodes, (node) => _.pick(node, 'name', 'size'));
  memo = memo.concat(nodes);
  nodesProcessed += nodes.length;
  console.log(nodesProcessed);
  if(occupiedResources <= 0) {
    done();
  }
});



//TODO: add error handling and
//TODO: add stdout progress report
