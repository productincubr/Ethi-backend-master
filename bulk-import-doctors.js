// bulk-import-doctors.js - CSV/JSON se doctors import karne ke liye
const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// Password encryption
const make_password = (password) => {
  return crypto.createHash('md5').update(password).digest('hex');
};

const uri = process.env.MONGODB_URI;

// Function to read doctors from CSV file
async function importFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const doctors = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        doctors.push({
          name: row.name || row.Name,
          email: row.email || row.Email,
          phone: row.phone || row.Phone,
          password: row.password || 'doctor123',
          profession: row.profession || row.Profession || 'Nutritionist',
          specialization: row.specialization || row.Specialization || 'General',
          experience: row.experience || row.Experience || '5 years',
          fees: row.fees || row.Fees || '1000',
          city: row.city || row.City || 'Mumbai',
          state: row.state || row.State || 'Maharashtra',
          education: row.education || row.Education || 'MBBS'
        });
      })
      .on('end', () => resolve(doctors))
      .on('error', (error) => reject(error));
  });
}

// Function to read doctors from JSON file
function importFromJSON(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

async function bulkImport() {
  console.log('🔗 Connecting to MongoDB...');
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
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
    
    // Check if file exists
    const csvFile = 'doctors.csv';
    const jsonFile = 'doctors.json';
    
    let doctorsData = [];
    
    if (fs.existsSync(csvFile)) {
      console.log('📄 Found doctors.csv, importing...\n');
      doctorsData = await importFromCSV(csvFile);
    } else if (fs.existsSync(jsonFile)) {
      console.log('📄 Found doctors.json, importing...\n');
      doctorsData = importFromJSON(jsonFile);
    } else {
      console.log('❌ No import file found!');
      console.log('\n💡 Create one of these files:');
      console.log('   1. doctors.csv');
      console.log('   2. doctors.json\n');
      
      // Create sample files
      const sampleCSV = `name,email,phone,password,profession,specialization,experience,fees,city,state,education
Dr. John Doe,john.doe@ethi.com,+919876543215,doctor123,Nutritionist,Weight Management,5 years,1500,Mumbai,Maharashtra,MBBS
Dr. Jane Smith,jane.smith@ethi.com,+919876543216,doctor123,Dietitian,Sports Nutrition,7 years,2000,Delhi,Delhi,MSc Dietetics`;
      
      fs.writeFileSync('doctors_sample.csv', sampleCSV);
      
      const sampleJSON = [
        {
          "name": "Dr. John Doe",
          "email": "john.doe@ethi.com",
          "phone": "+919876543215",
          "password": "doctor123",
          "profession": "Nutritionist",
          "specialization": "Weight Management",
          "experience": "5 years",
          "fees": "1500",
          "city": "Mumbai",
          "state": "Maharashtra",
          "education": "MBBS"
        }
      ];
      
      fs.writeFileSync('doctors_sample.json', JSON.stringify(sampleJSON, null, 2));
      
      console.log('✅ Created sample files:');
      console.log('   - doctors_sample.csv');
      console.log('   - doctors_sample.json\n');
      console.log('💡 Edit them and rename to doctors.csv or doctors.json');
      
      await mongoose.connection.close();
      process.exit(0);
    }
    
    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    console.log('📊 Processing', doctorsData.length, 'doctors...\n');
    
    for (const doctorData of doctorsData) {
      try {
        // Validation
        if (!doctorData.email || !doctorData.phone) {
          console.log('⚠️  Skipped:', doctorData.name, '- Missing email or phone');
          skippedCount++;
          continue;
        }
        
        // Check if doctor already exists
        const existing = await Doctor.findOne({ 
          $or: [
            { doctor_email: doctorData.email },
            { doctor_mobile: doctorData.phone }
          ]
        });
        
        if (existing) {
          console.log('⚠️  Skipped:', doctorData.name, '- Already exists');
          skippedCount++;
          continue;
        }
        
        // Create new doctor
        const password = doctorData.password || 'doctor123';
        const encryptedPassword = make_password(password);
        
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
          doctor_password: password,
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
        console.log('   🔑 Password:', password, '\n');
        createdCount++;
        
      } catch (error) {
        console.log('❌ Failed:', doctorData.name);
        console.log('   Error:', error.message, '\n');
        failedCount++;
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log('✅ Created:', createdCount);
    console.log('⚠️  Skipped:', skippedCount);
    console.log('❌ Failed:', failedCount);
    console.log('📊 Total:', doctorsData.length);
    
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

bulkImport();
