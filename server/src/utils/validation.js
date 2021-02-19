function validTicker(ticker) {
  if (typeof ticker !== 'string') {
    return false;
  }
  if (ticker.length === 0) {
    return false;
  }
  if(ticker.toUpperCase() !== ticker) {
    return false;
  }
  return true;
}

export { validTicker };
