
// returns a boolean that indicates whether markets are open or not.
// we are using NYSE / NASDAQ US stock markets, so they open
// monday to friday 9:30am - 4pm ET.
// Normally, federal holidays are included, but for the sake 
// of simplicity we're not doing it here.
export const checkMarketOpen = () => {
  const date = new Date();
  const HH = date.getHours();
  const mm = date.getMinutes();
  const dow = date.getDay();

  const elapsedMinsDay = HH * 60 + mm;
  const isDuringTime = (9*60 + 30) <= elapsedMinsDay && elapsedMinsDay <= (16 * 60);

  const isWeekday = 1 <= dow && dow <= 5;
  return /*isDuringTime && isWeekday*/ true; // TODO: temporary
}

export default {
  checkMarketOpen,
}
