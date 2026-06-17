import app from './app';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 API base: http://localhost:${port}/api`);
  console.log(`🔗 Redirect base: http://localhost:${port}/r/:code`);
});
