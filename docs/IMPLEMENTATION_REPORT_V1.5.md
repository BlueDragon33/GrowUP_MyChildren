# Implementation report v1.5 · Lượt 96–100

## Phạm vi
v1.5 tiếp tục offline-first/local-first trên data schema v5. Không thêm đăng nhập, cloud sync, Google Calendar write, web push, binary upload hoặc external AI provider.

## Lượt 96 · Verification receipt management
- Lọc receipt theo kết quả/format/khoảng ngày.
- Xuất package receipt metadata-only.
- Xóa lịch sử chỉ sau xác nhận rõ ràng ở UI.
- Package không chứa raw/expected/actual checksum, tên file nguồn, payload safe-export, dữ liệu trẻ hoặc free-text.

## Lượt 97 · Custom workload preset library
- Tạo, áp dụng, xóa, export và preview-import preset tùy chỉnh cục bộ.
- Giới hạn 20 preset.
- Từ chối tên/nhãn có nghĩa score/rank/rating/percentile/thành tích/sức khỏe và các khóa childId/Health/Nutrition.
- Import không tự áp dụng preset; duplicate/rejected được preview trước.

## Lượt 98 · Saved Search package integrity
- SHA-256 manifest trên canonical package criteria.
- Phát hiện tamper trước import.
- Receipt xác minh chỉ lưu timestamp/format/algorithm/valid-invalid, tối đa 50 mục.
- Import hợp lệ vẫn đi qua safe-search normalization và duplicate handling; result/snippet/Health/Nutrition không được persist.

## Lượt 99 · Recovery ICS reconciliation preview
- Đọc file `.ics` do người dùng chọn.
- So sánh id/date/completed/originDate với recovery reminder cục bộ.
- Chỉ trả preview same/different/local-only/file-only.
- Không có API apply, không sửa reminder, không đọc/ghi Google Calendar và không lưu nội dung file sau preview.

## Lượt 100 · Persistent six-flow compatibility evidence
- Bounded store tối đa 120 metadata records, dedupe theo module + flow.
- Runtime ghi Overview/Learning/Skills/Portfolio/mobile khi flow thật sự xuất hiện.
- `axe` không được runtime tự giả lập; browser regression chỉ ghi flow Axe sau khi `@axe-core/playwright` thực sự PASS serious/critical gate.
- Retirement dry-run đọc evidence tích lũy; thiếu một flow, active ở bất kỳ flow hoặc còn runtime dependency đều giữ `retain`.
- Không tự xóa legacy module.

## Release profile
- App: `1.5.0`
- Data schema: `5`
- Service worker cache: `growup-mychildren-v15`
- Node: `22.x`
- Playwright: `1.55.0`
- Axe Playwright: `4.10.2`
- Rollback: stable v1.4 main `be5dbb338a0795dcbf6615702c0e4ebee72785d3`

## Gate bắt buộc
PR chỉ được merge khi cùng exact final head PASS:
1. `verify`
2. Chromium E2E + Axe serious/critical

Sau merge phải chạy lại cùng hai gate trên main. GitHub Pages vẫn là blocker repository setting riêng tại issue #2 và không được dùng thay thế source gate.
