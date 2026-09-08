# Implementation Report · GrowUP My Children v1.3.0

## Phạm vi

v1.3.0 triển khai Lượt 86–90 trên nền stable v1.2.0 (`483a6a9e9225da2641348686bcbe8e331ea9e821`). Data schema tiếp tục ở v5; đây là nâng cấp chức năng/runtime, không phải migration dữ liệu mới.

## Lượt 86 · Safe-export integrity

- Safe-export package có manifest checksum SHA-256.
- Có bộ xác minh cục bộ để kiểm tra package nhận được có khớp checksum hay không.
- Integrity layer không mở rộng allowlist dữ liệu: Health/Nutrition và free-text ngoài allowlist vẫn không được đưa vào safe export.
- Không cần tải child payload lên dịch vụ ngoài để xác minh.

## Lượt 87 · Neutral workload display bands

- Gia đình có thể cấu hình hai ngưỡng phút và nhãn hiển thị cho các dải thời lượng.
- Cấu hình là local-only và có giới hạn/chuẩn hóa đầu vào.
- Dải hiển thị chỉ mô tả thời lượng đã lập lịch; không tạo score, rank, rating, percentile hay kết luận hiệu suất của trẻ.
- Workload calendar v1.2 được render lại theo cấu hình v1.3 nhưng vẫn giữ text equivalent cho bàn phím/screen reader.

## Lượt 88 · Saved-search organizer

- Bổ sung folder, pin/unpin và phát hiện các bộ tiêu chí trùng nhau.
- Saved search tiếp tục chỉ lưu criteria đã chuẩn hóa; không cache kết quả, snippet hay nội dung nhạy cảm từ bản ghi.
- Các thao tác tổ chức không mở rộng phạm vi privacy-safe index.

## Lượt 89 · Recovery reminder lifecycle

- Hỗ trợ hoàn thành/mở lại, đổi ngày và xóa recovery reminder bằng thao tác người dùng rõ ràng.
- Khi đổi ngày, lineage giữ ngày gốc và lịch sử ngày trước đó ở mức metadata tối thiểu.
- Lifecycle history không chứa passphrase, ciphertext hoặc payload restore.
- Không có tự động restore và không có background calendar write trong v1.3.

## Lượt 90 · Evidence-driven legacy retirement review

- Kết hợp compatibility evidence với runtime dependency graph.
- Một legacy module chỉ có thể được xem là `candidate` khi đủ toàn bộ 6 flow bắt buộc, inactive ở mọi flow và runtime entry không còn import module đó.
- Module còn import hoặc thiếu evidence luôn là `retain`.
- v1.3 không tự xóa legacy module; mọi removal sau này phải là commit riêng và chạy lại full `verify` + Chromium/Axe.

## Release profile

- App: `1.3.0`
- Schema: `5`
- Service-worker cache: `growup-mychildren-v13`
- Node: `22.x`
- Playwright: `1.55.0`
- Axe Playwright: `4.10.2`
- Rollback stable: v1.2.0 @ `483a6a9e9225da2641348686bcbe8e331ea9e821`
- Public HTML entrypoints: một `src/runtime-entry.js` và một `src/runtime.css`

## CI / regression policy

PR #14 là release gate của v1.3. Merge chỉ được phép khi cùng **exact final head** PASS cả:

1. `verify` — syntax/static/unit/privacy/release checks.
2. Chromium E2E + Axe — browser flow và không có serious/critical accessibility violation.

Trong quá trình gate, một E2E L90 từng fail vì assertion `not.toContainText('candidate')` áp lên toàn panel và vô tình bắt từ `candidate` trong phần chú thích giải thích chính sách. Sửa lỗi không làm yếu gate: test mới kiểm trực tiếp decision của từng hàng module và yêu cầu tất cả module đang được tham chiếu phải là `retain`; Axe serious/critical vẫn chạy nguyên vẹn.

Final head/run evidence được ghi vào PR #14 trước khi merge để tránh tài liệu trong repo tự làm thay đổi head sau lần chứng minh cuối.

## Privacy boundaries giữ nguyên

- Không gửi dữ liệu trẻ tới external AI/service trong các Lượt 86–90.
- Safe export không chứa Health/Nutrition ngoài policy đã có.
- Saved searches không lưu result/snippet.
- Recovery history chỉ là metadata tối thiểu.
- Không có auto-deletion legacy code, auto-restore hay tự động ghi lịch ngoài.
- Encrypted backup tiếp tục dùng PBKDF2 + AES-GCM và không lưu passphrase.

## GitHub Pages

GitHub Pages là blocker triển khai riêng, được theo dõi tại issue #2. Source CI PASS không đồng nghĩa site Pages đã live. Cần bật một lần tại repository Settings → Pages → Build and deployment → Source → GitHub Actions, sau đó workflow Pages và post-deploy verification phải PASS trước khi công bố URL public.

## Lượt tiếp theo

ROADMAP đã tạo Lượt 91–95 cho verification receipt metadata, workload presets trung tính, portable saved-search criteria, recovery calendar bridge có chọn lọc và legacy retirement dry-run. Các lượt này không thuộc v1.3.0 và không được dùng để mở rộng scope PR #14.
