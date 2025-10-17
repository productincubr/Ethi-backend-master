module.exports = (mongoose) => {
  const ethi_doctor_feedback = mongoose.model(
    "ethi_doctor_feedback",
    mongoose.Schema(
      {
        entry_date: String,
        doctor_id: String,
        doctor_name: String,
        what_went_well: String,
        what_could_we_improve_on: String,
        any_additional_comments: String,
        flag: String,
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_doctor_feedback;
};
