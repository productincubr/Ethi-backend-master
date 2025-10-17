module.exports = mongoose => {
    const ethi_testmonial = mongoose.model(
      "ethi_testmonial",
      mongoose.Schema({
        entry_date: String,
        image_name: String,
        title_name: String,
        author_name: String,
        full_detail: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_testmonial;
  };
  