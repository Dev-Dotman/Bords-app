const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('boarddocuments');

  // Remove explicit null shareToken from all docs so sparse index ignores them
  const result = await col.updateMany(
    { shareToken: null },
    { $unset: { shareToken: '' } }
  );
  console.log(`Unset shareToken on ${result.modifiedCount} docs`);

  // Drop all shareToken indexes and recreate as sparse unique
  const indexes = await col.indexes();
  for (const idx of indexes) {
    if (idx.key.shareToken) {
      console.log(`Dropping index: ${idx.name}`);
      await col.dropIndex(idx.name);
    }
  }
  await col.createIndex({ shareToken: 1 }, { unique: true, sparse: true });
  console.log('Created sparse unique index on shareToken');

  await mongoose.disconnect();
  console.log('Done');
})();
