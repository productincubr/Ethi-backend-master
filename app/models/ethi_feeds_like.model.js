module.exports = (mongoose) => {
  const ethi_feeds_like = mongoose.model(
    "ethi_feeds_like",
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

  return ethi_feeds_like;
};
