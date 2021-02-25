export const addTestTickers = async (pgClient) => {
  await pgClient.query(`INSERT INTO tickers(ticker_name, full_name) 
      VALUES ('TEST_TICKER', 'TEST TICKER COMPANY'), ('TEST_TICKER_2', 'TEST TICKER COMPANY 2') ON CONFLICT DO NOTHING;`
  );
}

export const cleanupTestTickers = async (pgClient) => {
  await pgClient.query("DELETE FROM tickers WHERE ticker_name = 'TEST_TICKER' OR ticker_name = 'TEST_TICKER_2'");
}
