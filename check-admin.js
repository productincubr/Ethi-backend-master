// check-admin.js - Check if admin exists
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB...');

mongoose.set('strictQuery', false);
mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const adminSchema = new mongoose.Schema({
      admin_email: String,
      admin_name: String,
      admin_passowrd_enq: String,
      allow_access: String
    }, { 
      timestamps: true,
      collection: 'ethi_admins'
    });
    
    const Admin = mongoose.model('ethi_admin', adminSchema);
    
    // Find all admins
    const admins = await Admin.find({});
    console.log('\n📊 Total Admins in Database:', admins.length);
    
    if (admins.length === 0) {
      console.log('❌ No admins found in database!');
      console.log('💡 Run: node create-admin.js');
    } else {
      console.log('\n👥 Admins List:');
      admins.forEach((admin, index) => {
        console.log(`\n${index + 1}. Admin Details:`);
        console.log('   📧 Email:', admin.admin_email);
        console.log('   👤 Name:', admin.admin_name);
        console.log('   🔐 Access:', admin.allow_access);
        console.log('   🔑 Password Hash:', admin.admin_passowrd_enq);
      });
    }
    
    // Check specific admin
    const testAdmin = await Admin.findOne({ admin_email: 'admin@ethi.com' });
    if (testAdmin) {
      console.log('\n✅ Found admin@ethi.com');
      console.log('   Allow Access:', testAdmin.allow_access);
    } else {
      console.log('\n❌ admin@ethi.com NOT FOUND');
    }
    
    await mongoose.connection.close();
    console.log('\n👋 Disconnected');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
