import path from 'path';
import MiniSearch from 'minisearch';
import csvToJson from 'csvtojson';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stocksFilePath = path.join(__dirname, 'nasdaq_screener_stocks.csv');

const miniSearchEngine = new MiniSearch({
  fields: ['symbol', 'name'], // fields to index for full-text search
  storeFields: ['symbol', 'name'] // fields to return with search results
})


const initializeSearchEngine = async () => {
  const jsonObj = await csvToJson().fromFile(stocksFilePath);
  const finalJsonObj = jsonObj.map((x, i) => ({ 
    symbol: x.Symbol,
    name: x.Name,
    id: i,
  }));
  miniSearchEngine.addAll(finalJsonObj);
}

export {
  miniSearchEngine,
  initializeSearchEngine,
};


