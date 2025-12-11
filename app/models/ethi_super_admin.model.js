// app/models/ethi_super_admin.model.js
// Super Admin (Owner) Model - For website owners with full access

module.exports = (mongoose) => {
  const ethi_super_admin = mongoose.model(
    "ethi_super_admin",
    mongoose.Schema(
      {
        entry_date: String,
        admin_name: String,
        admin_mobile_no: String,
        admin_email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
        },
        admin_image: String,
        admin_type: {
          type: String,
          default: "super_admin",
        },
        admin_city: String,
        admin_country: String,
        admin_education: String,
        admin_join_date: String,
        admin_state: String,
        admin_zipcode: String,
        admin_password: String,
        admin_passowrd_enq: String, // Hashed password
        allow_access: {
          type: String,
          default: "1",
        },
        flag: {
          type: String,
          default: "c",
        },
        role: {
          type: String,
          default: "super_admin",
        },
        is_super_admin: {
          type: Boolean,
          default: true,
        },
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_super_admin;
};
