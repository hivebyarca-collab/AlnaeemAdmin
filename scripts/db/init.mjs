import { mkdirSync } from 'node:fs';
import { initializeDatabase } from '../../lib/database/index.ts';

mkdirSync('data/local', { recursive: true });
initializeDatabase();
console.log('Database initialized at data/local/al-naeem.sqlite');
