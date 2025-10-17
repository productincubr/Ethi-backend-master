module.exports = mongoose => {
    const ethi_customer_wati_temp= mongoose.model(
        "ethi_customer_wati_temp",
        mongoose.Schema({
          entry_date: String,
          whatsappMessageId: String,
          conversationId: String,
          ticketId: String,
          text_add: String,
          customer_id: String,
          customer_mobile_no: String,
          customer_name: String,
          customer_email: String,
          customer_book_date: String,
          customer_book_start_time: String,
          customer_book_end_time: String,
          listReply: String,
          replyContextId: String,
          booking_step: String,
          flag: String,  
        },
        {
            timestamps: true,
        })
    );

    return ethi_customer_wati_temp;
};
