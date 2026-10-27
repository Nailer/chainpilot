import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { planRepayment } from './modules/position-guard.js';

export function createApp() {
  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, body) => { res.writeHead(status); res.end(JSON.stringify(body)); };
    if (req.method === 'GET' && req.url === '/health') {
      return send(200, { name: 'ChainPilot', status: 'prototype', execution: 'disabled', modules: ['position-guard'] });
    }
    if (req.method !== 'POST' || req.url !== '/v1/position-guard/plan') {
      return send(404, { error: 'Not found' });
    }
    try {
      if (!req.headers['content-type']?.startsWith('application/json')) {
        return send(415, { error: 'Use application/json' });
      }
      let raw = '';
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 16384) { send(413, { error: 'Request too large' }); req.resume(); return; }
        raw += chunk;
      }
      const { snapshot, policy } = JSON.parse(raw);
      send(200, planRepayment(snapshot, policy));
    } catch (error) {
      send(400, { error: error instanceof Error ? error.message : 'Invalid request' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3001);
  createApp().listen(port, '127.0.0.1', () => console.log(`ChainPilot prototype: http://127.0.0.1:${port}`));
}
