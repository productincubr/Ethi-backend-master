// create-admin.js - Admin account banane ke liye
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// Password encryption function (same as backend)
const make_password = (password) => {
  return crypto.createHash('md5').update(password).digest('hex');
};

const uri = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB...');

mongoose.set('strictQuery', false);
mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Admin schema (exactly as in model)
    const adminSchema = new mongoose.Schema({
      entry_date: String,
      admin_name: String,
      admin_mobile_no: String,
      admin_email: String,
      admin_image: String,
      admin_type: String,
      admin_city: String,
      admin_country: String,
      admin_education: String,
      admin_join_date: String,
      admin_state: String,
      admin_zipcode: String,
      admin_password: String,
      admin_passowrd_enq: String,
      allow_access: String,
      flag: String
    }, { 
      timestamps: true,
      collection: 'ethi_admins' // Mongoose default plural name
    });
    
    const Admin = mongoose.model('ethi_admin', adminSchema);
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ admin_email: 'admin@ethi.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log('📧 Email:', existingAdmin.admin_email);
      console.log('👤 Name:', existingAdmin.admin_name);
      console.log('🔐 Access:', existingAdmin.allow_access);
      console.log('\n💡 Use these credentials:');
      console.log('   Email: admin@ethi.com');
      console.log('   Password: admin123');
    } else {
      // Create new admin
      const password = 'admin123';
      const encryptedPassword = make_password(password);
      
      const newAdmin = new Admin({
        entry_date: new Date().toISOString(),
        admin_name: 'Super Admin',
        admin_mobile_no: '+919876543210',
        admin_email: 'admin@ethi.com',
        admin_image: 'default-admin.png',
        admin_type: 'Super Admin',
        admin_city: 'Mumbai',
        admin_country: 'India',
        admin_education: 'MBA',
        admin_join_date: new Date().toISOString(),
        admin_state: 'Haryana',
        admin_zipcode: '400001',
        admin_password: password,
        admin_passowrd_enq: encryptedPassword,
        allow_access: '1', // IMPORTANT: Must be "1" for access
        flag: 'c' // Active flag
      });
      
      const result = await newAdmin.save();
      console.log('✅ Admin created successfully!');
      console.log('📧 Email: admin@ethi.com');
      console.log('🔑 Password: admin123');
      console.log('🆔 ID:', result._id.toString());
      console.log('🔐 Encrypted Password:', encryptedPassword);
      console.log('\n✨ You can now login with:');
      console.log('   Email: admin@ethi.com');
      console.log('   Password: admin123');
    }
    
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  });
