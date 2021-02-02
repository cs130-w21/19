/* This file consists of CREATE statements used to create our tables 
*/

export const usersTable = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_created DATE NOT NULL,
    username TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    email TEXT UNIQUE
  );
`;


/* The tradesTable maintains a history of filled & executed trades (either buy or sell).
* action - a string of either 'buy' or 'sell'
* ticker - the stock ticker in capital letters. e.g. PLTR, FB, etc. 
* unit_price_executed - the price used to buy/sell each share in 2 dp.
*/
export const tradesTable = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS Trades (
    trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_executed DATE NOT NULL,
    user_id UUID NOT NULL REFERENCES Users(user_id),
    ticker TEXT NOT NULL,
    action TEXT NOT NULL,
    quantity BIGINT NOT NULL,
    unit_price_executed DECIMAL(12, 2) NOT NULL
  );
`;

/* table containing portfolio items for each user. 
* symbol - can be either a ticker (see above), OR
* a currency in capital letters (e.g. USD)
* quantity - is the nominal amount in units of shares, or if a currency,
* the nominal value e.g. $105.23 (with 2 decimal popints)
*/
export const portfolioTable = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS PortfolioItems (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_created DATE NOT NULL,
    date_changed DATE NOT NULL,
    user_id UUID NOT NULL REFERENCES Users(user_id),
    symbol TEXT NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    CONSTRAINT user_symbol_unq unique (user_id, symbol)
  );
`;
export default [usersTable, tradesTable, portfolioTable];


