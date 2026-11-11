import { readConfig } from './config.js';
import { createBackend } from './app.js';
try {
  const config = readConfig();
  const backend = createBackend(config);
  backend.http.listen(config.PORT, config.HOST, () => console.log(`RuralCare 360 backend: http://${config.HOST}:${config.PORT}\nDatabase connectivity checked; migrations applied.`));
  backend.http.on('error', error => { console.error('Server startup failed:', error.message); process.exitCode = 1; void backend.close(); });
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => {
    if (stopping) return; stopping = true; void backend.close().then(() => process.exit(0));
  });
} catch (error) {
  console.error('Startup failed. Check environment and database configuration.', error instanceof Error ? error.name : 'Unknown error');
  process.exitCode = 1;
}
