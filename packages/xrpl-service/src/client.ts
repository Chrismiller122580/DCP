import { Client } from 'xrpl';
import type { XrplConfig } from './types';

export type { XrplConfig };

const DEFAULTS = {
  testnet: 'wss://s.altnet.rippletest.net:51233',
  mainnet: 'wss://xrplcluster.com',
};

let clients: Record<string, Client> = {};

export async function getXrplClient(config: XrplConfig = { network: 'testnet' }): Promise<Client> {
  const url = config.wsUrl || DEFAULTS[config.network];
  const key = `${config.network}:${url}`;

  if (clients[key] && clients[key].isConnected()) {
    return clients[key];
  }

  const client = new Client(url, {
    connectionTimeout: 15000,
  });

  await client.connect();
  clients[key] = client;

  // Auto cleanup on close
  client.on('disconnected', () => {
    delete clients[key];
  });

  return client;
}

export async function disconnectAll(): Promise<void> {
  await Promise.all(Object.values(clients).map((c) => c.disconnect().catch(() => {})));
  clients = {};
}
