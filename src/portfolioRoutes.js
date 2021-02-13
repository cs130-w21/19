import express from 'express';
const router = express.Router()
import authMiddleware from './auth/authMiddleware.js';
import { pgPool } from './db/dbClient.js';

// NOTE: all these routes are prefixed with /api/portfolio (see server.js)

/**
 * @api {get} /api/portfolio Get portfolio
 * @apiPermission auth
 * @apiGroup portfolio
 *
 * @apiSuccess {Object[]} portfolioItems array of portfolio item objects pertaining to user
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "portfolioItems": [
 *         {
 *           "trade_id": "51cb778c-6129-443e-8be4-0b8a96fa808a",
 *           "date_executed": "2021-02-12",
 *           "user_id": "61f004d1-56c0-4303-af89-fe39e904cbce",
 *           "ticker": "MSFT",
 *           "action": "buy",
 *           "quantity": "300",
 *           "unit_price_executed": "50.40",
 *         }
 *       ]
 *     }
 * @apiUse auth
 */
router.get('/', authMiddleware, async (req, res) => {
  const { rows }  = await pgPool.query('SELECT * FROM PortfolioItems WHERE user_id = $1;', [ req.user.user_id ]);
  return res.json({
    portfolioItems: rows,
  });
});

export default router;
