
import 'dotenv/config';
import mysql from 'mysql2/promise';

async function testConnection() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'resume_app',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'resume_ats',
  });

  try {
    const [identity] = await connection.query(
      'SELECT DATABASE() AS databaseName, CURRENT_USER() AS currentUser'
    );
    console.log('MySQL connection successful.');
    console.log(identity);

    const [users] = await connection.query('DESCRIBE app_users');
    console.log('app_users columns:', users);

    const [resumes] = await connection.query('DESCRIBE app_resumes');
    console.log('app_resumes columns:', resumes);

    const [userCount] = await connection.query(
      'SELECT COUNT(*) AS users_count FROM app_users'
    );
    console.log('Users count:', userCount);

    const [resumeCount] = await connection.query(
      'SELECT COUNT(*) AS resumes_count FROM app_resumes'
    );
    console.log('Resumes count:', resumeCount);
  } finally {
    await connection.end();
  }
}

testConnection().catch((error) => {
  console.error('MySQL connection failed:', error.message);
  process.exitCode = 1;
});
