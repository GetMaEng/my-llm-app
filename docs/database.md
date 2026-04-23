# Setting Up the Database for this Project

In this project, we will use Drizzle ORM with Next.js involves installing the core packages, defining our schema and configuring the database connection.

---

# What is Drizzle ORM

**Drizzle ORM** is a lightweight, TypeScript-native Object-Relational Mapper (ORM) designed for SQL databases (PostgreSQL, MySQL, SQLite) that emphasizes SQL-like syntax, full type safety, and maximum performance with zero dependencies.

Read more - [https://orm.drizzle.team/docs/overview](https://orm.drizzle.team/docs/overview)

## Install Dependencies

Install the Drizzle ORM and its companion CLI, [Drizzle Kit](https://orm.drizzle.team/docs/kit-overview), along with the appropriate database driver (e.g., PostgreSQL, MySQL, or SQLite).

```bash
# For PostgreSQL (using pg)
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

## Configure Drizzle Kit

Create a `drizzle.config.ts` file in your project root to specify your schema path and database connection details.

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql", // or "mysql" | "sqlite"
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Define Your Schema
Create a schema file (e.g., `src/db/schema.ts`) to define your database tables using TypeScript.

```typescript
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name"),
  email: varchar("email", { length: 256 }).notNull().unique(),
});
```

## Initialize the Client

Create a database instance in `src/db/index.ts` to use throughout your Next.js App Router components or Server Actions.

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
```

## Synchroize the Database

Use Drizzle Kit to push your schema changes to the database or generate migration files.
- **Quick Sync:** `npx drizzle-kit push` (best for rapid prototyping).
- **Migrations:** `npx drizzle-kit generate` followed by `npx drizzle-kit migrate` (best for production).

## Usage in Next.js

You can now import the `db` instance into your Next.js pages or Server Actions.

```typescript
// src/app/users/page.tsx
import { db } from "@/db";
import { users } from "@/db/schema";

export default async function Page() {
  const allUsers = await db.select().from(users);
  return (
    <ul>
      {allUsers.map((user) => (
        <li key={user.id}>{user.fullName}</li>
      ))}
    </ul>
  );
}
```