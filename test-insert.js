// test-insert.js
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('Using URI (masked):', uri ? uri.replace(/:\/\/.*?:/,'://user:***:') : 'NO_URI');

mongoose.set('strictQuery', false);
mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    const TestSchema = new mongoose.Schema({ name: String, createdAt: Date }, { collection: 'ethi_test_conn' });
    const Test = mongoose.model('TestConn', TestSchema);
    const doc = new Test({ name: 'connection-test', createdAt: new Date() });
    const res = await doc.save();
    console.log('Insert OK:', res._id.toString());
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection/Insert error:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  });
