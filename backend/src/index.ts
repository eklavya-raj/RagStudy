import express from "express";
import { clerkMiddleware, getAuth } from '@clerk/express'
import cors from 'cors'
import dotenv from 'dotenv'
import { rateLimit, cleanupRateLimitStore } from './middleware/rateLimit'
import embeddingRouter from './routes/embedding'
import chatRouter from './routes/chat'

dotenv.config({ path: '.env.local' })

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
}));

app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));
app.use(rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 50
}));

app.use('/api', embeddingRouter);
app.use('/api', chatRouter);

app.get("/", (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log("User ID:", userId);
  res.json({ userId });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

setInterval(cleanupRateLimitStore, 5 * 60 * 1000);