
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const SOURCE_FILE =
  "C:\\project\\resume-fixer-pro\\resume-fixer-pro\\data_storage\\db.json";

const TARGET_USER_ID = "user-1792849745698-omnun";

const TARGET_IDS = [
  "resume-1792854590003-x0mh",
  "resume-1793184323817-3c4l",
];

async function main() {
  let connection;

  try {
    // Check configuration without displaying credentials.
    const required = [
      "MYSQL_HOST",
      "MYSQL_USER",
      "MYSQL_PASSWORD",
      "MYSQL_DATABASE",
    ];

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing ${key} in current project's .env`);
      }
    }

    if (!fs.existsSync(SOURCE_FILE)) {
      throw new Error(`Original JSON not found: ${SOURCE_FILE}`);
    }

    const db = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8"));

    if (!Array.isArray(db.resumes)) {
      throw new Error("The original JSON does not contain a resumes array.");
    }

    // Find exactly the two requested records.
    const records = TARGET_IDS.map((id) => {
      const matches = db.resumes.filter((r) => r.id === id);

      if (matches.length !== 1) {
        throw new Error(
          `Expected exactly one source record for ${id}; found ${matches.length}.`
        );
      }

      return matches[0];
    });

    // Validate ownership and required fields before connecting.
    const rows = records.map((r) => {
      const userId = r.userId || r.user_id;
      const templateId = r.templateId || r.template_id;
      const accentColor = r.accentColor || r.accent_color;
      const createdAt = r.createdAt || r.created_at;
      const updatedAt = r.updatedAt || r.updated_at;

      if (userId !== TARGET_USER_ID) {
        throw new Error(`Unexpected owner for resume ${r.id}.`);
      }

      if (
        !r.title ||
        !templateId ||
        !accentColor ||
        !createdAt ||
        !updatedAt ||
        r.content === undefined ||
        r.content === null
      ) {
        throw new Error(`Required data is missing for resume ${r.id}.`);
      }

      const content =
        typeof r.content === "string"
          ? JSON.parse(r.content)
          : r.content;

      return {
        id: r.id,
        userId,
        title: r.title,
        templateId,
        accentColor,
        content: JSON.stringify(content),
        createdAt,
        updatedAt,
      };
    });

    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    const [users] = await connection.execute(
      "SELECT id FROM app_users WHERE id = ?",
      [TARGET_USER_ID]
    );

    if (users.length !== 1) {
      throw new Error("The target account does not exist exactly once in MySQL.");
    }

    const [existing] = await connection.execute(
      "SELECT id FROM app_resumes WHERE id IN (?, ?)",
      TARGET_IDS
    );

    if (existing.length > 0) {
      throw new Error(
        `Safety stop: one or more target IDs already exist in MySQL: ${
          existing.map((r) => r.id).join(", ")
        }. No records were inserted.`
      );
    }

    await connection.beginTransaction();

    for (const r of rows) {
      await connection.execute(
        `INSERT INTO app_resumes
          (id, user_id, title, template_id, accent_color,
           content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.userId,
          r.title,
          r.templateId,
          r.accentColor,
          r.content,
          r.createdAt,
          r.updatedAt,
        ]
      );

      console.log(`Inserted in transaction: ${r.id}`);
    }

    await connection.commit();

    const [verified] = await connection.execute(
      `SELECT id, user_id, title, template_id,
              JSON_VALID(content) AS content_valid,
              JSON_LENGTH(content) AS content_items
       FROM app_resumes
       WHERE id IN (?, ?)
       ORDER BY id`,
      TARGET_IDS
    );

    console.log("\nPost-commit verification:");
    console.table(verified);

    if (
      verified.length !== 2 ||
      verified.some(
        (r) =>
          r.user_id !== TARGET_USER_ID ||
          Number(r.content_valid) !== 1
      )
    ) {
      throw new Error(
        "Verification did not match the expected two valid resume records."
      );
    }

    console.log("\nSUCCESS: Both requested resumes were recovered.");
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    console.error("\nRECOVERY STOPPED:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
