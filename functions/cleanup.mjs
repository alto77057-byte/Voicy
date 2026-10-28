// Runs daily: deletes expired audio/translations and old counters.
import core from './lib/core.mjs';
import { makeAdapters, makeEnv } from './lib/adapters.mjs';

export default async () => {
  const env = makeEnv();
  let p;
  await core.scheduled({}, env, { waitUntil: x => { p = x; } });
  await p;

  const { dataStore } = makeAdapters();
  const { blobs } = await dataStore.list();
  let n = 0;
  for (const b of blobs) {
    if (!/^(d|r):/.test(b.key) || ++n > 500) continue;
    const m = await dataStore.getMetadata(b.key);
    if (m && m.metadata && m.metadata.exp < Date.now()) await dataStore.delete(b.key);
  }
};

export const config = { schedule: '@daily' };
