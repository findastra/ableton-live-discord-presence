import net from 'node:net';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';

const MAX_FRAME = 1024 * 1024;
export function frame(op, payload) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload));
  const head = Buffer.alloc(8);
  head.writeUInt32LE(op, 0);
  head.writeUInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
}

export class Decoder {
  buffer = Buffer.alloc(0);
  push(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const messages = [];
    while (this.buffer.length >= 8) {
      const length = this.buffer.readUInt32LE(4);
      if (length > MAX_FRAME) throw new Error('Oversized Discord frame.');
      if (this.buffer.length < length + 8) break;
      messages.push({ op: this.buffer.readUInt32LE(0), body: this.buffer.subarray(8, 8 + length) });
      this.buffer = this.buffer.subarray(8 + length);
    }
    return messages;
  }
}

export class DiscordRPC extends EventEmitter {
  socket = null;
  ready = false;
  connecting = null;
  pending = new Map();
  generation = 0;

  async connect(clientId) {
    if (this.ready) return;
    if (this.connecting) return this.connecting;
    if (process.platform !== 'win32') throw new Error('This version supports Windows desktop Discord.');
    const generation = this.generation;
    this.connecting = (async () => {
      for (let i = 0; i < 10; i++) {
        if (generation !== this.generation) throw new Error('Connection cancelled.');
        try { await this.openPipe(`\\\\.\\pipe\\discord-ipc-${i}`, clientId); return; }
        catch (error) { if (error.rpcFatal) throw error; }
      }
      throw new Error('Open Discord desktop and sign in. Retrying automatically.');
    })();
    try { await this.connecting; } finally { this.connecting = null; }
  }

  openPipe(path, clientId) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(path);
      this.socket = socket;
      const decoder = new Decoder();
      let settled = false;
      const timer = setTimeout(() => fail(new Error('Discord handshake timed out.')), 1500);
      const fail = error => {
        clearTimeout(timer);
        if (!settled) { settled = true; reject(error); }
        socket.destroy();
      };
      socket.on('connect', () => socket.write(frame(0, { v: 1, client_id: clientId })));
      socket.on('error', fail);
      socket.on('close', () => {
        clearTimeout(timer);
        if (!settled) { settled = true; reject(new Error('Discord closed the connection.')); }
        if (this.socket === socket) {
          this.ready = false;
          this.socket = null;
          for (const pending of this.pending.values()) pending.reject(new Error('Discord disconnected.'));
          this.pending.clear();
          this.emit('disconnected');
        }
      });
      socket.on('data', chunk => {
        try {
          for (const { op, body } of decoder.push(chunk)) {
            if (op === 3) { socket.write(frame(4, body)); continue; }
            if (op === 2) { fail(new Error('Discord closed the session. Check the Application ID.')); return; }
            if (op !== 1) continue;
            const message = JSON.parse(body.toString());
            if (message.evt === 'READY') {
              clearTimeout(timer);
              settled = true;
              this.ready = true;
              resolve();
            } else if (message.nonce && this.pending.has(message.nonce)) {
              const request = this.pending.get(message.nonce);
              this.pending.delete(message.nonce);
              if (message.evt === 'ERROR') request.reject(new Error('Discord rejected the activity. Check the Application ID and image asset.'));
              else request.resolve();
            } else if (message.evt === 'ERROR' && !settled) {
              const error = new Error('Discord rejected the Application ID.');
              error.rpcFatal = true;
              fail(error);
            }
          }
        } catch { fail(new Error('Invalid Discord response.')); }
      });
    });
  }

  setActivity(activity) {
    if (!this.ready || !this.socket) return Promise.reject(new Error('Discord is not connected.'));
    const nonce = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(nonce);
        reject(new Error('Discord did not acknowledge the activity.'));
        this.disconnect();
      }, 5000);
      this.pending.set(nonce, {
        resolve: () => { clearTimeout(timer); resolve(); },
        reject: error => { clearTimeout(timer); reject(error); },
      });
      this.socket.write(frame(1, { cmd: 'SET_ACTIVITY', args: { pid: process.pid, activity }, nonce }));
    });
  }

  disconnect() {
    this.generation++;
    this.ready = false;
    this.socket?.destroy();
    this.socket = null;
    for (const request of this.pending.values()) request.reject(new Error('Discord disconnected.'));
    this.pending.clear();
    this.emit('disconnected');
  }
}
