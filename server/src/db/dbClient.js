import pg from 'pg';
import tableSchemas from './schemas.js';

const { Client, Pool } = pg;

const connectionString = process.env.PG_CONNSTR || 'postgresql://lorance:123@localhost:5432/lorance';

const pgClient = new Client({ connectionString });

const pgPool = new Pool({ connectionString });

const createConnectedClient = async () => {
  const c = new Client({ connectionString });
  await c.connect();
  return c;
};

const initializePg = async () => {
  // first, we connect to the postgres client.
  await pgClient.connect();
  // then we generate all tables if not exist.
  await Promise.all(tableSchemas.map((schemaQuery) => pgClient.query(schemaQuery)));
};

export { initializePg, createConnectedClient, pgClient, pgPool };
