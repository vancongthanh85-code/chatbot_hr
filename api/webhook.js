// Khai báo thư viện chính xác (đã sửa lỗi TypeError)
const { WebhookClient } = require('dialogflow-fulfillment'); 

// Tải file dữ liệu JSON 
const HR_POLICIES = require('../data/hr_policies.json');

// --- HÀM HỖ TRỢ: TẠO GỢI Ý CÂU HỎI (ĐÃ BỔ SUNG) ---
function generateSuggestions(policyKey) {
    switch (policyKey) {
        case 'ThaiSan':
            return '\nCác thông tin khác bạn có thể hỏi: "Thời gian nghỉ thai sản là bao lâu?" hoặc "Điều kiện hưởng thai sản là gì?".';
        case 'OmDau':
            return '\nCác thông tin khác bạn có thể hỏi: "Thời gian nghỉ ốm tối đa là bao lâu?" hoặc "Quy định về con ốm nghỉ là gì?".';
        case 'BHTN':
            return '\nCác thông tin khác bạn có thể hỏi: "Mức đóng BHTN là bao nhiêu?" hoặc "Thời gian BHTN có được cộng dồn không?".';
        case 'Luong':
            return '\nCác thông tin khác bạn có thể hỏi: "Quy định về giữ lương ra sao?" hoặc "Thưởng chuyên cần bị trừ như thế nào?".';
        case 'TNCN':
            return '\nCác thông tin khác bạn có thể hỏi: "Mức giảm trừ gia cảnh là bao nhiêu?" hoặc "Ngưỡng chịu thuế là bao nhiêu?".';
        default:
            return '';
    }
}

// Hàm xử lý Intent chính
function handleHRQuery(agent) {
  const rawPolicyName = agent.parameters.chinh_sach_hr;
  const rawQuery = agent.query.toLowerCase();
  
  let fulfillmentText = "Xin lỗi, tôi chưa tìm thấy thông tin chi tiết chính sách này trong cẩm nang. Vui lòng hỏi rõ hơn hoặc liên hệ Phòng Nhân sự.";

  // --- LOGIC ÁNH XẠ KHÓA (KEY MAPPING) ---
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

  if (policyKey && HR_POLICIES[policyKey]) {
    const policyData = HR_POLICIES[policyKey];
    let isSpecificQueryHandled = false;

    // 1. Phân tích MỨC HƯỞNG / MỨC ĐÓNG / GIẢM TRỪ (Nếu có từ khóa tiền)
    if (rawQuery.includes('mức hưởng') || rawQuery.includes('bao nhiêu') || rawQuery.includes('mức đóng') || rawQuery.includes('phần trăm')) {
        fulfillmentText = `Về ${policyData.chu_de}, mức tiền/tỷ lệ là: ${policyData.muc_huong || policyData.muc_dong || policyData.giam_tru_ban_than || 'Không có thông tin về mức tiền/tỷ lệ.'}`;
        isSpecificQueryHandled = true;
    
    // 2. Phân tích THỜI GIAN / KHI NÀO (Nếu có từ khóa ngày/thời gian)
    } else if (rawQuery.includes('thời gian') || rawQuery.includes('khi nào') || rawQuery.includes('ngày nào') || rawQuery.includes('bao lâu')) {
        fulfillmentText = `Về ${policyData.chu_de}, quy định thời gian là: ${policyData.thoi_gian_nghi || policyData.ngay_tra || 'Vui lòng hỏi chi tiết hơn.'}`;
        isSpecificQueryHandled = true;
    
    // 3. Phân tích CÁC CÂU HỎI KHÁC (Chấm công, giữ lương, v.v.)
    } else if (rawQuery.includes('giữ lương') || rawQuery.includes('giữ tiền')) {
        fulfillmentText = `Về ${policyData.chu_de}: ${policyData.giu_luong || 'Không có thông tin cụ thể về giữ lương.'}`;
        isSpecificQueryHandled = true;
    }

    // 4. Xử lý Trả lời TÓM TẮT HOẶC ĐƯA RA GỢI Ý (Fallback Logic)
    if (!isSpecificQueryHandled) {
        // Trả lại một bản tóm tắt CÓ GỢI Ý
        let summary = policyData.muc_huong || policyData.dieu_kien_chung || policyData.ngay_tra || policyData.phan_anh;
        if (summary) {
            fulfillmentText = `Thông tin chính về **${policyData.chu_de}** là: ${summary}. ${generateSuggestions(policyKey)}`;
        } else {
            fulfillmentText = `Tôi đã tìm thấy chủ đề **${policyData.chu_de}**, nhưng không tìm được thông tin tóm tắt. ${generateSuggestions(policyKey)}`;
        }
    }
  } 
  
  // Gửi phản hồi về Dialogflow
  agent.add(fulfillmentText);
}

// Khởi tạo Vercel Serverless Function
module.exports = (request, response) => {
  const agent = new WebhookClient({ request, response });

  let intentMap = new Map();
  intentMap.set('Hoi_ThongTin_ChinhSach', handleHRQuery); 

  agent.handleRequest(intentMap);
};
