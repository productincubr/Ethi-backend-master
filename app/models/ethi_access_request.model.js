// app/models/ethi_access_request.model.js
module.exports = (mongoose) => {
  const schema = mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      admin_name: {
        type: String,
        required: true,
      },
      admin_mobile: {
        type: String,
        required: true,
      },
      admin_password: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ["admin", "doctor", "super_admin"],
        default: "admin",
      },
      admin_image: {
        type: String,
        default: "user_image.png",
      },
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
      },
      ownerApprovalToken: {
        type: String,
        required: true,
        unique: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      approvedAt: Date,
      rejectedAt: Date,
    },
    {
      timestamps: true,
    }
  );

  schema.index({ ownerApprovalToken: 1 });

  const ethi_access_request = mongoose.model(
    "ethi_access_requests",
    schema
  );

  return ethi_access_request;
};
