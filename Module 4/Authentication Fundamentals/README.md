# Authentication Fundamentals Starter

## Setup

```bash
npm install
cp .env.example .env
npm run db:push
npm start
```

Implement register and login behavior in the TODO-marked service functions. The SQLite datasource keeps local setup self-contained. Do not commit `.env` or `prisma/dev.db`.

## Endpoints

- `POST /auth/register`
- `POST /auth/login`

Use the platform assignment for required request, response, and security behavior.
