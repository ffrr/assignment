const _ = require('lodash');

const
  idOf = (node) => node.$.synsetid,
  nameOf = (node) => node.$.words,
  sizeOf = (node) => node.$.subtree_size - - ,
  childrenOf = (parentName, node) => {
    return _.map(node.synset || [], child => {
      return _.assign(nodeAsObject(parentName, child), { id: idOf(child) });
    });
  },
  nodeAsObject = (parentName, node) => {
    let prefix = parentName ? `${parentName} > `:'',
      nodeName = `${prefix}${nameOf(node)}`;
    return {
      name: nodeName, size: sizeOf(node), children: childrenOf(nodeName, node)
    };
  };  


module.exports = {
  idOf, nameOf, sizeOf, childrenOf, nodeAsObject
};
