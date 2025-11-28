// create-doctor.js - Doctor account banane ke liye
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
    
    // Doctor schema (based on ethi_doctor_master model)
    const doctorSchema = new mongoose.Schema({
      entry_date: String,
      doctor_name: String,
      doctor_mobile: String,
      doctor_email: String,
      doctor_image: String,
      doctor_profession: String,
      doctor_city: String,
      doctor_country: String,
      doctor_education: String,
      doctor_join_date: String,
      doctor_state: String,
      doctor_zipcode: String,
      doctor_password: String,
      doctor_passowrd_enq: String,
      allow_access: String,
      flag: String,
      // Additional fields that might be in the model
      user_email: String,
      user_mobile: String,
      doctor_specialization: String,
      doctor_experience: String,
      doctor_fees: String
    }, { 
      timestamps: true,
      collection: 'ethi_doctor_masters' // Collection name
    });
    
    const Doctor = mongoose.model('ethi_doctor_master', doctorSchema);
    
    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ doctor_email: 'doctor@ethi.com' });
    
    if (existingDoctor) {
      console.log('⚠️  Doctor already exists!');
      console.log('📧 Email:', existingDoctor.doctor_email);
      console.log('👤 Name:', existingDoctor.doctor_name);
      console.log('🔐 Access:', existingDoctor.allow_access);
      console.log('\n💡 Use these credentials:');
      console.log('   Email: doctor@ethi.com');
      console.log('   Password: doctor123');
      console.log('   OR');
      console.log('   Phone: +919876543210 (with OTP)');
    } else {
      // Create new doctor
      const password = 'doctor123';
      const encryptedPassword = make_password(password);
      
      const newDoctor = new Doctor({
        entry_date: new Date().toISOString(),
        doctor_name: 'Dr. Test Doctor',
        doctor_mobile: '+919876543210',
        doctor_email: 'doctor@ethi.com',
        doctor_image: 'default-doctor.png',
        doctor_profession: 'Nutritionist',
        doctor_city: 'Mumbai',
        doctor_country: 'India',
        doctor_education: 'MBBS, MD (Nutrition)',
        doctor_join_date: new Date().toISOString(),
        doctor_state: 'Maharashtra',
        doctor_zipcode: '400001',
        doctor_password: password,
        doctor_passowrd_enq: encryptedPassword,
        allow_access: '1', // IMPORTANT: Must be "1" for access
        flag: 'c', // Active flag
        user_email: 'doctor@ethi.com', // Same as doctor_email
        user_mobile: '+919876543210',
        doctor_specialization: 'Clinical Nutrition',
        doctor_experience: '5 years',
        doctor_fees: '1000'
      });
      
      const result = await newDoctor.save();
      console.log('✅ Doctor created successfully!');
      console.log('📧 Email: doctor@ethi.com');
      console.log('🔑 Password: doctor123');
      console.log('📱 Phone: +919876543210');
      console.log('🆔 ID:', result._id.toString());
      console.log('🔐 Encrypted Password:', encryptedPassword);
      console.log('\n✨ You can now login with:');
      console.log('   Method 1: Email + Password');
      console.log('   Email: doctor@ethi.com');
      console.log('   Password: doctor123');
      console.log('\n   Method 2: Phone + OTP');
      console.log('   Phone: +919876543210');
      console.log('   (OTP will be shown in backend console)');
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
