module.exports = (mongoose) => {
  const ethi_admin = mongoose.model(
    "ethi_admin",
    mongoose.Schema({
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
    },
    {
      timestamps: true, 
    })
  );

  return ethi_admin;
};
