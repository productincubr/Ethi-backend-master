module.exports = (mongoose) => {
  const ethi_feeds_bookmark = mongoose.model(
    "ethi_feeds_bookmark",
    mongoose.Schema(
      {
        entry_date: String,
        customer_id: String,
        feed_id: String,
        flag: String,
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_feeds_bookmark;
};
