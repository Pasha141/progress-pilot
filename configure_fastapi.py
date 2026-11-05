from pathlib import Path
from datetime import datetime
import secrets
import shutil

root = Path(__file__).resolve().parent
files = [root / ".env", root / "backend" / ".env"]

for file in files:
    if not file.is_file():
        raise SystemExit(f"Missing file: {file}")

stamp = datetime.now().strftime("%Y%m%d_%H%M%S")

for file in files:
    shutil.copy2(file, Path(str(file) + ".backup_" + stamp))

token = secrets.token_urlsafe(48)

settings = [
    {
        "FASTAPI_ATS_URL": "http://127.0.0.1:8001",
        "FASTAPI_ATS_TOKEN": token,
    },
    {
        "FASTAPI_ATS_TOKEN": token,
    },
]

for file, config in zip(files, settings):
    lines = file.read_text(encoding="utf-8-sig").splitlines()

    for key, value in config.items():
        matches = [i for i, line in enumerate(lines)
                   if line.startswith(key + "=")]

        if len(matches) > 1:
            raise SystemExit(f"Duplicate setting: {key}")

        entry = f"{key}={value}"

        if matches:
            lines[matches[0]] = entry
        else:
            lines.append(entry)

    file.write_text("\n".join(lines) + "\n", encoding="utf-8")

print("SUCCESS: Both configurations updated.")
print("Backups created. Secret was not displayed.")