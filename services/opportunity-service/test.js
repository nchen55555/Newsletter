import 'dotenv/config';
import { importCompanies } from './lib/import-with-descriptions.js';

console.log('🚀 Starting import test...\n');

try {
  const result = await importCompanies();
  console.log('\n✅ Success!');
  console.log(`📊 Imported ${result.count} companies`);
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error);
}