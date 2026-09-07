# Changelog

Các thay đổi đáng chú ý của GrowUP My Children được ghi theo từng bản ổn định đã/đang qua CI gate.

## [1.0.0] - 2026-09-07
### Added
- Lượt 71: Development-domain coverage dashboard đếm bản ghi Learning/Skills/Portfolio đã hoặc chưa gắn taxonomy; không tạo điểm, rank, rating hay percentile cho trẻ.
- Lượt 72: Family-plan conflict assistant phát hiện ngày có nhiều hoạt động/quá ngưỡng phút và đề xuất ngày lân cận còn dung lượng; không tự đổi lịch.
- Lượt 73: Privacy-safe search mở rộng với filter child/domain/date/dataset và deep link về đúng hồ sơ, tab nguồn, bản ghi được highlight.
- Lượt 74: Recovery-drill history có giới hạn, chỉ lưu `at`, `status`, `format`, `schemaVersion`.
- Lượt 75: Runtime bootstrap hợp nhất còn một JavaScript entrypoint và một CSS entrypoint trong HTML.

### Changed
- App version nâng lên `1.0.0`; data schema tiếp tục v5, không cần migration mới cho Lượt 71–75.
- Service-worker cache nâng lên `growup-mychildren-v10`.
- `src/runtime-entry.js` và `src/runtime.css` trở thành entrypoint công khai; các lớp v4–v10 được nạp như dependency tương thích nội bộ theo thứ tự cố định.
- Release/rollback profile giữ rollback ổn định về v0.9.0 commit `c7cdab1c2b5aedf4952d9f276bef6d444b27713a`.

### Security / Privacy
- Coverage là metadata vệ sinh dữ liệu, không phải thước đo phát triển hay thành tích.
- Conflict assistant không so sánh ưu tiên giữa các trẻ và không ghi thay đổi lịch tự động.
- Search deep-link không mở rộng safe index: Health, Nutrition, health notes và Portfolio notes vẫn bị loại.
- Recovery history không lưu passphrase, ciphertext, salt, IV, preview chi tiết hay payload đã giải mã.
- Browser regression kiểm trực tiếp rằng coverage không thêm các field `score/rank/rating/percentile` và recovery history chỉ còn đúng bốn field metadata an toàn.

### Gate
- Pre-final code gate trên commit `98ca4dc9d520c46851333a1e18b14c46966b6b88`: `verify` PASS và Chromium E2E/Axe **18/18 PASS**.
- PR #11 vẫn bắt buộc một CI nữa trên final documentation/code head trước merge; không bypass lỗi vì thay đổi chỉ là tài liệu.

### Rollback
- Điểm rollback ổn định trước v1.0: v0.9.0 / commit `c7cdab1c2b5aedf4952d9f276bef6d444b27713a`.

## [0.9.0] - 2026-09-07
### Added
- Lượt 66: Versioned development-domain binding cho bản ghi Learning/Skill/Portfolio mới với domain ID, label snapshot và taxonomy version; bản ghi lịch sử không bị viết lại.
- Lượt 67: Family-plan `.ics` bridge chỉ xuất các mục người dùng chủ động chọn; không đưa tên trẻ, note, Health/Nutrition hoặc kế hoạch không chọn vào tệp.
- Lượt 68: Privacy-safe local search cho Learning, Skills, Portfolio metadata, Roadmap và Family Plan; Health/Nutrition và free-text notes bị loại khỏi index.
- Lượt 69: Encrypted-backup compatibility inspector và recovery drill không restore; kiểm format/KDF/cipher và khả năng decrypt/checksum trong bộ nhớ.
- Lượt 70: Release-candidate profile khóa app/schema/SW cache/Node/Playwright/Axe và rollback point.

### Changed
- App version nâng lên `0.9.0`; data schema tiếp tục v5.
- Service-worker cache nâng lên `growup-mychildren-v9`.
- Node khóa ở 22.x; Playwright `1.55.0`; Axe Playwright `4.10.2`.
- Runtime v0.9 hợp nhất về `src/v9-runtime.js`; module thử nghiệm `src/v9.js` đã bị loại khỏi release tree.
- Release label kế thừa từ v0.8 được đồng bộ với `APP_VERSION` hiện tại.

### Fixed during CI/Axe gate
- L66 submit không còn làm người dùng rơi về Overview: state vẫn reload đồng bộ nhưng quay lại đúng Learning/Skills/Portfolio và chỉ xóa resume marker sau khi trang đích thực sự hiển thị.
- Sidebar brand text được tăng độ tương phản để đạt Axe/WCAG gate.
- Mobile 390px không còn horizontal overflow do grid/card min-width.
- Timeline cuộn ngang trở thành focusable `region` có `aria-label`, cho phép truy cập bằng bàn phím thay vì bỏ qua Axe rule.
- Static/release tests được cập nhật để phản ánh current version/rollback thay vì hard-code v0.8.

### Security / Privacy
- Search index cố ý không chứa Health, Nutrition, health notes hoặc Portfolio notes.
- `.ics` family-plan export chỉ chứa metadata của chính item đã chọn.
- Recovery inspector không trả ciphertext; recovery drill không ghi localStorage và không thực hiện restore.
- Full encrypted-backup download/decrypt/checksum/confirmed-restore regression từ v0.8 vẫn được chạy trong suite v0.9.

### Gate
- `verify`: PASS trên code head `c279e3602232a8188f95bf9ac1c655f6439e13bf`.
- Chromium E2E + Axe: **14/14 PASS** trên cùng code head, gồm mobile 390px, v9 domain binding, selective `.ics`, safe search, recovery inspector, v8 encrypted-backup roundtrip/restore và Axe trên toàn bộ panel v8+v9.
- Một final CI run khác sẽ được yêu cầu trên head cleanup/tài liệu trước khi merge PR #10.

### Rollback
- Điểm rollback ổn định trước v0.9: v0.8.0 / commit `241653d6fb12f021ebd20704144e47a5a12cc8fd`.

## [0.8.0] - 2026-09-07
### Added
- Lượt 61: Audit-log explorer và JSON/CSV export chỉ cho metadata theo allowlist; không xuất raw health/nutrition/free-text.
- Lượt 62: Development-domain taxonomy có phiên bản, đổi nhãn/bật tắt/thêm miền tùy chỉnh mà không viết lại dữ liệu lịch sử.
- Lượt 63: Multi-child family time planning, chỉ tổng hợp số lịch/phút/ngày có kế hoạch theo thứ tự hồ sơ; không score/rank trẻ.
- Lượt 64: Backup tùy chọn mã hóa bằng passphrase với PBKDF2-SHA-256 + AES-GCM-256, checksum sau giải mã, không lưu passphrase.
- Lượt 65: Version banner, changelog, PWA update có xác nhận và rollback point ổn định.

### Changed
- Service worker v8 không còn `skipWaiting()` tự động khi install; bản cập nhật chỉ kích hoạt sớm khi người dùng chủ động áp dụng.
- `npm run verify` bao phủ toàn bộ runtime/core v0.8.
- Custom taxonomy IDs được normalize idempotent để không sinh tiền tố `custom-custom-*` qua nhiều lần save/load.

### Security / Privacy
- Backup mã hóa có thể chứa toàn bộ dữ liệu, kể cả Health, nhưng ciphertext không chứa plaintext và chỉ khôi phục sau khi giải mã + checksum + xác nhận.
- Audit export tiếp tục loại raw health data khỏi output theo mặc định cố định.
- Passphrase không được ghi vào localStorage/sessionStorage hay backup envelope.

### Gate
- Unit/static/privacy `verify`: PASS sau khi sửa lỗi taxonomy ID normalization.
- Chromium E2E + Axe: 9/9 PASS trên head có code v0.8, gồm family planning và encrypted backup download/restore thực tế.

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
