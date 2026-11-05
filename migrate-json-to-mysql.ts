
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

type JsonUser = {
  id: string;
  email: string;
  fullName?: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  verified?: boolean;
  otpHash?: string | null;
  otpExpiresAt?: number | null;
  otpAttempts?: number | null;
  otpLastSentAt?: number | null;
  resetCodeHash?: string | null;
  resetCodeExpiresAt?: number | null;
  resetCodeAttempts?: number | null;
  resetLastSentAt?: number | null;
};

type JsonResume = {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  accentColor: string;
  content: unknown;
  createdAt: string;
  updatedAt: string;
};

async function main() {
  const filePath = path.join(process.cwd(), 'data_storage', 'db.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
    users: JsonUser[];
    resumes: JsonResume[];
  };

  if (!Array.isArray(data.users) || !Array.isArray(data.resumes)) {
    throw new Error('JSON must contain users and resumes arrays.');
  }

  const userIds = new Set(data.users.map((user) => user.id));
  for (const resume of data.resumes) {
    if (!userIds.has(resume.userId)) {
      throw new Error(`Resume ${resume.id} references a missing user.`);
    }
  }

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'resume_app',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'resume_ats',
  });

  try {
    await connection.beginTransaction();

    for (const user of data.users) {
      await connection.execute(
        `INSERT INTO app_users
          (id, email, full_name, password_hash, salt, verified,
           otp_hash, otp_expires_at, otp_attempts, otp_last_sent_at,
           reset_code_hash, reset_code_expires_at,
           reset_code_attempts, reset_last_sent_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.email,
          user.fullName || '',
          user.passwordHash,
          user.salt,
          user.verified ? 1 : 0,
          user.otpHash ?? null,
          user.otpExpiresAt ?? null,
          user.otpAttempts ?? null,
          user.otpLastSentAt ?? null,
          user.resetCodeHash ?? null,
          user.resetCodeExpiresAt ?? null,
          user.resetCodeAttempts ?? null,
          user.resetLastSentAt ?? null,
          user.createdAt,
        ]
      );
    }

    for (const resume of data.resumes) {
      await connection.execute(
        `INSERT INTO app_resumes
          (id, user_id, title, template_id, accent_color,
           content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [
          resume.id,
          resume.userId,
          resume.title,
          resume.templateId,
          resume.accentColor,
          JSON.stringify(resume.content),
          resume.createdAt,
          resume.updatedAt,
        ]
      );
    }

    await connection.commit();

    const [users] = await connection.query(
      'SELECT COUNT(*) AS total FROM app_users'
    );
    const [resumes] = await connection.query(
      'SELECT COUNT(*) AS total FROM app_resumes'
    );

    console.log('Migration completed.');
    console.log('MySQL user count:', users);
    console.log('MySQL resume count:', resumes);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
