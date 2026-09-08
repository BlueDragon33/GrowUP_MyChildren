# Implementation Report v1.6.0 — Lượt 101–105

## Phạm vi
v1.6 tiếp tục hardening các gói metadata local-first của GrowUP My Children. Không đổi data schema (v5), không thêm cloud write, không thêm Google Calendar authorization, không thêm Health/Nutrition vào safe package và không tự động xóa legacy module.

## Lượt 101 — Verification receipt package integrity
- Receipt package được bọc SHA-256 manifest dựa trên canonical payload không có manifest.
- Import bắt buộc integrity PASS trước preview.
- Preview loại receipt sai cấu trúc và receipt trùng; apply vẫn giữ tối đa 50 receipt.
- Receipt lưu/nhập chỉ có `at`, `format`, `algorithm`, `checksumResult`; không lưu raw/expected/actual checksum hoặc source export payload.

## Lượt 102 — Workload preset integrity + conflict preview
- Custom preset package có SHA-256 manifest.
- Import có hai chiến lược rõ ràng: `skip` hoặc `rename` khi trùng name/ID.
- Không overwrite im lặng. Preset sau apply chỉ persist `id`, `name`, `config`.
- Validation v1.5 vẫn bắt buộc: child-linked keys và score/rank/performance/health semantics bị từ chối.

## Lượt 103 — Saved Search integrity receipt management
- Lọc receipt theo valid/invalid, format và khoảng ngày.
- Export metadata-only package và confirmed-clear local history.
- Không đưa expected/actual checksum, result/snippet hay Health/Nutrition payload vào file quản lý.

## Lượt 104 — Recovery reconciliation report
- User upload `.ics`, preview reconciliation rồi tích chọn từng row cần export.
- Report chỉ chứa `id`, status, date/completed/originDate của hai phía.
- Không chứa child name, reminder title hoặc raw ICS text.
- Đổi file `.ics` sau preview sẽ vô hiệu hóa preview cũ; không có API apply, không ghi external calendar.

## Lượt 105 — Compatibility evidence package
- Evidence store có package format/version + SHA-256 manifest.
- Import validate module/flow/observed/active/timestamp và dedupe exact record.
- `axe` có thể được export để đối chiếu nhưng không được import lại vào retirement evidence; thiết bị đích phải chạy Axe thật.
- Không chứa selector/DOM payload/child data; không gọi retirement removal.

## Release profile
- App: `1.6.0`
- Data schema: `5`
- Service worker cache: `growup-mychildren-v16`
- Rollback: stable v1.5 main `5f626b9b22cd3a6021cde2a7c9b41fd072e016d4`
- Node: `22.x`
- Playwright: `1.55.0`
- Axe Playwright: `4.10.2`
- Public runtime vẫn đúng 1 JavaScript entrypoint + 1 CSS entrypoint.

## Gate bắt buộc
Final PR head phải cùng một SHA PASS cả:
1. `verify`
2. Chromium E2E + Axe serious/critical

Không hạ Axe rule, không bỏ assertion và không merge dựa trên run của SHA cũ. Sau merge phải kiểm lại cả hai job trên `main`. GitHub Pages là gate deployment riêng và vẫn phụ thuộc repository setting issue #2.
