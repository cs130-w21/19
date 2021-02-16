import express from 'express';
const router = express.Router()
import { checkMarketOpen } from './utils/markets.js';
import authMiddleware from './auth/authMiddleware.js';
import getMarketFns from './marketData/marketPrice.js';
import { pgPool } from './db/dbClient.js';

// NOTE: all these routes are prefixed with /api/trading (see server.js)

// router-specific middleware to always check trading time of day.
router.use((_, res, next) => {
  if(checkMarketOpen()) {
    next();
  } else {
    res.status(404).json({
      errorMessage: 'market is not open.',
      success: false,
    });
  }
});

function validStockQuantity(stockQuantity){
  if (Number.isNaN(stockQuantity)) {
    return false;
  }
  if (stockQuantity <= 0) {
    return false;
  }
  if (!Number.isInteger(stockQuantity)) {
    return false;
  }
  return true;
}

function validTicker(ticker) {
  if (typeof ticker !== 'string') {
    return false;
  }
  if (ticker.length === 0) {
    return false;
  }
  return true;
}

function respond(res, status, body) {
  return res.staus(status).json(body);
}

const invalidStockQuantityErrorResponse = {
  errorMessage: 'quantity body field not a valid positive integer',
  success: false,
};

const invalidTickerErrorResponse = {
  errorMessage: 'ticker is not a valid non-empty string',
  success: false,
};

/*
* executeMarketBuyOrder and executeMarketSellOrder are promise functions that 
* initiates and fills a market order for the userId, ticker and quantity.
* Inside, it Creates a DB transaction to ensure atomic bookkeeping. Returns:
* {
*   status: 200 (200 if filled ,400 if out of money, 500 if server error).
*   errorMessage: "text to return to client if anything fails, otherwise undefined",
* }
*
* We abstract this logic so that unit testing the functions are easy.
*
*/
export const executeMarketBuyOrder = async (userId, ticker, stockQuantity) => {
  const dbClient = await pgPool.connect();
  try {
    // first, get current price of S and get current portfolio money balance.
    await dbClient.query(`BEGIN`);
    const pricePerShare = await getMarketFns.getMarketPrice(dbClient, ticker);
    const { rows: qRows } = await dbClient.query(`
      SELECT quantity FROM portfolioItems WHERE user_Id = $1 AND symbol = 'USD';
    `, [ userId ]);

    if (qRows.length === 0) {
      throw Error(`No money (USD) present in client account ${userId}`);
    }
    const moneyOwned = qRows[0].quantity;
    const moneyToUse = pricePerShare * stockQuantity;
    if (moneyOwned < moneyToUse) {
      await dbClient.query('ROLLBACK');
      dbClient.release();
      return {
        status: 400,
        errorMessage: 'not enough money to buy requested amount of shares.',
      };
    }

    // Then we do some bookkeeping in the DB.
    const curDate = new Date();

    // 1. Insert a record to book the trade:
    const { rowCount: tradeRowCount } = await dbClient.query(`
    INSERT INTO Trades(date_executed, user_id, ticker, action, quantity, unit_price_executed)
    VALUES ($1, $2, $3, $4, $5, $6)
    `, [curDate, userId, ticker, 'buy', stockQuantity, pricePerShare]);

    if (tradeRowCount === 0) {
      throw Error('failed to insert to Trades table');
    }

    // 2. Insert the bought stock into portfolio, or if sold, then update quantity.
      const { rowCount: addPortfolioRowCount } = await dbClient.query(`
        INSERT INTO PortfolioItems(date_created, date_changed, user_id, symbol, quantity)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT(symbol, user_id) DO UPDATE SET quantity = PortfolioItems.quantity + $5;
      `, [ curDate, curDate, userId, ticker, stockQuantity ]);

      if (addPortfolioRowCount === 0) {
        throw Error('failed to insert to portfolioItems table');
      }

    // 3. Update our remaining money balance:
    const { rowCount: moneyRowCount } = await dbClient.query(`
      UPDATE PortfolioItems
      SET quantity = quantity - $1
      WHERE user_id = $2 AND symbol = 'USD';
    `, [ moneyToUse, userId ]);

    if (moneyRowCount === 0) {
      throw Error('failed to update money on portfolioItems table');
    }

    // And we are done!
    await dbClient.query('COMMIT');
    dbClient.release()
  } catch (e) {
    console.error(e);
    await dbClient.query('ROLLBACK');
    dbClient.release()
    return {
      status: 500,
      errorMessage: 'We could not process your trade. Please try again later',
    };
  }
  return {
    status: 200,
  }
};

export const executeMarketSellOrder = async (userId, ticker, stockQuantity) => {
  const dbClient = await pgPool.connect();
  try {
    // first, get current price of S and get current portfolio money balance.
    const pricePerShare = await getMarketFns.getMarketPrice(ticker);
    await dbClient.query(`BEGIN`);
    const moneyToReceive = pricePerShare * stockQuantity;
    const curDate = new Date();
    // finally, we can now execute the trade.
    // 0. Check that there is enough quantity to sell
    const { rows: quantityRows} = await dbClient.query(`
      SELECT quantity FROM PortfolioItems
      WHERE
        user_id = $1
        AND quantity >= $2
        AND symbol = $3;
    `, [ userId, stockQuantity, ticker]);
    if (quantityRows.length === 0) {
      await dbClient.query('ROLLBACK');
      dbClient.release()
      return {
        status: 400,
        errorMessage: 'Not enough stock to sell / not owned.',
      };
    }
    // 1. Insert a record to book the trade:
    const { rowCount: tradeRowCount } = await dbClient.query(`
    INSERT INTO Trades(date_executed, user_id, ticker, action, quantity, unit_price_executed)
    VALUES ($1, $2, $3, $4, $5, $6)
    `, [curDate, userId, ticker, 'sell', stockQuantity, pricePerShare]);
    if (tradeRowCount === 0) {
      throw Error('failed to insert to Trades table');
    }
    // 2. Update stock into portfolio:
    const { rowCount: updatePortfolioRowCount } = await dbClient.query(`
      UPDATE PortfolioItems
      SET quantity = PortfolioItems.quantity - $1
      WHERE user_id = $2 AND symbol = $3;
    `, [ stockQuantity, userId, ticker ]);
    if (updatePortfolioRowCount=== 0) {
      throw Error('failed to update sell stock qty on portfolioItems table');
    }
    // 3. Update our remaining money balance:
    const { rowCount: moneyRowCount } = await dbClient.query(`
      UPDATE PortfolioItems
      SET quantity = quantity + $1
      WHERE user_id = $2 AND symbol = 'USD';
    `, [ moneyToReceive, userId ]);
    if (moneyRowCount === 0) {
      throw Error('failed to update money on portfolioItems table');
    }
    // Pi. Delete dangling row from DB:
    if (quantityRows[0].quantity == stockQuantity) {
      const { rowCount: deleted } = await dbClient.query(`
      DELETE PortfolioItems
      WHERE user_id = $1 AND symbol = $2;
    `, [userId, ticker ]);
      if (deleted !== 1 ) {
        throw Error('failed to delete dangling row from from portfolioItems table');
      }
    }
    // And we are done!
    await dbClient.query('COMMIT');
    dbClient.release()
  } catch (e) {
    console.error(e)
    await dbClient.query('ROLLBACK');
    dbClient.release()
    return {
      status: 500,
      errorMessage: 'We could not process your trade. Please try again later',
    };
  }
  return {
    status: 200,
  }
}

/**
* @api {post} /api/trading/buy Buy a stock
* @apiPermission auth
* @apiUse auth
* @apiGroup trading
* @apiParam (Request body) {String} ticker capitalized stock ticker e.g. MSFT 
* @apiParam (Request body) {Number} quantity positive integer indicating amount to buy
*
* @apiSuccess {Boolean} success set to true if successful.
* @apiSuccess {String} message order status message.
*
* @apiError {Boolean} success (false)
* @apiError {String} errorMessage useful error message that states why it failed.
*
*/
router.post('/buy', authMiddleware, async (req, res) => {

  // first, we make sure the request data is valid.
  const stockQuantity = parseInt(req.body.quantity);
  if (!validStockQuantity(stockQuantity)) {
    return res.status(400).json(invalidStockQuantityErrorResponse);
  }
  const { ticker } = req.body;
  if (typeof ticker !== 'string' || ticker.length === 0) {
    return res.status(400).json({
      errorMessage: 'ticker is not a valid non-empty string',
      success: false,
    });
  }

  if (ticker === 'USD') {
    return res.status(400).json({
      errorMessage: 'ticker cannot be a currency.',
      success: false,
    });
  }

  const userId = req.user.user_id;
  const { status: httpStatus, errorMessage } = await executeMarketBuyOrder(userId, ticker, stockQuantity);

  if (httpStatus === 200 ) {
    return res.status(200).json({
      success: true,
      message: 'order filled',
    });
  } else {
    return res.status(httpStatus).json({
      errorMessage,
      success: false,
    });
  }
});


/**
* @api {post} /api/trading/sell Sell a stock
* @apiPermission auth
* @apiUse auth
* @apiGroup trading
* @apiParam (Request body) {String} ticker capitalized stock ticker e.g. MSFT 
* @apiParam (Request body) {Number} quantity positive integer indicating amount to sell
*
* @apiSuccess {Boolean} success set to true if successful.
* @apiSuccess {String} message order status message.
*
* @apiError {Boolean} success (false)
* @apiError {String} errorMessage useful error message that states why it failed.
*/
router.post('/sell', authMiddleware, async (req, res) => {
  // first, we make sure the request data is valid.
  const stockQuantity = parseInt(req.body.quantity);
  if (!validStockQuantity(stockQuantity)) {
    return res.status(400).json(invalidStockQuantityErrorResponse);
  }
  const { ticker } = req.body;
  if (typeof ticker !== 'string' || ticker.length === 0) {
    return res.status(400).json({
      errorMessage: 'ticker is not a valid non-empty string',
      success: false,
    });
  }
  if (ticker === 'USD') {
    return res.status(400).json({
      errorMessage: 'ticker cannot be a currency.',
      success: false,
    });
  }

  const userId = req.user.user_id;
  const { status: httpStatus, errorMessage } = await executeMarketSellOrder(userId, ticker, stockQuantity);

  if (httpStatus === 200 ) {
    return res.status(200).json({
      success: true,
      message: 'order filled',
    });
  } else {
    return res.status(httpStatus).json({
      errorMessage,
      success: false,
    });
  }
});
export default router;
