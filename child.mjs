import { createServer } from 'vite';
import stylex from '@stylexjs/unplugin/vite';

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [stylex({ useCSSLayers: false })],
});

console.log(`httpServer: ${server.httpServer}`);
await server.close();
console.log('server.close() resolved');
// No process.exit(), outstanding work, or application timers: exit naturally.
