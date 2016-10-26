const
  config = require('config'),
  pg = require('pg'),
  _ = require('lodash'),
  util = require('util'),
  jsonfile = require('jsonfile'),
  Promise = require('bluebird');


const batchSize = 10000;
let pool = new pg.Pool(config.get('db'));

let previousLevel, parentVector = [], result, previousNode;

const addNode = (row) => {
  let path = row.path.split(' > '), currentLevel = path.length, name = _.last(path);

  if(!result) {
    result = { name, size: row.length, children: [] };
    previousNode = result;
    previousLevel = 1;
    return;
  }

  if(currentLevel - previousLevel == 1 ) {
    parentVector.push(previousNode);
  }
  else if(currentLevel - previousLevel < 0) {
    parentVector = parentVector.slice(0, currentLevel - 1);
  }

  let currentParent = _.last(parentVector);

  currentParent.children.push({
    name, size: row.length, children: []
  });

  previousNode = _.last(currentParent.children);
  previousLevel = currentLevel;
};

const batch = (client, pagesNeeded, page = 0) => {
  client
    .query(`SELECT * FROM linearized_tree ORDER BY path LIMIT ${batchSize} OFFSET ${page*batchSize}`)
    .then(raw => {
      _.each(raw.rows, (row) => addNode(row));
      console.log(`${page}/${pagesNeeded}`);
      if(page < pagesNeeded) {
        batch(client, pagesNeeded, page + 1);
      }
      else {
        client.release();
        jsonfile.writeFileSync('tmp/from-linearized.json', result);
      }
    });
};

pool.connect()
  .then(client => {
    let i = 0, hasResults = true, pagesNeeded;
    client
      .query(`SELECT COUNT(*) as count FROM linearized_tree`)
      .then(raw => {
        let count = raw.rows[0].count, pagesNeeded = Math.floor(count / batchSize);
        batch(client, pagesNeeded);
      });
  }).then(() => pool.end());
