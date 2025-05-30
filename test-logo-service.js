// Test script for logo fetching service
import { LogoService } from './src/lib/logo-service.ts';

async function testLogoFetching() {
  console.log('Testing Logo Fetching Service...\n');
  
  const testBrands = [
    'Nike',
    'Apple',
    'Google',
    'Microsoft',
    'Amazon',
    'Facebook',
    'Coca Cola',
    'McDonald\'s',
    'Starbucks',
    'Samsung',
    'Unknown Brand XYZ' // This should generate a fallback logo
  ];
  
  for (const brand of testBrands) {
    console.log(`\nFetching logo for: ${brand}`);
    try {
      const result = await LogoService.fetchLogo(brand);
      console.log(`✓ Success!`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Source: ${result.source}`);
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
  }
}

testLogoFetching().catch(console.error);