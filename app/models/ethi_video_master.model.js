module.exports = mongoose => {
    const ethi_video_master = mongoose.model(
      "ethi_video_master",
      mongoose.Schema({
        entry_date: String,
        video_name: String,
        video_image: String,
        thumbnail_name: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_video_master;
  };
  