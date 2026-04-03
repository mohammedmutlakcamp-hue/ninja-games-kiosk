const { PeerServer } = require('peer');

const server = PeerServer({
  port: 9000,
  path: '/peerjs',
  allow_discovery: true,
  proxied: false,
});

server.on('connection', (client) => {
  console.log(`[PEER] Connected: ${client.getId()}`);
});

server.on('disconnect', (client) => {
  console.log(`[PEER] Disconnected: ${client.getId()}`);
});

console.log('[PEER] PeerJS signaling server running on port 9000');
