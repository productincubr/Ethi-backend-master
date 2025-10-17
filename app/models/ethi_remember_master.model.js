module.exports = mongoose => {
    const ethi_remember_master = mongoose.model(
      "ethi_remember_master",
      mongoose.Schema({
        entry_date: String,
        doctor_id: String,
        remember_name: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_remember_master;
  };
  