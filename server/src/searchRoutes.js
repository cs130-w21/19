import { miniSearchEngine } from './search/searchEngine.js';
import express from 'express';
import { pgPool } from './db/dbClient.js';

const router = express.Router()

/**
 * @api {get} /api/search search stock by ticker & company name
 * @apiPermission none
 * @apiGroup search
 * @apiParam (Query param) {String} searchString search string (company name / ticker)
 * @apiParam (Query param) {Number} maxResults maximum results to fetch (default: 7)
 *
 * @apiSuccess {Object[]} searchResults array of stock ticker item objects, empty array of no results.
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "searchResults": [
 *         {
 *           "symbol": "MSFT",
 *           "name": "Microsoft Corporation",
 *           "score": 20.344,
 *           "terms": [ "ms" ],
 *           "match": {
 *            "ms": [ "symbol" ]
 *           }
 *         }
 *       ]
 *     }
 */
router.get('/', async (req, res) => {
  const { searchString, maxResults } = req.query;
  if (!searchString || typeof searchString !== 'string') {
    return res.status(400).json({
      errorMessage: "Invalid searchString param / missing",
    });
  }
  let numResults = Number.parseInt(maxResults || '7');
  if (Number.isNaN(numResults) || numResults < 0) {
    return res.status(400).json({
      errorMessage: "Invalid maxResults query param",
    });
  }

  const searchResults = miniSearchEngine.search(searchString, { fuzzy: 0.2 }).slice(0, numResults)
    .map((result) => ({...result, id: undefined }));

  return res.json({
    searchResults,

  });
});

export default router;
