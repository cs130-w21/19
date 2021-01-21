import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

// have to import using .js extension, a wierd nodejs quirk
import accountRoutes from './src/accountRoutes.js';

const app = express();
if (process.env.NODE_ENV !== 'stonks-dev') {
  app.use(express.static(path.join('client', 'build')));
}

app.get('/api/health', (req, res) => {
  res.json({
    "success": "true"
  });
});

// register the main routes here.
app.use('/accounts', accountRoutes);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("App listening on port", port);
});
