import express from 'express';
const router = express.Router();

// GET /webhook - Verification endpoint for Facebook Messenger Developer account
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// POST /webhook - Receives Messenger messages or events
router.post('/', async (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    body.entry?.forEach(entry => {
      const webhook_event = entry.messaging?.[0];
      if (webhook_event) {
        console.log('Received Messenger webhook event:', webhook_event);
      }
    });
    return res.status(200).send('EVENT_RECEIVED');
  }
  res.sendStatus(404);
});

export default router;
