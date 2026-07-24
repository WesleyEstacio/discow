This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in the values (see setup steps below).
2. Install dependencies and push the database schema:

   ```bash
   npm install
   npm run db:push
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Auth & database setup

Authentication uses [Auth.js](https://authjs.dev) with Google sign-in, backed by a [Neon](https://neon.tech) Postgres database through [Drizzle ORM](https://orm.drizzle.team).

### 1. Neon database

1. Create a free project at [console.neon.tech](https://console.neon.tech).
2. Copy the pooled connection string and set it as `DATABASE_URL` in `.env.local`.
3. Push the schema (users/accounts/sessions tables) with `npm run db:push`, or generate + run a versioned migration with `npm run db:generate` followed by `npm run db:migrate`.

### 2. Google OAuth credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → OAuth consent screen, and configure it (External, add your email as a test user while in development).
2. Go to Credentials → Create Credentials → OAuth client ID → Web application.
3. Add these Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://<your-production-domain>/api/auth/callback/google` (production)
4. Copy the Client ID and Client Secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.local`.

### 3. Auth secret

Generate a random secret used to sign session cookies:

```bash
openssl rand -base64 32
```

Set it as `AUTH_SECRET` in `.env.local`.

## Database migrations

Any schema change lives in `src/lib/db/schema.ts`. After editing it:

```bash
npm run db:generate   # creates a new SQL migration file under ./drizzle
npm run db:migrate     # applies pending migrations to DATABASE_URL
```

Use `npm run db:studio` to browse the database with Drizzle Studio.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Auth.js Documentation](https://authjs.dev) - authentication for the web.
- [Drizzle ORM Documentation](https://orm.drizzle.team) - the TypeScript ORM used for the database.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
