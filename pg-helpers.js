const Promise = require('bluebird');

const queryAsync = (queryString, client, done) => {
  return new Promise((resolve, reject) => {
    client.query(queryString, (err, result) => {
      done(); //can't promisify automatically
      if(err) reject(err);
      else resolve(result);
    });
  });
};

module.exports = { queryAsync };
