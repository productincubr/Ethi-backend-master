module.exports = mongoose => {
    const ethi_supplement_master = mongoose.model(
      "ethi_supplement_master",
      mongoose.Schema({
        entry_date: String,
        doctor_id: String,
        supplement_name: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_supplement_master;
  };
  