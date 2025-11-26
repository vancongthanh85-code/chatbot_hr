// Khai báo thư viện chính xác (đã sửa lỗi TypeError)
const { WebhookClient } = require('dialogflow-fulfillment'); 

// Tải file dữ liệu JSON của bạn (Đã kiểm tra cú pháp và đường dẫn)
const HR_POLICIES = require('../data/hr_policies.json');

// --- HÀM XỬ LÝ INTENT CHÍNH (Hoi_ThongTin_ChinhSach) ---
function handleHRQuery(agent) {
  // Lấy giá trị tham số (Synonym) đã được trích xuất
  const rawPolicyName = agent.parameters.chinh_sach_hr;
  const rawQuery = agent.query.toLowerCase();
  
  let fulfillmentText = "Xin lỗi, tôi chưa tìm thấy thông tin chi tiết chính sách này trong cẩm nang. Vui lòng hỏi rõ hơn hoặc liên hệ Phòng Nhân sự.";

  // --- LOGIC ÁNH XẠ KHÓA (KEY MAPPING) ---
  let policyKey = rawPolicyName;
  
  // Ánh xạ các từ đồng nghĩa về khóa JSON chính xác (Reference Key)
  if (rawPolicyName === 'trả lương' || rawPolicyName === 'tiền lương') {
    policyKey = 'Luong';
  } else if (rawPolicyName === 'nghỉ đẻ' || rawPolicyName === 'sinh con') {
    policyKey = 'ThaiSan';
  } else if (rawPolicyName === 'thất nghiệp' || rawPolicyName === 'BHTN' || rawPolicyName === 'BHXH') {
    policyKey = 'BHTN'; // Dùng BHTN cho tất cả các câu hỏi về BHXH/BHYT/BHTN
  } else if (rawPolicyName === 'giảm trừ gia cảnh' || rawPolicyName === 'mức giảm trừ' || rawPolicyName === 'thuế') {
    policyKey = 'TNCN';
  }
  // --- KẾT THÚC LOGIC ÁNH XẠ ---

  if (policyKey && HR_POLICIES[policyKey]) {
    const policyData = HR_POLICIES[policyKey];

    // --- LOGIC XỬ LÝ NGOẠI LỆ ĐẶC BIỆT: SINH CON THỨ BA (Q3) ---
    // Phải kiểm tra trước các logic chung khác
    if (policyKey === 'ThaiSan' && rawQuery.includes('thứ ba')) {
        fulfillmentText = "Luật BHXH quy định không phân biệt nữ lao động sinh con lần thứ 1, 2, 3… nếu có đủ điều kiện (đóng BHXH từ đủ sáu tháng trở lên trong thời gian mười hai tháng trước khi sinh con) thì được hưởng chế độ thai sản.";
        agent.add(fulfillmentText);
        return; // Dừng Webhook và gửi phản hồi
    }
    
    // --- LOGIC PHÂN TÍCH NHU CẦU CHUNG (ĐÃ SỬA LỖI ƯU TIÊN DỮ LIỆU) ---
    
    // 1. Phân tích MỨC HƯỞNG / MỨC ĐÓNG / PHẦN TRĂM
    if (rawQuery.includes('mức hưởng') || rawQuery.includes('bao nhiêu') || rawQuery.includes('mức đóng') || rawQuery.includes('phần trăm')) {
      
      // FIX: Nếu hỏi về "đóng" hoặc "phần trăm", ưu tiên trả lời Mức đóng tổng thể (Q4)
      if (rawQuery.includes('đóng') || rawQuery.includes('phần trăm') || rawQuery.includes('tổng')) {
          fulfillmentText = `Về ${policyData.chu_de}, mức đóng là: ${policyData.muc_dong || 'Không có thông tin về mức đóng.'}`;
      } else {
          // Nếu không, trả về mức hưởng (muc_huong)
          fulfillmentText = `Về ${policyData.chu_de}, mức tiền/tỷ lệ là: ${policyData.muc_huong || policyData.giam_tru_ban_than || 'Không có thông tin về mức tiền/tỷ lệ.'}`;
      }

    // 2. Phân tích THỜI GIAN / KHI NÀO
    } else if (rawQuery.includes('thời gian') || rawQuery.includes('khi nào') || rawQuery.includes('ngày nào') || rawQuery.includes('bao lâu')) {
      fulfillmentText = `Về ${policyData.chu_de}, quy định thời gian là: ${policyData.thoi_gian_nghi || policyData.ngay_tra || 'Vui lòng hỏi chi tiết hơn.'}`;
      
    // 3. Trả lời TÓM TẮT (Nếu không có từ khóa cụ thể)
    } else {
      let summary = policyData.muc_huong || policyData.dieu_kien_chung || policyData.ngay_tra || policyData.phan_anh || policyData.giu_luong;
      fulfillmentText = `Thông tin chính về ${policyData.chu_de} là: ${summary}`;
    }
  } 
  
  // Gửi phản hồi về Dialogflow
  agent.add(fulfillmentText);
}


// --- HÀM XỬ LÝ FALLBACK ĐỘNG (Default Fallback Intent) ---
function handleDynamicFallback(agent) {
    const query = agent.query.toLowerCase();
    let suggestions = [];
    
    // Logic 1: Kiểm tra từ khóa BHXH/Thai Sản
    if (query.includes("thai sản") || query.includes("sinh con") || query.includes("nghỉ đẻ")) {
        suggestions.push("Mức hưởng thai sản là bao nhiêu?");
        suggestions.push("Thời gian nghỉ thai sản là bao lâu?");
        suggestions.push("Điều kiện hưởng thai sản là gì?");
    }
    
    // Logic 2: Kiểm tra từ khóa Lương/Chấm công
    else if (query.includes("lương") || query.includes("tiền") || query.includes("trợ cấp") || query.includes("chấm công")) {
        suggestions.push("Công ty trả lương ngày nào?");
        suggestions.push("Thưởng chuyên cần bị trừ như thế nào?");
        suggestions.push("Các loại trợ cấp được tính như thế nào?");
    } else {
        // Gợi ý chung nếu không tìm thấy từ khóa nào liên quan
        suggestions.push("1. Trợ cấp Thai sản");
        suggestions.push("2. Trợ cấp Ốm đau");
        suggestions.push("3. Quy định về Lương/Chấm công");
    }

    let fulfillmentText;
    
    if (suggestions.length > 0) {
        // SỬ DỤNG KÝ TỰ XUỐNG HÀNG (\n) VÀ JOIN ĐỂ TẠO CÁC DÒNG RIÊNG BIỆT
        fulfillmentText = "Xin lỗi, tôi chưa hiểu rõ ý bạn. Có phải bạn đang quan tâm đến các vấn đề sau không?\n\n";
        fulfillmentText += suggestions.join('\n'); // Nối các gợi ý bằng ký tự xuống hàng
    } else {
        fulfillmentText = "Vui lòng hỏi rõ hơn về Thai sản, Ốm Đau, Lương, hay Thuế TNCN hoặc liên hệ Phòng Nhân sự.";
    }

    agent.add(fulfillmentText);
}


// --- KHỞI TẠO WEBHOOK VÀ ÁNH XẠ INTENT ---
module.exports = (request, response) => {
    const agent = new WebhookClient({ request, response });

    let intentMap = new Map();
    // Ánh xạ Intent Dự phòng Mặc định của hệ thống vào hàm xử lý gợi ý
    intentMap.set('Default Fallback Intent', handleDynamicFallback); 
    // Ánh xạ Intent Chính của bạn vào hàm xử lý HR Query
    intentMap.set('Hoi_ThongTin_ChinhSach', handleHRQuery); 

    agent.handleRequest(intentMap);
};
