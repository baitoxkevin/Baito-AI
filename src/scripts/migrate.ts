import { applyMigration } from '../lib/migrations';

async function main() {
  try {
    await applyMigration();
    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
