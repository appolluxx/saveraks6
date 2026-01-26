const { Client } = require('pg');

// If trusted, password can be anything or empty string, but must be string because pg client validates config types before connecting
const config = {
  host: '127.0.0.1',
  port: 5433,
  user: 'saveraks_user',
  database: 'saveraks',
  password: 'saveraks_password_2024', 
};

console.log(`Attempting connection to postgres://${config.user}@${config.host}:${config.port}/${config.database}`);

const client = new Client(config);

client.connect()
  .then(() => {
    console.log('Connected successfully (TRUST worked)!');
    return client.query('SELECT inet_server_addr(), inet_server_port()');
  })
  .then(res => {
    console.log('Connected to Server IP:', res.rows[0].inet_server_addr);
    console.log('Connected to Server Port:', res.rows[0].inet_server_port);
    return client.end();
  })
  .catch(err => {
    console.error('Connection failed.');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    if (err.message.includes('password authentication failed')) {
        console.error('CONCLUSION: Server demanded password. Trust auth FAILED or ignored.');
    }
    process.exit(1);
  });
