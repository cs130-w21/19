import express from 'express';
import { getUpdatedPortfolio } from './portfolio/portfolio.js';
import authMiddleware from './auth/authMiddleware.js';
import marketFns from './marketData/marketPrice.js';
import { pgPool } from './db/dbClient.js';

const router = express.Router();
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
 *           "item_id": "51cb778c-6129-443e-8be4-0b8a96fa808a",
 *           "date_created": "2021-02-12",
 *           "date_changed": "2021-02-12",
 *           "user_id": "61f004d1-56c0-4303-af89-fe39e904cbce",
 *           "price_per_share": "234.45",
 *           "symbol": "MSFT",
 *           "quantity": "300",
 *           "value": "70335",
 *           "was_stale": false,
 *         },
 *         {
 *           "item_id": "21cb778c-6129-443e-8be4-0b8a96fa808a",
 *           "date_created": "2021-02-12",
 *           "date_changed": "2021-02-12",
 *           "user_id": "61f004d1-56c0-4303-af89-fe39e904cbce",
 *           "symbol": "USD",
 *           "price_per_share": "1",
 *           "quantity": "100000",
 *           "value": "100000",
 *         }
 *       ]
 *     }
 * @apiUse auth
 */
router.get('/', authMiddleware, async (req, res) => {
  const dbClient = await pgPool.connect();
  try {
    const portfolioItems = await getUpdatedPortfolio(dbClient, req.user.user_id);
    dbClient.release();
    return res.status(200).json(portfolioItems);
  } catch(e) {
    console.error(e);
    dbClient.release();
    return res.status(500).json({
      success: false,
      errorMessage: "error getting portfolio",
    });
  }
});

export default router;
