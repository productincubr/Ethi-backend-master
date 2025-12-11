// module.exports = (mongoose) => {
//   const ethi_admin = mongoose.model(
//     "ethi_admin",
//     mongoose.Schema({
//       entry_date: String,
//       admin_name: String,
//       admin_mobile_no: String,
//       admin_email: { 
//         type: String, 
//         required: true, 
//         unique: true 
//       },
//       admin_image: String,
//       admin_type: String,
//       admin_city: String,
//       admin_country: String,
//       admin_education: String,
//       admin_join_date: String,
//       admin_state: String,
//       admin_zipcode: String,
//       admin_password: String,
//       admin_passowrd_enq: String, // Hashed password field
//       allow_access: String,
//       flag: String,
//       // Role-based access control: defines admin permission level
//       role: { 
//         type: String, 
//         enum: ["SUPER_ADMIN", "ADMIN"], 
//         default: "ADMIN" 
//       },
//       // Account status: used to enable/disable admin access
//       is_active: { 
//         type: Boolean, 
//         default: true 
//       }
//     },
//     {
//       timestamps: true, 
//     })
//   );

//   return ethi_admin;
// };

// app/models/ethi_admin.model.js

module.exports = (mongoose) => {
  const ethi_admin = mongoose.model(
    "ethi_admin",
    mongoose.Schema(
      {
        entry_date: String,
        admin_name: String,
        admin_mobile_no: String,
        admin_email: String,
        admin_image: String,

      
        admin_type: String, // e.g. "super_admin", "admin"

        admin_city: String,
        admin_country: String,
        admin_education: String,
        admin_join_date: String,
        admin_state: String,
        admin_zipcode: String,
        admin_password: String,
        admin_passowrd_enq: String,

        // Allow flag 
        allow_access: String, // "1" / "0"

        flag: String, // "c" = current

        // 🔥 NEW: clearer role + super admin flag (future ke liye)
        role: {
          type: String,
          enum: ["super_admin", "admin"],
          default: "admin",
        },
        is_super_admin: {
          type: Boolean,
          default: false,
        },
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_admin;
};
