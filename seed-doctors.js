// seed-doctors.js - Multiple doctors create karne ke liye (Development/Testing)
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// Password encryption
const make_password = (password) => {
  return crypto.createHash('md5').update(password).digest('hex');
};

// Doctors data - Yahan apne doctors add karo
const doctorsData = [
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@ethi.com',
    phone: '+919876543210',
    password: 'doctor123',
    profession: 'Clinical Nutritionist',
    specialization: 'Weight Management',
    experience: '8 years',
    fees: '1500',
    city: 'Mumbai',
    state: 'Maharashtra',
    education: 'MBBS, MD (Nutrition)'
  },
  {
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@ethi.com',
    phone: '+919876543211',
    password: 'doctor123',
    profession: 'Dietitian',
    specialization: 'Diabetes Management',
    experience: '10 years',
    fees: '2000',
    city: 'Delhi',
    state: 'Delhi',
    education: 'MSc Dietetics, PhD'
  },
  {
    name: 'Dr. Anita Desai',
    email: 'anita.desai@ethi.com',
    phone: '+919876543212',
    password: 'doctor123',
    profession: 'Sports Nutritionist',
    specialization: 'Athletic Performance',
    experience: '6 years',
    fees: '1800',
    city: 'Bangalore',
    state: 'Karnataka',
    education: 'BSc Nutrition, MSc Sports Science'
  },
  {
    name: 'Dr. Vikram Singh',
    email: 'vikram.singh@ethi.com',
    phone: '+919876543213',
    password: 'doctor123',
    profession: 'Clinical Dietitian',
    specialization: 'Cardiac Nutrition',
    experience: '12 years',
    fees: '2500',
    city: 'Pune',
    state: 'Maharashtra',
    education: 'MBBS, MD, Fellowship in Cardiology'
  },
  {
    name: 'Dr. Meera Patel',
    email: 'meera.patel@ethi.com',
    phone: '+919876543214',
    password: 'doctor123',
    profession: 'Pediatric Nutritionist',
    specialization: 'Child Nutrition',
    experience: '7 years',
    fees: '1200',
    city: 'Ahmedabad',
    state: 'Gujarat',
    education: 'MBBS, MD (Pediatrics)'
  }
];

const uri = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB...');

mongoose.set('strictQuery', false);
mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
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
      user_email: String,
      user_mobile: String,
      doctor_specialization: String,
      doctor_experience: String,
      doctor_fees: String
    }, { 
      timestamps: true,
      collection: 'ethi_doctor_masters'
    });
    
    const Doctor = mongoose.model('ethi_doctor_master', doctorSchema);
    
    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    console.log('📊 Processing', doctorsData.length, 'doctors...\n');
    
    for (const doctorData of doctorsData) {
      try {
        // Check if doctor already exists
        const existing = await Doctor.findOne({ doctor_email: doctorData.email });
        
        if (existing) {
          console.log('⚠️  Skipped:', doctorData.name, '- Already exists');
          skippedCount++;
          continue;
        }
        
        // Create new doctor
        const encryptedPassword = make_password(doctorData.password);
        
        const newDoctor = new Doctor({
          entry_date: new Date().toISOString(),
          doctor_name: doctorData.name,
          doctor_mobile: doctorData.phone,
          doctor_email: doctorData.email,
          doctor_image: 'default-doctor.png',
          doctor_profession: doctorData.profession,
          doctor_city: doctorData.city,
          doctor_country: 'India',
          doctor_education: doctorData.education,
          doctor_join_date: new Date().toISOString(),
          doctor_state: doctorData.state,
          doctor_zipcode: '400001',
          doctor_password: doctorData.password,
          doctor_passowrd_enq: encryptedPassword,
          allow_access: '1',
          flag: 'c',
          user_email: doctorData.email,
          user_mobile: doctorData.phone,
          doctor_specialization: doctorData.specialization,
          doctor_experience: doctorData.experience,
          doctor_fees: doctorData.fees
        });
        
        await newDoctor.save();
        console.log('✅ Created:', doctorData.name);
        console.log('   📧', doctorData.email);
        console.log('   📱', doctorData.phone);
        console.log('   🔑 Password: doctor123\n');
        createdCount++;
        
      } catch (error) {
        console.log('❌ Failed:', doctorData.name);
        console.log('   Error:', error.message, '\n');
        failedCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('✅ Created:', createdCount);
    console.log('⚠️  Skipped:', skippedCount);
    console.log('❌ Failed:', failedCount);
    console.log('📊 Total:', doctorsData.length);
    
    console.log('\n🔑 All doctors password: doctor123');
    console.log('\n💡 Login Methods:');
    console.log('   1. Email + Password (any doctor email above)');
    console.log('   2. Phone + OTP (any doctor phone above)\n');
    
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
  });
