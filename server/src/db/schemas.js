/* This file consists of CREATE statements used to create our tables 
*/

export const usersTable = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_created TIMESTAMP NOT NULL,
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
    date_executed TIMESTAMP NOT NULL,
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
    date_created TIMESTAMP NOT NULL,
    date_changed TIMESTAMP NOT NULL,
    user_id UUID NOT NULL REFERENCES Users(user_id),
    symbol TEXT NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    CONSTRAINT user_symbol_unq unique (user_id, symbol)
  );
`;

/* the ticker_name  e.g. MSFT serves as the primary key here.*/
// NOTE: we store the last_price here since we need to use it to join with portfolioItems table
// to get most up-to-date portfolio value/worth.
export const tickersTable = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS tickers (
    ticker_name TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    date_added TIMESTAMP NOT NULL DEFAULT NOW(),
    price_last_changed TIMESTAMP NOT NULL DEFAULT NOW(),
    last_price DECIMAL(12, 2)
  );
`;

/* table containing watchlist items for each user. 
 */
export const watchlistTable = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS watchlist (
    watchlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id),
    date_added TIMESTAMP NOT NULL DEFAULT NOW(),
    ticker TEXT NOT NULL,
    CONSTRAINT ticker_tbl_user_symbol_unq unique (user_id, ticker)
  );
`

/* table containing worth of portfolio for each user. 
 */
export const portfolioGrowthTable = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS PortfolioGrowth (
    portfolioGrowth_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id),
    date_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    total_value DECIMAL(12, 2) NOT NULL
  );
`
export default [usersTable, tradesTable, portfolioTable, tickersTable, watchlistTable, portfolioGrowthTable];
