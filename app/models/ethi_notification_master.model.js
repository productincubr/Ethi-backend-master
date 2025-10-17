module.exports = mongoose => {
    const ethi_notification_master = mongoose.model(
      "ethi_notification_master",
      mongoose.Schema({
        entry_date: String,
        notification_name: String,
        notification_details: String,
        notification_image: String,
        flag: String
      },
      {
        timestamps: true, 
      })
    );
  
  
    return ethi_notification_master;
  };
  