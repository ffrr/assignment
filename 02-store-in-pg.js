const fs = require('fs'),
  Promise = require('bluebird'),
  config = require('config'),
  pg = require('pg'),
  copyFrom = require('pg-copy-streams').from;

let pool = new pg.Pool(config.get('db'));


pool.connect().then(client => {
  client
    .query('CREATE TABLE IF NOT EXISTS linearized_tree(path text, length int)')
    .then(new Promise((resolve, reject) => {
      let fileStream = fs.createReadStream('tmp/streamed.csv'),
        stream = client.query(copyFrom('COPY linearized_tree FROM STDIN WITH DELIMITER \';\''));
      fileStream.on('error', () => { client.release(); reject(err); });
      stream.on('error', () => { client.release(); reject(err); });
      stream.on('end', client.release);
      fileStream.pipe(stream);
    }))
});
