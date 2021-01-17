import express from 'express';
const router = express.Router()


// NOTE: all these routes are prefixed with /accounts (see server.js)
router.post('/login', (req, res) => {
  // TODO:
  res.json({ success: true });
});

export default router;
