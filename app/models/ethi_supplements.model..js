module.exports = (mongoose) => {
  const ethi_supplements = mongoose.model(
    "ethi_supplements",
    mongoose.Schema(
      {
        customer_id: String,
        doctor_id: String,
        supplements_remember: {
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

  return ethi_supplements;
};
