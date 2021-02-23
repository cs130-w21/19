import path from 'path';
import MiniSearch from 'minisearch';
import { getAllTickers } from '../marketData/finnhub.js';
import pgFormat from 'pg-format';
import  { pgPool } from '../db/dbClient.js';


const miniSearchEngine = new MiniSearch({
  fields: ['symbol', 'name'], // fields to index for full-text search
  storeFields: ['symbol', 'name'] // fields to return with search results
})


const initializeSearchEngine = async () => {
  const { rows } = await pgPool.query('SELECT ticker_name as symbol, full_name as name FROM tickers;');
  let allUSTickers;
  if (rows.length === 0) {
    console.log("Detected empty tickers table. Adding stock tickers...");
    allUSTickers = await getAllTickers();
    const rowsToAdd = allUSTickers.map((x) => [ x.symbol, x.name ]);
    await pgPool.query(pgFormat(`
    INSERT INTO tickers(ticker_name, full_name) VALUES %L 
    ON CONFLICT(ticker_name) DO NOTHING;`, 
      rowsToAdd
    ));
  } else {
    allUSTickers = rows;
  }

  const searchEngineData = allUSTickers.map(({ symbol, name }, i) => ({
    symbol,
    name,
    id: i,
  }));

  miniSearchEngine.addAll(searchEngineData);
}

export {
  miniSearchEngine,
  initializeSearchEngine,
};


