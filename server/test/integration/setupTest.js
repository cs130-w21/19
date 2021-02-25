import { getAppWhenReady } from '../../server.js';
/* Global setup hook. This is to make sure no race conditions happen. */
before(async () => {
  console.log("initializing app for integration testing....");
  await getAppWhenReady();
});
