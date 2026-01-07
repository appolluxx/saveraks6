const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://saveraks_user:saveraks_password_2024@127.0.0.1:5432/saveraks?schema=public',
});

console.log('Connecting with password...');
client.connect()
  .then(() => {
    console.log('Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Query result:', res.rows[0]);
    return client.end();
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
