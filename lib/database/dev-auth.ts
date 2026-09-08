import { getUserById, getUsers, type User } from './index';

/** Development-only identity lookup. It intentionally has no password or token handling. */
export function devLogin(identifier: string): User | undefined {
  const normalized = identifier.trim().toLowerCase();
  return getUsers().find((user) => user.email?.toLowerCase() === normalized || user.phone === identifier.trim());
}

export function getDevUser(userId: string): User | undefined {
  return getUserById(userId);
}