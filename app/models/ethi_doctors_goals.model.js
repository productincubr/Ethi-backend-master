module.exports = (mongoose) => {
  const ethi_doctors_goals = mongoose.model(
    "ethi_doctors_goals",
    mongoose.Schema({
      entry_date: String,
      doctor_id: String,
      goal_id: String,
      doctor_goal_name: String,
      doctor_goal_detail: String,
      doctor_goal_image: String,
      flag: String,
    },
    {
      timestamps: true, 
    })
  );

  return ethi_doctors_goals;
};
