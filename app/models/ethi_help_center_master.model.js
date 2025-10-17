module.exports = mongoose => {
    const ethi_help_center_master = mongoose.model(
      "ethi_help_center_master",
      mongoose.Schema({
        entry_date: String,
        question_name: String,
        answer_name: String,
        popular_type: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_help_center_master;
  };
  