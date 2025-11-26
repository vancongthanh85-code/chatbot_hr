// Khai báo thư viện chính xác (dialogflow-fulfillment)
const { WebhookClient } = require('dialogflow-fulfillment'); 

// Tải file dữ liệu JSON của bạn (Đã kiểm tra cú pháp và đường dẫn)
const HR_POLICIES = require('../data/hr_policies.json');

// --- DANH SÁCH TẤT CẢ CÁC CÂU HỎI CHÍNH LÀM GỢI Ý ---
const PRIMARY_QUESTIONS_LIST = [
    // BHXH (Q1 - Q7)
    "Trợ cấp thai sản bao gồm những nội dung gì, điều kiện và mức hưởng như thế nào?", 
    "Trợ cấp ốm đau bao gồm những nội dung gì, điều kiện và mức hưởng như thế nào?",
    "Sinh con thứ ba thì có được hưởng trợ cấp sinh con của BHXH không?",
    "Mức đóng bảo hiểm BHXH, BHYT, BHTN là bao nhiêu?",
    "Khi nào thì công nhân viên được tham gia BHXH, BHYT, BHTN?",
    "Chưa rút được sổ BHXH ở công ty cũ cần phải làm gì? Nộp sổ BHXH cũ tại đâu?",
    "Nghỉ việc thì nhận Quyết định thôi việc (QĐTV), sổ BHXH vào thời gian nào?",
    
    // BHYT (Q8 - Q9)
    "Nhận thẻ bảo hiểm y tế ở đâu? Khi nào thì được cấp thẻ?",
    "Khi nào thì có thể đổi nơi khám chữa bệnh? Cần những thủ tục đăng ký gì?",
    
    // BHTN (Q11 - Q18)
    "Đóng Bảo hiểm thất nghiệp có bắt buộc hay không?",
    "Mức đóng bảo hiểm thất nghiệp được quy định là bao nhiêu?",
    "Điều kiện, mức hưởng, các thủ tục và hồ sơ NLĐ cần đáp ứng đầy đủ để được hưởng BHTN?",
    "Trong thời gian nghỉ thai sản, người lao động nghỉ việc thì có được hưởng Bảo hiểm thất nghiệp không?",
    "Ngoài trợ cấp thất nghiệp, người thất nghiệp còn được hưởng những quyền lợi gì?",
    
    // LƯƠNG & CHẤM CÔNG (Q23, Q25, Q26, Q29, Q30, Q34)
    "Công ty trả lương vào ngày nào?",
    "Tại sao công ty giữ lương 10 ngày của nhân viên?",
    "Thưởng chuyên cần là gì? Đi làm trễ/về sớm dưới 01h bị trừ TCC như thế nào?",
    "Trường hợp quên quẹt thẻ giờ vào/giờ ra hoặc không quẹt thẻ nguyên ngày thì phải làm sao?",
    "Xin nghỉ việc cần những thủ tục gì? Lương nghỉ việc được chi trả như thế nào?",
    
    // THẺ ATM / ĐỒNG PHỤC (Q37, Q38, Q40)
    "Thẻ ATM làm mới của Ngân hàng cần những thủ tục gì? Có mất phí không?",
    "Nếu bị mất thẻ, nuốt thẻ, mất mã pin thì cần thủ tục gì?",
    "Đồng phục (giày/nón/khăn/áo) khi nào thì được cấp lại?",
    
    // THUẾ TNCN (Q56, Q57, Q58)
    "Thuế thu nhập cá nhân (TNCN) là gì? Công nhân viên có thu nhập... bao nhiêu trở lên thì phải đóng thuế TNCN?",
    "Muốn đăng ký Mã số thuế TNCN (MST TNCN) thì phải làm như thế nào?",
    "Tiền thuế TNCN được tính như thế nào?",
];

// Hàm xử lý Intent chính (Hoi_ThongTin_ChinhSach)
function handleHRQuery(agent) {
    // ... (Giữ nguyên logic handleHRQuery để xử lý truy vấn HR)
    const rawPolicyName = agent.parameters.chinh_sach_hr;
    const rawQuery = agent.query.toLowerCase();
    
    let fulfillmentText = "Xin lỗi, tôi chưa tìm thấy thông tin chi tiết chính sách này trong cẩm nang. Vui lòng hỏi rõ hơn hoặc liên hệ Phòng Nhân sự.";

    // --- LOGIC ÁNH XẠ KHÓA ---
    let policyKey = rawPolicyName;
    if (rawPolicyName === 'trả lương' || rawPolicyName === 'tiền lương') {
        policyKey = 'Luong';
    } else if (rawPolicyName === 'nghỉ đẻ' || rawPolicyName === 'sinh con') {
        policyKey = 'ThaiSan';
    } else if (rawPolicyName === 'thất nghiệp' || rawPolicyName === 'BHTN' || rawPolicyName === 'BHXH') {
        policyKey = 'BHTN';
    } else if (rawPolicyName === 'giảm trừ gia cảnh' || rawPolicyName === 'mức giảm trừ' || rawPolicyName === 'thuế') {
        policyKey = 'TNCN';
    } else if (rawPolicyName === 'atm' || rawPolicyName === 'mất thẻ' || rawPolicyName === 'nuốt thẻ') {
        policyKey = 'ATM'; 
    } 
    // --- KẾT THÚC LOGIC ÁNH XẠ ---

    if (policyKey && HR_POLICIES[policyKey]) {
        const policyData = HR_POLICIES[policyKey];

        // --- LOGIC XỬ LÝ NGOẠI LỆ ĐẶC BIỆT: SINH CON THỨ BA (Q3) ---
        if (policyKey === 'ThaiSan' && rawQuery.includes('thứ ba')) {
            fulfillmentText = "Luật BHXH quy định không phân biệt nữ lao động sinh con lần thứ 1, 2, 3… nếu có đủ điều kiện (đóng BHXH từ đủ sáu tháng trở lên trong thời gian mười hai tháng trước khi sinh con) thì được hưởng chế độ thai sản.";
            agent.add(fulfillmentText);
            return; 
        }
        
        // --- LOGIC PHÂN TÍCH NHU CẦU CHUNG (ĐÃ SỬA LỖI ƯU TIÊN DỮ LIỆU) ---
        if (rawQuery.includes('mức hưởng') || rawQuery.includes('bao nhiêu') || rawQuery.includes('mức đóng') || rawQuery.includes('phần trăm')) {
            if (rawQuery.includes('đóng') || rawQuery.includes('phần trăm') || rawQuery.includes('tổng')) {
                fulfillmentText = `Về ${policyData.chu_de}, mức đóng là: ${policyData.muc_dong || 'Không có thông tin về mức đóng.'}`;
            } else {
                fulfillmentText = `Về ${policyData.chu_de}, mức tiền/tỷ lệ là: ${policyData.muc_huong || policyData.giam_tru_ban_than || 'Không có thông tin về mức tiền/tỷ lệ.'}`;
            }
        } else if (rawQuery.includes('thời gian') || rawQuery.includes('khi nào') || rawQuery.includes('ngày nào') || rawQuery.includes('bao lâu')) {
            fulfillmentText = `Về ${policyData.chu_de}, quy định thời gian là: ${policyData.thoi_gian_nghi || policyData.ngay_tra || 'Vui lòng hỏi chi tiết hơn.'}`;
        } else {
            let summary = policyData.muc_huong || policyData.dieu_kien_chung || policyData.ngay_tra || policyData.phan_anh || policyData.giu_luong;
            fulfillmentText = `Thông tin chính về ${policyData.chu_de} là: ${summary}`;
        }
    } 
    
    agent.add(fulfillmentText);
}


// --- HÀM XỬ LÝ FALLBACK ĐỘNG (Default Fallback Intent) ---
function handleDynamicFallback(agent) {
    const query = agent.query.toLowerCase();
    let suggestions = [];
    
    // TÌM CÁC TỪ KHÓA TRONG DANH SÁCH GỢI Ý CHUNG (Sử dụng include để tìm các câu hỏi phù hợp)
    PRIMARY_QUESTIONS_LIST.forEach(q => {
        if (query.includes("bhxh") && q.includes("BHXH") || q.includes("sổ BHXH")) {
            suggestions.push(q);
        } else if (query.includes("thai sản") && q.includes("thai sản")) {
            suggestions.push(q);
        } else if (query.includes("lương") && q.includes("lương")) {
            suggestions.push(q);
        } else if (query.includes("thẻ") && q.includes("ATM")) {
            suggestions.push(q);
        }
    });

    let fulfillmentText;
    
    if (suggestions.length > 0) {
        // Nếu tìm thấy bất kỳ gợi ý nào, chỉ hiển thị 5 gợi ý đầu tiên
        const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);
        
        fulfillmentText = "Xin lỗi, tôi chưa hiểu rõ ý bạn. Có phải bạn đang quan tâm đến các vấn đề sau không?\n\n";
        // Định dạng thành danh sách có số thứ tự để dễ chọn
        fulfillmentText += uniqueSuggestions.map((item, index) => `${index + 1}. ${item}`).join('\n'); 
    } else {
        // Nếu không tìm thấy bất kỳ từ khóa nào, trả về các chủ đề lớn nhất
        fulfillmentText = "Xin lỗi, tôi không tìm thấy câu trả lời chính xác. Có phải bạn đang muốn hỏi về Thai sản, Lương, hay Thuế TNCN không? Vui lòng hỏi rõ ràng hơn.";
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
