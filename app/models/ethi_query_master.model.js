module.exports = mongoose => {
    const ethi_query_master = mongoose.model(
      "ethi_query_master",
      mongoose.Schema({
        entry_date: String,
        customer_id: String,
        customer_name: String,
        customer_email: String,
        issue_name: String,
        issue_detail: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_query_master;
  };
  