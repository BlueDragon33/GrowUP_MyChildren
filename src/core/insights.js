import { ageOnDate, stageForAge, progressPercent } from './model.js';

export function buildInsights(child) {
  if (!child) return [];
  const age = ageOnDate(child.dateOfBirth);
  const stage = stageForAge(age);
  const insights = [
    { level: 'info', title: `Giai đoạn ${stage.title}`, text: `Ưu tiên hiện tại: ${stage.focus.join(', ')}.` }
  ];

  const goals = child.learningGoals || [];
  if (goals.length) {
    const p = progressPercent(goals);
    insights.push({
      level: p >= 70 ? 'good' : 'attention',
      title: 'Tiến độ mục tiêu học tập',
      text: `${p}% mục tiêu hiện có đã hoàn thành. ${p < 50 ? 'Nên giảm số mục tiêu đồng thời hoặc chia mục tiêu thành bước nhỏ.' : 'Có thể duy trì nhịp hiện tại và ưu tiên chất lượng.'}`
    });
  } else {
    insights.push({ level: 'attention', title: 'Chưa có mục tiêu học tập', text: 'Hãy thêm 1–3 mục tiêu ngắn hạn gắn với giai đoạn phát triển hiện tại.' });
  }

  const health = child.healthRecords || [];
  if (!health.length) {
    insights.push({ level: 'info', title: 'Theo dõi sức khỏe', text: 'Chưa có bản ghi sức khỏe. Có thể bắt đầu bằng chiều cao, cân nặng, giấc ngủ và ngày đo.' });
  }

  const habits = child.habits || [];
  if (!habits.length) {
    insights.push({ level: 'info', title: 'Thói quen', text: 'Chưa thiết lập thói quen. Ưu tiên một thói quen nhỏ, dễ duy trì trước.' });
  }

  return insights;
}
