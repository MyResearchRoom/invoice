import mysql from 'mysql2';
//import in .env
export const connection = mysql.createConnection({
  host: 'wesolutizecms.cbb4kibga0qo.ap-south-1.rds.amazonaws.com',
  user: 'admin',
  password: 'wesolutize12345',
  database: 'invoice'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});


export const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      connection.query(sql, params, (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  };



  