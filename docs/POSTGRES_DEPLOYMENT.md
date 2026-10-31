# PostgreSQL provisioning for production

The production Spring Boot service uses schema `portal`. Flask is optional for
the first public release; if deployed separately, it uses schema `flask_app`.
Create the `portal` schema as a database owner before starting Spring Boot.
Neither application role needs permission to create schemas or databases.

## Provision roles and schemas

Run the following as the Neon database owner after replacing
`YOUR_NEON_DATABASE` with the database name shown by Neon. Set each role's
password with the interactive `\password` command; do not put passwords in SQL
files, shell history, or this repository.

```sql
CREATE ROLE portal_migrator LOGIN;
CREATE ROLE portal_runtime LOGIN;

GRANT CONNECT ON DATABASE YOUR_NEON_DATABASE
    TO portal_migrator, portal_runtime;

CREATE SCHEMA portal;

GRANT USAGE, CREATE ON SCHEMA portal TO portal_migrator;
GRANT USAGE ON SCHEMA portal TO portal_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE portal_migrator IN SCHEMA portal
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO portal_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE portal_migrator IN SCHEMA portal
    GRANT USAGE, SELECT ON SEQUENCES TO portal_runtime;
```

Only if Flask is intentionally deployed later, provision its separate roles
and schema as the database owner:

```sql
CREATE ROLE flask_migrator LOGIN;
CREATE ROLE flask_runtime LOGIN;
GRANT CONNECT ON DATABASE YOUR_NEON_DATABASE TO flask_migrator, flask_runtime;
CREATE SCHEMA flask_app;
GRANT USAGE, CREATE ON SCHEMA flask_app TO flask_migrator;
GRANT USAGE ON SCHEMA flask_app TO flask_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE flask_migrator IN SCHEMA flask_app
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO flask_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE flask_migrator IN SCHEMA flask_app
    GRANT USAGE, SELECT ON SEQUENCES TO flask_runtime;
```

In `psql`, set the Spring role passwords interactively:

```text
\password portal_migrator
\password portal_runtime
```

If Flask is enabled later, set its role passwords interactively as well:

```text
\password flask_migrator
\password flask_runtime
```

The migration roles can create objects only inside their assigned schemas.
Runtime roles can use those schemas and read/write tables created there, but
cannot create schemas or databases. The Flask schema and grants are only needed
if the optional Flask service is deployed.

## Render environment

Configure these on the Spring Boot web service. Use the same Neon database name
and host for the JDBC URL, and enable TLS with `sslmode=require`.

| Variable | Value or purpose |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `production` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<Neon-host>/<database>?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `portal_runtime` |
| `SPRING_DATASOURCE_PASSWORD` | Password for `portal_runtime` |
| `SPRING_FLYWAY_USER` | `portal_migrator` |
| `SPRING_FLYWAY_PASSWORD` | Password for `portal_migrator` |
| `SPRING_FLYWAY_ENABLED` | `true` |
| `APP_CORS_ALLOWED_ORIGINS` | Exact public Render static-site origin, e.g. `https://<site>.onrender.com` |
| `JWT_SECRET` | Render-generated secret; keep stable and share only with Flask if it is separately enabled |
| `ADMIN_PROVISION_KEY` | Render-generated secret for initial administrator provisioning |
| `DEMO_ACCOUNTS_ENABLED` | `false` |
| `JAVA_OPTS` | Render Blueprint sets JVM memory options |

Spring's schema is deliberately fixed as `portal` in
`application-production.properties`; it does not read a `DATABASE_SCHEMA`
variable. Flyway also targets `portal` and has schema creation disabled, so the
owner must provision the schema first.

The static frontend uses `VITE_API_URL` as a public API host only. It must never
contain a database URL, password, JWT, or provisioning secret. Render resolves
the API host from the Spring service in `render.yaml`.

## Optional Flask service environment

Flask remains in local Compose for demonstrations but is not included in the
first-release Render Blueprint. If it is intentionally deployed later, use:

| Variable | Value or purpose |
|---|---|
| `APP_ENV` | `production` |
| `DATABASE_URL` | PostgreSQL DSN for `flask_runtime` |
| `DATABASE_MIGRATION_URL` | PostgreSQL DSN for `flask_migrator` |
| `DATABASE_SCHEMA` | `flask_app` |
| `JWT_SECRET` | The same stable value configured on Spring |
| `FRONTEND_ORIGIN` | Exact public static-site origin |
| `PORT` | Supplied by Render |

Flask applies migrations using `DATABASE_MIGRATION_URL` and handles requests
using `DATABASE_URL`. Both roles are restricted to `flask_app`; the application
does not create that schema. Flask is not used by the React frontend in the
initial deployment.

## Local Compose

Compose continues to use the existing named H2 and SQLite volumes. Set
`JWT_SECRET` in the local shell or an untracked `.env` file; Compose passes the
same value to Spring and Flask. No production PostgreSQL URL or credentials are
needed for local Compose.

No local H2 or SQLite data is copied, reset, or deleted by this configuration.
