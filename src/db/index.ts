import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';

export const db = drizzle(process.env.DB_FILE_NAME!, { schema });