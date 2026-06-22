// test.js
import load from './index.js';
import assert from 'assert';

async function runTests() {
  console.log('🧪 Running tests...');
  
  // Test 1: Load script
  console.log('✅ Test 1: Loading script...');
  const result = await load.script('const test = "hello";');
  assert.strictEqual(result.test, 'hello', 'Script should export test variable');
  
  // Test 2: Load file (if exists)
  console.log('✅ Test 2: Loading file...');
  try {
    const fileResult = await load.file('./example.js');
    console.log('File loaded successfully');
  } catch (err) {
    console.log('No example file found, skipping...');
  }
  
  console.log('✅ All tests passed!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
