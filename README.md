# GrowUP My Children

Website/PWA theo dõi quá trình học tập, kỹ năng, sức khỏe, thể chất, dinh dưỡng, thói quen, portfolio và lộ trình tương lai cho trẻ từ 3 đến 18 tuổi.

## Skeleton v1
- Nhiều hồ sơ trẻ trong một gia đình.
- Timeline phát triển 3–18 tuổi.
- Mục tiêu học tập và kỹ năng.
- Nhật ký sức khỏe, vận động và dinh dưỡng.
- Thói quen, đánh giá xu hướng, portfolio.
- Backward planning cho roadmap dài hạn.
- Lịch và nhắc nhở cục bộ.
- AI cố vấn dạng quy tắc chạy cục bộ, không gửi dữ liệu trẻ ra ngoài.
- Sao lưu/khôi phục JSON.
- PWA/offline app shell và responsive desktop/mobile.
- CI kiểm tra cú pháp + test không cần dependency.

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

## GitHub Pages
Workflow `.github/workflows/pages.yml` triển khai từ `main`. Repository cần đặt **Settings → Pages → Source: GitHub Actions** trước khi lần triển khai đầu tiên có thể thành công.

## Tài liệu
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/IMPLEMENTATION_REPORT.md`

## Quy tắc phát triển
Không sửa thử nghiệm trực tiếp trên `main`. Mỗi đợt thay đổi lớn đi qua feature branch + pull request + CI gate.
