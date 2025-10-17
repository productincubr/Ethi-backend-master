module.exports = (mongoose) => {
  const ethi_progress_diet_plan = mongoose.model(
    "ethi_progress_diet_plan",
    mongoose.Schema(
      {
        entry_date: String,
        click_date: String,
        customer_id: String,
        diet_plan_id: String,
        flag: String,
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_progress_diet_plan;
};
