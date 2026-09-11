import express from 'express';
import path from 'path';
import cors from 'cors';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db';
import apiRoutes from './server/routes/apiRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to Database (Non-blocking for foundation phase if missing)
  await connectDB();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api', apiRoutes);

  // Handle invalid API routes
  app.use('/api/*', (req, res) => {
    res.status(404).type('application/json').json({ success: false, message: 'API route not found' });
  });

  // Global API error handler ensuring strict JSON, never HTML
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    const status = err.status || err.statusCode || 500;
    res.status(status).type('application/json').json({
      message: status === 401 || status === 403 ? 'Unauthorized' : (err.message || 'Internal Server Error'),
      success: false,
      detail: err.message,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
