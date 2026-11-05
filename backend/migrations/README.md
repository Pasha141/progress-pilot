# FastAPI database migrations

These SQL files are manually applied migrations for the separate FastAPI schema.
They do not change the Express tables (`app_users` and `app_resumes`).

## 001: Resume template fields

The FastAPI `resumes` model requires `template_id` and `accent_color`. Migration
001 adds both as non-null columns with the model's existing defaults. Existing
resume rows retain their current content and receive `tmpl-1` and `#C98B5E` for
the new fields.

Before applying the `001_add_resume_template_fields.up.sql` file:

1. Confirm that `DATABASE_URL` targets the intended FastAPI MySQL database.
2. Take and verify a database backup.
3. Review the SQL and schedule a maintenance window appropriate to the database.
4. Apply the migration once, then verify the two columns and existing row counts.

The migration has **not** been applied by this project check. Do not run the
down migration after those fields have been populated unless discarding their
values is acceptable; it removes both columns.
