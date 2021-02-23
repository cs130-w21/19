import { getQuote } from './finnhub.js';

const PRICE_STALENESS_TTL_SECS = process.env.PRICE_STALENESS_TTL_SECS || 30;
/*
 * Function that outputs the current market price of an equity (ticker).
 * can return stale data
 * Lives inside a database transaction in progress.
 * Throws an error if ticker not supported (i.e. not in ticker table).
 *
 * It also updates the new price if price is stale or not found.
 * TODO: should make a unit test for this.
 */

const getMarketPrice = async (dbTxnClient, ticker, updateIfStale=true) => {
  const { rows } = await dbTxnClient.query(`
    SELECT last_price,
    EXTRACT('second' FROM NOW() - price_last_changed) as secs_since_change
    FROM tickers
    WHERE ticker_name = $1
    `, [ ticker ] );
  if (rows.length === 0) {
    throw new Error(`ticker ${ticker} not found in table`);
  }

  const [{last_price, secs_since_change}, ] = rows;
  if (updateIfStale && (!last_price || secs_since_change  > PRICE_STALENESS_TTL_SECS)) {
    // price is stale. Get new price and save to DB.
    const currentPrice = await updateLatestMarketPrice(dbTxnClient, ticker);
    return currentPrice;
  } else {
    return last_price;
  }
};

const updateLatestMarketPrice = async (dbClient, ticker) => {
  const { current: currentPrice } = await getQuote(ticker);
  const { rowCount } = await dbClient.query(`
    UPDATE tickers
    SET last_price = $1,
    price_last_changed = NOW()
    WHERE ticker_name = $2;
  `, [ currentPrice, ticker ]);
  if (rowCount === 0) {
    throw new Error(`ERROR updating database for ${ticker} new price in tickers table`);
  }
  return currentPrice;
};



// we do this setting so that we can stub getMarketPrice easily without using proxyquire.
// Not a pretty workaround, but it works :(
const obj = {
  getMarketPrice,
  updateLatestMarketPrice,
};

export default obj;
