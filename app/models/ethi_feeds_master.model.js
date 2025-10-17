

module.exports = mongoose => {
  const ethi_feeds_master = mongoose.model(
    "ethi_feeds_master",
    mongoose.Schema({
      entry_date: String,
      doctor_id: String,
      admin_id: String,
      doctor_name: String,
      doctor_admin_image: String,
      doctor_tag: String,
      feed_detail: String,
      feed_type: String,
      feed_document: String,
      total_likes:Number,
      approve_status: String,
      flag: String,
    },
    {
      timestamps: true, 
    })
  );

  return ethi_feeds_master;
};
