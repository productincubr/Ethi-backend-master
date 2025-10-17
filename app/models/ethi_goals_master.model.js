module.exports = mongoose => {
  const ethi_goals_master = mongoose.model(
    "ethi_goals_master",
    mongoose.Schema({
      entry_date: String,
      goal_name: String,
      goal_details: String,
      goal_image: String,
      flag: String
    },
    {
      timestamps: true, 
    })
  );


  return ethi_goals_master;
};
