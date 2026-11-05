
const fs = require("fs");
const mysql = require("mysql2/promise");

const JSON_PATH =
  "C:\\project\\resume-fixer-pro\\resume-fixer-pro\\data_storage\\db.json";

const OWNER_ID = "user-1792849745698-omnun";

const TARGET_IDS = [
  "resume-1792854590003-x0mh",
  "resume-1793184323817-3c4l"
];

function findRecords(data, found = new Map()) {
  if (!data || typeof data !== "object") return found;

  if (!Array.isArray(data)) {
    if (TARGET_IDS.includes(data.id)) {
      found.set(data.id, data);
    }
    for (const value of Object.values(data)) {
      findRecords(value, found);
    }
  } else {
    for (const value of data) {
      findRecords(value, found);
    }
  }
  return found;
}

function hiddenPassword() {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("Run this script directly in Windows CMD."));
      return;
    }

    process.stdout.write("Enter MySQL ROOT password (hidden): ");
    let password = "";

    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    function onData(char) {
      if (char === "\r" || char === "\n") {
        input.removeListener("data", onData);
        input.setRawMode(false);
        input.pause();
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u0003") {
        input.removeListener("data", onData);
        input.setRawMode(false);
        process.stdout.write("\nCancelled.\n");
        process.exit(1);
      } else if (char === "\u007f" || char === "\b") {
        password = password.slice(0, -1);
      } else {
        password += char;
      }
    }

    input.on("data", onData);
  });
}

async function main() {
  if (!fs.existsSync(JSON_PATH)) {
    throw new Error("Original db.json file not found.");
  }

  const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  const records = findRecords(data);

  for (const id of TARGET_IDS) {
    if (!records.has(id)) {
      throw new Error("Resume not found in original JSON: " + id);
    }
  }

  const rows = TARGET_IDS.map(id => {
    const r = records.get(id);
    const userId = r.user_id || r.userId;

    if (userId !== OWNER_ID) {
      throw new Error("Owner ID mismatch for " + id);
    }

    let content = r.content;
    if (typeof content === "string") content = JSON.parse(content);
    if (!content || typeof content !== "object") {
      throw new Error("Invalid resume content for " + id);
    }

    return {
      id,
      user_id: userId,
      title: r.title || "Untitled Resume",
      template_id: r.template_id || r.templateId,
      accent_color: r.accent_color || r.accentColor || "#000000",
      content: JSON.stringify(content),
      created_at: r.created_at || r.createdAt,
      updated_at: r.updated_at || r.updatedAt
    };
  });

  for (const row of rows) {
    if (!row.template_id || !row.created_at || !row.updated_at) {
      throw new Error("Required resume fields missing for " + row.id);
    }
  }

  console.log("Both target resumes found in original JSON.");
  console.log("Resume 1:", rows[0].id, "-", rows[0].title);
  console.log("Resume 2:", rows[1].id, "-", rows[1].title);

  const password = await hiddenPassword();

  const db = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password,
    database: "resume_ats"
  });

  try {
    await db.beginTransaction();

    const [users] = await db.execute(
      "SELECT id FROM app_users WHERE id = ?",
      [OWNER_ID]
    );

    if (users.length !== 1) {
      throw new Error("Expected owner account was not found.");
    }

    let inserted = 0;
    let skipped = 0;

    for (const r of rows) {
      const [existing] = await db.execute(
        "SELECT id FROM app_resumes WHERE id = ?",
        [r.id]
      );

      if (existing.length) {
        console.log("Already exists; safely skipped:", r.id);
        skipped++;
        continue;
      }

      await db.execute(
        `INSERT INTO app_resumes
        (id, user_id, title, template_id, accent_color,
         content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.user_id,
          r.title,
          r.template_id,
          r.accent_color,
          r.content,
          r.created_at,
          r.updated_at
        ]
      );

      console.log("Inserted:", r.id);
      inserted++;
    }

    await db.commit();

    const [check] = await db.execute(
      `SELECT id, title, user_id, JSON_VALID(content) AS valid_json
       FROM app_resumes
       WHERE id IN (?, ?)
       ORDER BY id`,
      TARGET_IDS
    );

    console.log("\nRecovery transaction committed.");
    console.log("Inserted:", inserted, "| Already present:", skipped);
    console.table(check);

    if (check.length !== 2 || check.some(r => Number(r.valid_json) !== 1)) {
      console.log("WARNING: Please check the verification output.");
    }
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    await db.end();
  }
}

main().catch(error => {
  console.error("\nRECOVERY STOPPED:", error.message);
  process.exitCode = 1;
});
