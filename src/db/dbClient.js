import pg from 'pg';
const { Client, Pool } = pg;

const connectionString = process.env.PG_CONNSTR || 'postgresql://willyspinner:@localhost:5432/willyspinner';

const pgClient = new Client({ connectionString });

const pgPool = new Pool({ connectionString });

const initializePg = async () => {
  // first, we connect to the postgres client.
  await pgClient.connect();
  await Promise.all([
    pgClient.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE IF NOT EXISTS USERS (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date_created DATE NOT NULL,
        username TEXT NOT NULL,
        hashed_password TEXT NOT NULL,
        email TEXT UNIQUE
      );
   `)
  ]);
};

export { initializePg, pgClient, pgPool };
