// Khai báo thư viện cần thiết cho Vercel/Dialogflow
const { WebhookClient } = require('dialogflow-fulfillment'); 

// Tải file dữ liệu JSON của bạn (Đã kiểm tra cú pháp và đường dẫn)
const HR_POLICIES = require('../data/hr_policies.json');

// Hàm xử lý Intent chính (được gọi bởi Dialogflow)
function handleHRQuery(agent) {
  // Lấy giá trị tham số (Synonym) đã được trích xuất
  const rawPolicyName = agent.parameters.chinh_sach_hr;
  const rawQuery = agent.query.toLowerCase();
  
  // Mặc định trả về lỗi, sẽ được ghi đè nếu tìm thấy dữ liệu
  let fulfillmentText = "Xin lỗi, tôi chưa tìm thấy thông tin chi tiết chính sách này trong cẩm nang. Vui lòng hỏi rõ hơn hoặc liên hệ Phòng Nhân sự.";

  // --- LOGIC ÁNH XẠ KHÓA (CHUYỂN SYNONYM VỀ REFERENCE KEY) ---
  // Mục đích: Chuyển từ "trả lương" (synonym) về "Luong" (JSON Key)
  let policyKey = rawPolicyName;
  
  if (rawPolicyName === 'trả lương' || rawPolicyName === 'tiền lương') {
    policyKey = 'Luong';
  } else if (rawPolicyName === 'nghỉ đẻ' || rawPolicyName === 'sinh con') {
    policyKey = 'ThaiSan';
  } else if (rawPolicyName === 'thất nghiệp' || rawPolicyName === 'BHTN') {
    policyKey = 'BHTN'; 
  } else if (rawPolicyName === 'giảm trừ gia cảnh' || rawPolicyName === 'mức giảm trừ' || rawPolicyName === 'thuế') {
    policyKey = 'TNCN';
  }
  // --- KẾT THÚC LOGIC ÁNH XẠ ---

  if (policyKey && HR_POLICIES[policyKey]) {
    const policyData = HR_POLICIES[policyKey];

    // --- LOGIC PHÂN TÍCH NHU CẦU CỤ THỂ DỰA TRÊN TỪ KHÓA ---
    
    // 1. Phân tích MỨC HƯỞNG / MỨC ĐÓNG / GIẢM TRỪ (Nếu có từ khóa tiền)
    if (rawQuery.includes('mức hưởng') || rawQuery.includes('bao nhiêu') || rawQuery.includes('mức đóng') || rawQuery.includes('phần trăm')) {
      fulfillmentText = `Về ${policyData.chu_de}, mức tiền/tỷ lệ là: ${policyData.muc_huong || policyData.muc_dong || policyData.giam_tru_ban_than || 'Không có thông tin về mức tiền/tỷ lệ.'}`;
    
    // 2. Phân tích THỜI GIAN / KHI NÀO (Nếu có từ khóa ngày/thời gian)
    } else if (rawQuery.includes('thời gian') || rawQuery.includes('khi nào') || rawQuery.includes('ngày nào') || rawQuery.includes('bao lâu')) {
      fulfillmentText = `Về ${policyData.chu_de}, quy định thời gian là: ${policyData.thoi_gian_nghi || policyData.ngay_tra || 'Vui lòng hỏi chi tiết hơn.'}`;
      
    // 3. Trả lời TÓM TẮT (Nếu không có từ khóa cụ thể)
    } else {
      // Trả lại một bản tóm tắt các điểm chính
      let summary = policyData.muc_huong || policyData.dieu_kien_chung || policyData.ngay_tra || policyData.phan_anh || policyData.giu_luong;
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

  agent.handleRequest(intentMap);
};
