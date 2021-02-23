import axios from 'axios';
import ws from 'ws';

const finnhubEndpoint = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const axiosAgent = axios.create({
  baseURL: finnhubEndpoint,
  headers: { 'X-Finnhub-Token': FINNHUB_API_KEY }
});

const getQuote = async (ticker) => {
  const res = await axiosAgent.get(`/quote?symbol=${encodeURI(ticker)}`);
  if (res.status !== 200) {
    throw new Error({ data: res.data, status: res.status });
  } else {
    const { o: open, h: high, l: low, c: current, pc: previousClose } = res.data;
    return { open, high, low, current, previousClose };
  }
}


// used to get all tickers 
const getAllTickers = async () => {
    const res = await axiosAgent.get('/stock/symbol?exchange=US');
  /* sample res.data:
[
  {
    "currency": "USD",
    "description": "UAN POWER CORP",
    "displaySymbol": "UPOW",
    "figi": "BBG000BGHYF2",
    "mic": "OTCM",
    "symbol": "UPOW",
    "type": "Common Stock"
  }, ... etc.
]*/
  return res.data.map((o) => ({ name: o.description, symbol: o.symbol }));
}


const getHistoricalData = async (ticker, resolution, from, to) => {
  /* get historical OHLC data for a ticker. Resolution can be one of the following:
   *  1  (1 min)
   *  5 (5 min)
   *  15 (15 min)
   *  30 (30 min)
   *  60 (60 min)
   *  D  (day)
   *  W (week)
   *  M (Month)
   */

  // NOTE: for the free tier, we can only get data from 1Y max.
  const res = await axiosAgent.get(`/stock/candle`, {
    params: {
      resolution,
      from,
      to,
      symbol: ticker,
    }
  });
  if (res.status !== 200) {
    throw new Error({ data: res.data, status: res.status });
  } else {
    const { o: opens, h: highs, l: lows, c: closes, v: volumes, t: timestamps, s } = res.data;
    return { opens, highs, lows, closes, volumes, timestamps, hasData: s !== 'no_data' };
  }
}
const FinnhubWsClient = new ws(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

export {
getQuote, getHistoricalData, getAllTickers, FinnhubWsClient,
}
