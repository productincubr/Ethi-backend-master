module.exports = (mongoose) => {
  const ethi_doctor_diet_plan = mongoose.model(
    "ethi_doctor_diet_plan",
    mongoose.Schema(
      {
        entry_date: String,
        customer_id: String,
        sequence_id: {
          type: Number,
          default: 0, // Set an appropriate default value
        },
        package_id: String,
        doctor_id: String,
        subscription_id: String,
        diet_time: String,
        diet_time_name: String,
        diet_detail: String,
        pdf_image: String,
        flag: String,
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_doctor_diet_plan;
};
