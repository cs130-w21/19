import { getQuote } from './finnhub.js';
import pgFormat from 'pg-format';

const PRICE_STALENESS_TTL_SECS = process.env.PRICE_STALENESS_TTL_SECS || 30;
/*
 * Function that outputs the current market price of an equity (ticker).
 * can return stale data
 * Lives inside a database transaction in progress.
 * Throws an error if ticker not supported (i.e. not in ticker table).
 *
 * It also updates the new price if price is stale or not found.
 */

const getMarketPrice = async (dbTxnClient, ticker, updateIfStale=true) => {
  const { rows } = await dbTxnClient.query(`
    SELECT last_price,
    EXTRACT('epoch' FROM NOW() - price_last_changed) as secs_since_change
    FROM tickers
    WHERE ticker_name = $1
    `, [ ticker ] );
  if (rows.length === 0) {
    throw new Error(`ticker ${ticker} not found in table`);
  }

  const [{last_price, secs_since_change}, ] = rows;
  if (updateIfStale && (!last_price || parseInt(secs_since_change) > PRICE_STALENESS_TTL_SECS)) {
    // price is stale. Get new price and save to DB.
    const [currentPrice ] = await obj.updateMultiplePrices(dbTxnClient, [ticker]);
    return currentPrice.toFixed(2);
  } else {
    return parseFloat(last_price).toFixed(2);
  }
};

/* Returns a list of the updated prices (index corresponding to tickers array) 
  * for an array of ticker names.
  * */
const updateMultiplePrices = async (dbClient, tickerNames) => {
  if (tickerNames.length === 0){
    return [];
  }
  const arr = await Promise.all(tickerNames.map(ticker => getQuote(ticker)));

  const rowsToAdd = arr.map(({ current: price }, i) => [tickerNames[i], price]);
  const { rowCount } = await dbClient.query(pgFormat(`
    UPDATE tickers SET
      last_price = vals.last_price::DECIMAL(12,2), 
      price_last_changed = NOW() AT TIME ZONE 'UTC'
    FROM (VALUES %L) AS vals(ticker_name, last_price)
    WHERE tickers.ticker_name = vals.ticker_name;`,
    rowsToAdd));

  if (rowCount !== tickerNames.length) {
    throw new Error(`ERROR updating database for ${tickerNames} new price in tickers table. ${rowCount} !== ${tickerNames.length} tickers`);
  }

  return arr.map(({ current }) => current);
};



// we do this setting so that we can stub getMarketPrice easily without using proxyquire.
// Not a pretty workaround, but it works :(
const obj = {
  getMarketPrice,
  updateMultiplePrices,
  PRICE_STALENESS_TTL_SECS,
};

export default obj;
