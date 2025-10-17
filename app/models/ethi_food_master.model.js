module.exports = mongoose => {
    const ethi_food_master = mongoose.model(
      "ethi_food_master",
      mongoose.Schema({
        entry_date: String,
        doctor_id: String,
        food_name: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_food_master;
  };
  