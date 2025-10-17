module.exports = (mongoose) => {
  const ethi_customers_goals = mongoose.model(
    "ethi_customers_goals",
    mongoose.Schema({
      entry_date: String,
      customer_id: String,
      goal_id: String,
      customer_goal_name: String,
      customer_goal_detail: String,
      customer_goal_image: String,
      flag: String,
    },
    {
      timestamps: true, 
    })
  );

  return ethi_customers_goals;
};
