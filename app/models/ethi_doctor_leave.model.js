module.exports = mongoose => {
  const ethi_doctor_leave = mongoose.model(
    "ethi_doctor_leave",
    mongoose.Schema({
      entry_date: String,
      doctor_id: String,
      doctor_name: String,
      leave_type: String,
      leave_duration: String,
      leave_from: String,
      leave_to: String,
      reason: String,
      remarks: String,
      status_for: String, //0 means pending 1 means approved 2 means reject
      flag: String,
    },
    {
      timestamps: true, 
    })
  );

  return ethi_doctor_leave;
};
