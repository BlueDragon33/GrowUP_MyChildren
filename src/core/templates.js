import { stageForAge } from './model.js';

export const DEVELOPMENT_DOMAINS = Object.freeze([
  'Ngôn ngữ & giao tiếp', 'Tư duy & giải quyết vấn đề', 'Khoa học & công nghệ', 'Thể chất',
  'Cảm xúc & xã hội', 'Kỹ năng sống & tự lập', 'Nghệ thuật & sáng tạo', 'Năng lực số', 'Tự học'
]);

const TEMPLATES = Object.freeze({
  foundation: [
    { domain:'Ngôn ngữ & giao tiếp', title:'Kể lại một câu chuyện ngắn bằng lời của mình' },
    { domain:'Thể chất', title:'Tham gia hoạt động vận động vui mỗi ngày' },
    { domain:'Kỹ năng sống & tự lập', title:'Tự thực hiện một việc cá nhân phù hợp độ tuổi' },
    { domain:'Cảm xúc & xã hội', title:'Gọi tên cảm xúc và biết tìm người lớn hỗ trợ' }
  ],
  learning: [
    { domain:'Tự học', title:'Duy trì một khoảng đọc hoặc học tập ngắn đều đặn' },
    { domain:'Tư duy & giải quyết vấn đề', title:'Giải thích cách mình tìm ra đáp án thay vì chỉ nêu kết quả' },
    { domain:'Thể chất', title:'Duy trì môn vận động yêu thích theo lịch gia đình' },
    { domain:'Ngôn ngữ & giao tiếp', title:'Trình bày một ý tưởng rõ ràng trước người thân hoặc nhóm nhỏ' }
  ],
  expansion: [
    { domain:'Khoa học & công nghệ', title:'Hoàn thành một dự án khám phá hoặc STEM nhỏ' },
    { domain:'Năng lực số', title:'Tạo một sản phẩm số phù hợp lứa tuổi và biết bảo vệ thông tin cá nhân' },
    { domain:'Tự học', title:'Biết chia một mục tiêu thành các bước nhỏ và tự kiểm tra tiến độ' },
    { domain:'Nghệ thuật & sáng tạo', title:'Duy trì một hoạt động sáng tạo để xây portfolio' }
  ],
  strengths: [
    { domain:'Tự học', title:'Thử ít nhất một dự án sâu hơn trong lĩnh vực đang quan tâm' },
    { domain:'Ngôn ngữ & giao tiếp', title:'Rèn kỹ năng trình bày, phản biện và viết có cấu trúc' },
    { domain:'Khoa học & công nghệ', title:'Khám phá nhiều nhánh học tập trước khi chọn ưu tiên' },
    { domain:'Cảm xúc & xã hội', title:'Thực hành làm việc nhóm, trách nhiệm và tự đánh giá' }
  ],
  outcome: [
    { domain:'Tự học', title:'Xây kế hoạch học tập năm dựa trên mục tiêu sau THPT nhưng vẫn có phương án đổi hướng' },
    { domain:'Ngôn ngữ & giao tiếp', title:'Phát triển năng lực ngoại ngữ và trình bày phù hợp mục tiêu cá nhân' },
    { domain:'Năng lực số', title:'Xây portfolio dự án có bằng chứng về quá trình và kết quả' },
    { domain:'Kỹ năng sống & tự lập', title:'Tăng năng lực quản lý thời gian, tài chính cơ bản và quyết định độc lập' }
  ]
});

export function templatesForAge(age) {
  const stage = stageForAge(age);
  return { stage, templates: (TEMPLATES[stage.key] || []).map((item, index) => ({ ...item, id: `${stage.key}-${index + 1}` })) };
}
