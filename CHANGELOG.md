# Changelog

Các thay đổi đáng chú ý của GrowUP My Children được ghi theo từng bản ổn định đã/đang qua CI gate.

## [0.8.0] - đang kiểm duyệt PR
### Added
- Lượt 61: Audit-log explorer và JSON/CSV export chỉ cho metadata theo allowlist; không xuất raw health/nutrition/free-text.
- Lượt 62: Development-domain taxonomy có phiên bản, đổi nhãn/bật tắt/thêm miền tùy chỉnh mà không viết lại dữ liệu lịch sử.
- Lượt 63: Multi-child family time planning, chỉ tổng hợp số lịch/phút/ngày có kế hoạch theo thứ tự hồ sơ; không score/rank trẻ.
- Lượt 64: Backup tùy chọn mã hóa bằng passphrase với PBKDF2-SHA-256 + AES-GCM-256, checksum sau giải mã, không lưu passphrase.
- Lượt 65: Version banner, changelog, PWA update có xác nhận và rollback point ổn định.

### Changed
- Service worker v8 không còn `skipWaiting()` tự động khi install; bản cập nhật chỉ kích hoạt sớm khi người dùng chủ động áp dụng.
- `npm run verify` bao phủ toàn bộ runtime/core v0.8.

### Security / Privacy
- Backup mã hóa có thể chứa toàn bộ dữ liệu, kể cả Health, nhưng ciphertext không chứa plaintext và chỉ khôi phục sau khi giải mã + checksum + xác nhận.
- Audit export tiếp tục loại raw health data khỏi output theo mặc định cố định.
- Passphrase không được ghi vào localStorage/sessionStorage hay backup envelope.

### Rollback
- Điểm rollback ổn định trước v0.8: v0.7.0 / commit `adb345c5ec94ccb1933661bad06c8c6473e7ef36`.

## [0.7.0]
- Lượt 56–60: consistency scanner, manual retention, neutral year-over-year summary, printable report opt-in Health, privacy/destructive regression và Axe/Chromium gate.
- Sửa các vi phạm WCAG AA color contrast do Axe phát hiện trước khi merge.
- `verify` + 7/7 browser E2E/Axe PASS trước merge.

## [0.6.0]
- Lượt 51–55: evidence repair, portable archive manifest SHA-256, timeline period filters, dialog/focus accessibility và Pages post-deploy verification.

## [0.5.0]
- Lượt 46–50: unified development timeline, evidence links, family policy safeguards, safe interoperability exports và Chromium production-readiness gate.
