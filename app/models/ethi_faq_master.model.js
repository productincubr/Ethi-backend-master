module.exports = mongoose => {
    const ethi_faq_master = mongoose.model(
      "ethi_faq_master",
      mongoose.Schema({
        entry_date: String,
        question_name: String,
        answer_name: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_faq_master;
  };
  