import { connectToDB } from "../db/drizzle";

let _db: Awaited<ReturnType<typeof connectToDB>> | null = null;

export async function getDB() {
  if (!_db) _db = await connectToDB();
  return _db;
}
