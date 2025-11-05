const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { setupWSConnection } = require('y-websocket/bin/utils');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Y-WebSocket server is running');
});

const wss = new WebSocket.Server({ server });
const persistenceDir = path.join(__dirname, 'persistence');

// Create persistence directory if it doesn't exist
if (!fs.existsSync(persistenceDir)) {
  fs.mkdirSync(persistenceDir, { recursive: true });
}

console.log('🗂️  Persistence directory:', persistenceDir);

wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  setupWSConnection(ws, req);
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`🚀 Y-WebSocket server running on ws://localhost:${PORT}`);
});

