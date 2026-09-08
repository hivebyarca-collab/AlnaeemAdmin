import { rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const dbPath = process.env.AL_NAEEM_DATABASE_PATH ?? path.join(process.cwd(), 'data', 'local', 'al-naeem.sqlite');
try {
  rmSync(dbPath, { force: true });
  mkdirSync(path.dirname(dbPath), { recursive: true });
  console.log('Removed', dbPath);
} catch (error) {
  console.error(error);
  process.exit(1);
}
