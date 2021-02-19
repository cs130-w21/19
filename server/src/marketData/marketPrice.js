
/*
 * Function that outputs the current market price of an equity (ticker). 
 * Lives inside a database transaction in progress.
 */

const getMarketPrice = async (dbTxnClient, ticker) => {
  // TODO: implement this in live market data story.
  let pricePerShare = 50.40;
  return pricePerShare;
};


// we do this setting so that we can stub getMarketPrice easily without using proxyquire.
// Not a pretty workaround, but it works :(
const obj = {
  getMarketPrice,
};

export default obj;
