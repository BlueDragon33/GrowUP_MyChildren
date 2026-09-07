# GrowUP My Children

Website/PWA theo dõi quá trình học tập, kỹ năng, sức khỏe, thể chất, dinh dưỡng, thói quen, portfolio và lộ trình tương lai cho trẻ từ 3 đến 18 tuổi.

## Nền tảng hiện tại
- Nhiều hồ sơ trẻ trong một gia đình.
- Timeline phát triển 3–18 tuổi và timeline sự kiện hợp nhất.
- Mục tiêu học tập, kỹ năng, thói quen, portfolio và liên kết minh chứng.
- Nhật ký sức khỏe, vận động và dinh dưỡng; dữ liệu sức khỏe được loại khỏi các safe export mặc định.
- Backward planning cho roadmap dài hạn.
- Lịch, nhắc nhở cục bộ và `.ics` bridge.
- AI cố vấn dạng quy tắc chạy cục bộ, không gửi dữ liệu trẻ ra ngoài.
- Family-role policy cục bộ, consistency scanner và manual retention.
- Báo cáo in có chọn dataset; Health chỉ xuất khi người dùng chủ động chọn.
- Audit-log explorer với JSON/CSV metadata allowlist.
- Development-domain taxonomy có phiên bản, không viết lại lịch sử.
- Multi-child family time planning chỉ tổng hợp thời lượng/lịch, không xếp hạng trẻ.
- Backup JSON có checksum và backup tùy chọn mã hóa passphrase bằng Web Crypto AES-GCM-256.
- PWA/offline app shell, responsive desktop/mobile, cập nhật PWA có xác nhận.
- CI gồm syntax/unit/privacy tests + Chromium E2E + Axe accessibility gate.

## Chạy cục bộ
Ứng dụng không cần bước build. Do ES modules và service worker, hãy chạy qua một HTTP server thay vì mở `file://`.

```bash
python3 -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

## Kiểm tra

```bash
npm run verify
```

Browser E2E/Axe cần Playwright và Chromium như cấu hình trong `.github/workflows/ci.yml`.

## Backup mã hóa
- Passphrase tối thiểu 10 ký tự.
- GrowUP không lưu passphrase.
- Nếu quên passphrase, ứng dụng không thể khôi phục tệp mã hóa.
- Backup mã hóa là bảo vệ tệp cục bộ, không phải cloud sync hoặc authentication.

## GitHub Pages
Workflow `.github/workflows/pages.yml` triển khai từ `main`. Repository cần đặt **Settings → Pages → Source: GitHub Actions** trước khi lần triển khai đầu tiên có thể thành công. Blocker hiện được theo dõi ở issue #2.

## Tài liệu
- `CHANGELOG.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/IMPLEMENTATION_REPORT.md`
- `docs/IMPLEMENTATION_REPORT_V0.8.md`

## Quy tắc phát triển
Không sửa thử nghiệm trực tiếp trên `main`. Mỗi đợt thay đổi lớn đi qua feature branch + pull request + CI gate. Không merge khi `verify` hoặc Chromium E2E/Axe còn lỗi.
