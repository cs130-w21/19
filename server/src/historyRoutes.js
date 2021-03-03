import express from 'express';
const router = express.Router()
import authMiddleware from './auth/authMiddleware.js';
import { pgPool } from './db/dbClient.js';

// NOTE: all these routes are prefixed with /api/history (see server.js)

/**
 * @api {get} /api/history Get history
 * @apiPermission auth
 * @apiDescription get the history log of all trades done by this account. Outputs an array of transactions in chronological order.
 * @apiGroup history
 *
 * @apiSuccess {Object[]} Trades array of trade item objects pertaining to user
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "trade": [
 *         {
 *           "trade_id": "51cb778c-6129-443e-8be4-0b8a96fa808a",
 *           "date_executed": "2021-02-12",
 *           "user_id": "61f004d1-56c0-4303-af89-fe39e904cbce",
 *           "ticker": "MSFT",
 *           "action": "buy",
 *           "quantity": "300",
 *           "unit_price_executed": "140.23",
 *         },
 *         {
 *           "trade_id": "51cb778c-6129-443e-8be4-0b8a96fa808b",
 *           "date_executed": "2021-02-12",
 *           "user_id": "61f004d1-56c0-4303-af89-fe39e904cbce",
 *           "ticker": "MSFT",
 *           "action": "sell",
 *           "quantity": "300",
 *           "unit_price_executed": "144.23",
 *         }
 *       ]
 *     }
 * @apiUse auth
 */


router.get('/', authMiddleware, async (req, res) => {
  const { rows }  = await pgPool.query(`
    SELECT * FROM Trades 
    WHERE user_id = $1
    ORDER BY date_executed ASC;`, 
    [ req.user.user_id ]);
  return res.json({
    Trades: rows,
  });
});

export default router;
