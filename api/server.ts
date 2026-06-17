import app from './app';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API base: http://localhost:${PORT}/api`);
  console.log(`🔗 Redirect base: http://localhost:${PORT}/r/:code`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => process.exit(0));
});

export default app;
