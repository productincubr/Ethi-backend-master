module.exports = mongoose => {
    const ethi_quote_master = mongoose.model(
      "ethi_quote_master",
      mongoose.Schema({
        entry_date: String,
        author_name: String,
        quote_name: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_quote_master;
  };
  