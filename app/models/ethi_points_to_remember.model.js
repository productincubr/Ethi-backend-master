module.exports = (mongoose) => {
  const ethi_points_to_remember = mongoose.model(
    "ethi_points_to_remember",
    mongoose.Schema(
      {
        customer_id: String,
        doctor_id: String,
        points_to_remember: {
          type: String,
        },
        sequence_id: {
          type: Number,
        },
        flag: String,
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_points_to_remember;
};
