// check-doctor.js - Check if doctors exist in database
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB...');

mongoose.set('strictQuery', false);
mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const doctorSchema = new mongoose.Schema({
      doctor_email: String,
      doctor_name: String,
      doctor_mobile: String,
      doctor_passowrd_enq: String,
      allow_access: String,
      doctor_profession: String,
      user_email: String,
      user_mobile: String
    }, { 
      timestamps: true,
      collection: 'ethi_doctor_masters'
    });
    
    const Doctor = mongoose.model('ethi_doctor_master', doctorSchema);
    
    // Find all doctors
    const doctors = await Doctor.find({});
    console.log('\n📊 Total Doctors in Database:', doctors.length);
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found in database!');
      console.log('💡 Run: node create-doctor.js');
    } else {
      console.log('\n👥 Doctors List:');
      doctors.forEach((doctor, index) => {
        console.log(`\n${index + 1}. Doctor Details:`);
        console.log('   📧 Email:', doctor.doctor_email || doctor.user_email);
        console.log('   👤 Name:', doctor.doctor_name);
        console.log('   📱 Phone:', doctor.doctor_mobile || doctor.user_mobile);
        console.log('   🔐 Access:', doctor.allow_access);
        console.log('   💼 Profession:', doctor.doctor_profession);
        console.log('   🔑 Password Hash:', doctor.doctor_passowrd_enq);
      });
    }
    
    // Check specific doctor
    const testDoctor = await Doctor.findOne({ doctor_email: 'doctor@ethi.com' });
    if (testDoctor) {
      console.log('\n✅ Found doctor@ethi.com');
      console.log('   Allow Access:', testDoctor.allow_access);
      console.log('   💡 Login with:');
      console.log('      Email: doctor@ethi.com');
      console.log('      Password: doctor123');
    } else {
      console.log('\n❌ doctor@ethi.com NOT FOUND');
      console.log('💡 Run: node create-doctor.js');
    }
    
    await mongoose.connection.close();
    console.log('\n👋 Disconnected');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
