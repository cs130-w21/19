import express from 'express';
const router = express.Router()
import authMiddleware from './auth/authMiddleware.js';
import { pgPool } from './db/dbClient.js';
import { validTicker } from './utils/validation.js';

/**
 * @api {get} /api/watchlist Get stocks watchlist
 * @apiPermission auth
 * @apiGroup watchlist
 *
 * @apiSuccess {Object[]} watchlist array of watchlist item objects pertaining to user
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "watchlistItems": [
 *         {
 *           "watchlist_id": "51cb778c-6129-443e-8be4-0b8a96fa808a",
 *           "date_created": "2021-02-12",
 *           "ticker": "MSFT",
 *         },
 *         {
 *           "watchlist_id": "21cb778c-6129-443e-8be4-0b8a96fa808a",
 *           "date_created": "2021-02-12",
 *           "ticker": "PLTR",
 *         }
 *       ]
 *     }
 * @apiUse auth
 */
router.get('/', authMiddleware, async (req, res) => {
  const { rows: watchlistItems }  = await pgPool.query(`
    SELECT watchlist_id, date_added, ticker, 50.40 AS last_price
    FROM watchlist WHERE user_id = $1;`,
    [ req.user.user_id ]);
  return res.json({
    watchlistItems,
  });
});

/**
 * @api {put} /api/watchlist/:ticker Add stock to watchlist
 * @apiPermission auth
 * @apiUse auth
 * @apiGroup watchlist
 * @apiParam {String} ticker capitalized stock ticker e.g. MSFT
 *
 * @apiSuccess {Boolean} success set to true if successful.
 *
 * @apiError {Boolean} success (false)
 * @apiError {String} errorMessage useful error message that states why it failed.
 *
 */
router.put('/:ticker', authMiddleware, async (req, res) => {
  const { ticker } = req.params;
  if (!validTicker(ticker)) {
    return res.status(400).json({ 
      errorMessage: "Invalid ticker",
      success: false,
    });
  }
  const { rowCount }  = await pgPool.query(`
    INSERT INTO watchlist(user_id, ticker)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING;
    `, [ req.user.user_id, ticker ]);
  if (rowCount === 0) {
    return res.status(400).json({ 
      errorMessage: "Stock already watchlisted.",
      success: false,
    });
  } else {
    return res.json({
      success: true,
    });
  }
});


/**
 * @api {delete} /api/watchlist/:ticker delete stock from watchlist
 * @apiPermission auth
 * @apiUse auth
 * @apiGroup watchlist
 * @apiParam {String} ticker capitalized stock ticker e.g. MSFT
 *
 * @apiSuccess {Boolean} success set to true if successful.
 *
 * @apiError {Boolean} success (false)
 * @apiError {String} errorMessage useful error message that states why it failed.
 *
 */
router.delete('/:ticker', authMiddleware, async (req, res) => {
  const { ticker } = req.params;
  if (!validTicker(ticker)) {
    return res.status(400).json({ 
      errorMessage: "Invalid ticker",
      success: false,
    });
  }
  const { rowCount }  = await pgPool.query(`
  DELETE FROM watchlist
  WHERE user_id = $1 AND ticker = $2;
  `, [ req.user.user_id, ticker ]);
  if (rowCount === 0) {
    return res.status(404).json({ 
      errorMessage: "Stock not watchlisted. Cannot delete.",
      success: false,
    });
  } else {
    return res.json({
      success: true,
    });
  }
});

export default router;
