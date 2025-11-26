// Khai báo thư viện cần thiết cho Vercel/Dialogflow
const { WebhookClient } = require('actions-on-google');

// Tải file dữ liệu JSON của bạn
const HR_POLICIES = require('../data/hr_policies.json');

// --- HÀM XỬ LÝ INTENT CHÍNH (ĐÃ CÓ TRƯỚC ĐÓ) ---
function handleHRQuery(agent) {
    // ... (Giữ nguyên code xử lý truy vấn HR của bạn)
    // Code này xử lý Intent 'Hoi_ThongTin_ChinhSach'
}


// --- HÀM XỬ LÝ FALLBACK ĐỘNG (Dùng cho Default Fallback Intent) ---
function handleDynamicFallback(agent) {
    const query = agent.query.toLowerCase();
    let suggestions = [];
    
    // Logic 1: Kiểm tra từ khóa BHXH/Thai Sản
    if (query.includes("thai sản") || query.includes("sinh con") || query.includes("nghỉ đẻ")) {
        suggestions.push("1. Mức hưởng thai sản là bao nhiêu?");
        suggestions.push("2. Thời gian nghỉ thai sản là bao lâu?");
        suggestions.push("3. Điều kiện hưởng thai sản là gì?");
    }
    
    // Logic 2: Kiểm tra từ khóa Lương/Chấm công
    else if (query.includes("lương") || query.includes("tiền") || query.includes("trợ cấp") || query.includes("chấm công")) {
        suggestions.push("1. Công ty trả lương ngày nào?");
        suggestions.push("2. Thưởng chuyên cần bị trừ như thế nào?");
        suggestions.push("3. Các loại trợ cấp được tính như thế nào?");
    } else {
        // Gợi ý chung nếu không tìm thấy từ khóa nào liên quan
        suggestions.push("1. Trợ cấp Thai sản");
        suggestions.push("2. Trợ cấp Ốm đau");
        suggestions.push("3. Quy định về Lương/Chấm công");
    }

    let fulfillmentText = "Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có thể hỏi rõ hơn về các chủ đề sau:\n\n";
    // SỬ DỤNG KÝ TỰ XUỐNG DÒNG (\n) ĐỂ TẠO CÁC DÒNG RIÊNG BIỆT
    fulfillmentText += suggestions.join('\n'); 
    fulfillmentText += "\n\nHoặc liên hệ Phòng Nhân sự để được hỗ trợ chi tiết.";

    agent.add(fulfillmentText);
}


// --- SỬA LẠI PHẦN ÁNH XẠ INTENT ---
module.exports = (request, response) => {
    const agent = new WebhookClient({ request, response });

    let intentMap = new Map();
    // Thay thế Intent tùy chỉnh bằng Intent mặc định của hệ thống
    intentMap.set('Default Fallback Intent', handleDynamicFallback); 
    // Giữ Intent chính của bạn
    intentMap.set('Hoi_ThongTin_ChinhSach', handleHRQuery); 

    agent.handleRequest(intentMap);
};
