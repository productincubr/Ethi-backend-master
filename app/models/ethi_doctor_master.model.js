module.exports = mongoose => {
  const ethi_doctor_master = mongoose.model(
    "ethi_doctor_master",
    mongoose.Schema({
      entry_date: String,
      doctor_name: String,
      doctor_profession: String,
      doctor_image: String,
      doctor_email: String,
      doctor_mobile_no: String,
      doctor_city: String,
      doctor_state: String,
      doctor_zipcode: String,
      doctor_country: String,
      doctor_education: String,
      doctor_exp_years: Number,
      doctor_join_date: String,
      doctor_about_us: String,
      doctor_leave_allow: Number,
      doctor_leave_used: Number,
      doctor_password: String,
      doctor_passowrd_enq: String,
      allow_access: String,
      flag: String,
    },
    {
      timestamps: true, 
    })
  );

  return ethi_doctor_master;
};
