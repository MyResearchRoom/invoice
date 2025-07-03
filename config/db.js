import mysql from 'mysql2';

import dotenv from 'dotenv';
dotenv.config(); 
//import in .envimport dotenv from 'dotenv';
export const connection = mysql.createConnection({
   host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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



  