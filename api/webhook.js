// ĐÃ SỬA: Sử dụng thư viện dialogflow-fulfillment chính xác
const { WebhookClient } = require('dialogflow-fulfillment'); 

// Tải file dữ liệu JSON của bạn (đảm bảo đường dẫn chính xác)
const HR_POLICIES = require('../data/hr_policies.json');

// Hàm xử lý Intent chính (được gọi bởi Dialogflow)
function handleHRQuery(agent) {
  const policyName = agent.parameters.chinh_sach_hr;
  const rawQuery = agent.query.toLowerCase();

  let fulfillmentText = "Xin lỗi, tôi chưa tìm thấy thông tin chi tiết chính sách này trong cẩm nang. Vui lòng hỏi rõ hơn hoặc liên hệ Phòng Nhân sự.";

  if (policyName && HR_POLICIES[policyName]) {
    const policyData = HR_POLICIES[policyName];

    // --- LOGIC PHÂN TÍCH NHU CẦU CỤ THỂ DỰA TRÊN TỪ KHÓA ---
    
    // 1. Phân tích MỨC HƯỞNG / MỨC ĐÓNG
    if (rawQuery.includes('mức hưởng') || rawQuery.includes('bao nhiêu') || rawQuery.includes('mức đóng') || rawQuery.includes('phần trăm') || rawQuery.includes('mức giảm trừ')) {
      fulfillmentText = `Về ${policyData.chu_de}, ${policyData.muc_huong || policyData.muc_dong || policyData.giam_tru_ban_than || policyData.giam_tru_phu_thuoc || policyData.nguong_thue || 'Không có thông tin về mức tiền/tỷ lệ.'}`;
    
    // 2. Phân tích THỜI GIAN / KHI NÀO
    } else if (rawQuery.includes('thời gian') || rawQuery.includes('khi nào') || rawQuery.includes('ngày nào') || rawQuery.includes('bao lâu')) {
      fulfillmentText = `Về ${policyData.chu_de}, quy định thời gian là: ${policyData.thoi_gian_nghi || policyData.ngay_tra || 'Không có thông tin về thời gian cụ thể.'}`;
      
    // 3. Phân tích THỦ TỤC / ĐIỀU KIỆN / CÁCH THỨC
    } else if (rawQuery.includes('thủ tục') || rawQuery.includes('điều kiện') || rawQuery.includes('hồ sơ') || rawQuery.includes('làm sao')) {
      fulfillmentText = `Về thủ tục và điều kiện hưởng ${policyData.chu_de}: ${policyData.dieu_kien || policyData.thu_tuc || policyData.dieu_kien_chung || 'Vui lòng liên hệ Phòng Nhân sự để biết thủ tục chi tiết.'}`;
      
    // 4. Trả lời TÓM TẮT (Nếu câu hỏi quá chung chung)
    } else {
      // Trả lại một bản tóm tắt hoặc định nghĩa
      let summary = policyData.muc_huong || policyData.dieu_kien_chung || policyData.phan_anh || policyData.ngay_tra;
      fulfillmentText = `Thông tin chính về ${policyData.chu_de} là: ${summary}`;
    }
  } 
  
  // Gửi phản hồi về Dialogflow
  agent.add(fulfillmentText);
}

// Khởi tạo Vercel Serverless Function
module.exports = (request, response) => {
  const agent = new WebhookClient({ request, response });

  // Map Intent chính của bạn tới hàm xử lý
  let intentMap = new Map();
  intentMap.set('Hoi_ThongTin_ChinhSach', handleHRQuery); 

  // Đây là điểm mà lỗi TypeError trước đó đã xảy ra
  agent.handleRequest(intentMap); 
};
