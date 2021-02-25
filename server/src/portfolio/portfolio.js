import marketFns from '../marketData/marketPrice.js';

const PORTFOLIO_STALENESS_SECS = 3600;

/**
 * Given a pg client and userId, return the portfolio rows with current price.
 * If price is staler than PORTFOLIO_STALENESS_SECS, update it 
 *
 */
export const getUpdatedPortfolio = async (dbClient, userId) => {
  const { rows: portfolioRows }  = await dbClient.query(`
    SELECT
      P.item_id,
      P.date_created,
      P.date_changed,
      P.symbol,
      P.quantity,
      CASE WHEN symbol = 'USD' then 1 ELSE T.last_price END as price_per_share,
      CASE WHEN symbol = 'USD' then
        false
      ELSE
        EXTRACT('epoch' FROM NOW() - T.price_last_changed) > $1 END as was_stale
    FROM PortfolioItems P
    LEFT JOIN tickers T ON P.symbol = T.ticker_name
    WHERE P.user_id = $2
    `,
    [ PORTFOLIO_STALENESS_SECS, userId ]);
  const staleTickers = portfolioRows.filter((p) => p.was_stale);
  const staleIdToPriceMap = {};

  if (staleTickers.length > 0) {
    const newPrices = await marketFns.updateMultiplePrices(dbClient, staleTickers.map((t) => t.symbol));
    newPrices.forEach((newPrice, i) => {
      staleIdToPriceMap[staleTickers[i].item_id] = newPrices[i];
    });
  }

  const portfolioItems = portfolioRows.map((item) => {
    if (staleIdToPriceMap[item]) {
      return {
        ...item,
        price_per_share: staleIdToPriceMap[item.item_id],
      }
    } else {
      return item;
    }
  });
  return portfolioItems;
}
