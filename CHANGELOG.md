# Changelog

Các thay đổi đáng chú ý của GrowUP My Children được ghi theo từng bản ổn định đã/đang qua CI gate.

## [1.4.0] - 2026-09-08
### Added
- Lượt 91: Safe-export verification receipt history tối đa 50 mục, chỉ lưu `at`, `format`, `algorithm`, `checksumResult`.
- Lượt 92: Workload preset cục bộ gồm Gọn/Tiêu chuẩn/Mở rộng và nút reset mặc định; toàn bộ nhãn/tham số trung tính.
- Lượt 93: Saved Search criteria package có format/version, export JSON, preview-before-apply, loại dataset ngoài allowlist và bỏ criteria trùng.
- Lượt 94: Recovery calendar bridge tạo `.ics` chỉ từ reminder người dùng tích chọn, giữ source/origin-date lineage bằng `X-GROWUP-*` metadata.
- Lượt 95: Legacy retirement dry-run JSON report chứa evidence/dependency/proposed-diff metadata nhưng không áp dụng removal.

### Changed
- App version nâng lên `1.4.0`; data schema tiếp tục v5.
- Service-worker cache nâng lên `growup-mychildren-v14`.
- Runtime vẫn chỉ có một JavaScript entrypoint + một CSS entrypoint; `v14-runtime.js`/`v14.css` là dependency nội bộ sau v13 và trước accessibility layer.
- Rollback pin về stable v1.3 main commit `51e4a80609d40915106663e983dbfa1202fee228`.
- Axe overview gate được mở rộng để chờ và quét cả panel v13–v14 trước khi đánh giá serious/critical violations.

### Security / Privacy
- Verification receipt không lưu raw checksum, expected/actual checksum, file name, file payload, preview, child payload hoặc free-text từ safe export.
- Workload presets không chứa childId, score/rank hoặc logic đánh giá hiệu suất/sức khỏe.
- Saved Search package chỉ dùng criteria đã chuẩn hóa; `results`, `snippet`, Health/Nutrition dataset không được lưu/khôi phục.
- Recovery `.ics` không đưa tên trẻ, passphrase, backup payload và không thực hiện background/Google Calendar write.
- Retirement dry-run luôn `removalsApplied:false`, `safeToRemoveAutomatically:false`; actual removal bắt buộc là commit riêng qua full exact-head gate.

### Gate
- PR #16 exact final head `dd78abd320779b0f1f37fce74b3d32ccb7ce6272`, CI run `34175696805`: `verify` PASS và Chromium browser E2E + Axe serious/critical PASS; Playwright diagnostics upload PASS.
- Không assertion hoặc Axe rule nào bị bỏ/giảm để lấy PASS.
- Merged stable main commit `612a9a8783a6bf02617f2725a4f53c7bb6114b9c`; post-merge CI run `34175820489`: `verify` + `browser-e2e` đều PASS.
- Pages run `34175820460` fail riêng tại `Configure Pages`; Upload/Deploy/Verify bị skip do repository setting issue #2, không phải source regression.

## [1.3.0] - 2026-09-08
### Added
- Lượt 86: Safe-export integrity manifest dùng SHA-256 và bộ kiểm tra checksum cục bộ, không mở rộng allowlist dữ liệu trẻ.
- Lượt 87: Workload display bands tùy chỉnh ngưỡng phút/nhãn trung tính, lưu local-only và không tạo score/rank.
- Lượt 88: Saved-search organizer gồm folder, ghim và phát hiện criteria trùng; vẫn chỉ lưu tiêu chí tìm kiếm.
- Lượt 89: Recovery reminder lifecycle cho hoàn thành/mở lại, đổi ngày và xóa có chủ đích, đồng thời giữ lineage nguồn/ngày tối thiểu.
- Lượt 90: Legacy retirement review kết hợp evidence matrix với runtime dependency graph; chỉ review, không tự xóa module.

### Changed
- App version nâng lên `1.3.0`; data schema tiếp tục v5.
- Service-worker cache nâng lên `growup-mychildren-v13`.
- Runtime tiếp tục đúng một JavaScript entrypoint + một CSS entrypoint; v13 được nạp như dependency nội bộ sau v12 và trước lớp accessibility.
- Rollback pin về stable v1.2.0 main commit `483a6a9e9225da2641348686bcbe8e331ea9e821`.
- Regression test release/static được đồng bộ với profile v1.3 nhưng giữ nguyên privacy/PWA/encryption/destructive-action gates.

### Security / Privacy
- Checksum không đưa thêm Health/Nutrition/free-text bị loại vào safe-export package.
- Workload bands chỉ mô tả thời lượng và nhãn gia đình cấu hình; không suy luận hiệu suất hoặc so sánh trẻ.
- Saved-search folder/pin không lưu snippet/result payload.
- Recovery lifecycle history không chứa passphrase, ciphertext hay payload restore.
- Legacy module chỉ có thể thành candidate khi đủ 6 flow evidence, inactive ở mọi flow và runtime graph không còn import; v1.3 không tự động remove.

### Gate
- PR #14 exact final head `9e9a17be87eec23919ba2a8ac50416cae196f91f`, CI run `34174215483`: `verify` PASS và Chromium browser E2E + Axe serious/critical PASS.
- Lỗi browser trước final gate là assertion E2E vô tình bắt chữ `candidate` trong phần chú thích; assertion được sửa để kiểm trực tiếp decision từng module, không bỏ/giảm Axe rule.
- Merged stable main commit `9244e094c00c4d620a6ceaac6ced7de8f8dabdbc`; post-merge CI run `34174310765`: `verify` + `browser-e2e` đều PASS.
- Pages run `34174310745` vẫn fail riêng ở bước `Configure Pages` do repository setting, issue #2; deploy/verify Pages bị skip và không được dùng làm bằng chứng thay thế source gate.

## [1.2.0] - 2026-09-07
### Added
- Lượt 81: Safe-export wizard với preview bắt buộc trước download, chọn hồ sơ/dataset, số bản ghi và allowlist trường cụ thể.
- Lượt 82: Workload calendar theo tháng với band phút trung tính và mô tả văn bản tương đương cho bàn phím/trình đọc màn hình.
- Lượt 83: Saved-search management gồm đổi tên, đổi thứ tự và reset có xác nhận về tiêu chí an toàn.
- Lượt 84: Recovery schedule tích hợp vào reminder list với hồ sơ đích do người dùng chọn và deduplicate theo `source + date`.
- Lượt 85: Compatibility evidence matrix yêu cầu đủ Overview/Learning/Skills/Portfolio/mobile/Axe trước khi xét retire module.

### Changed
- App version nâng lên `1.2.0`; data schema tiếp tục v5.
- Service-worker cache nâng lên `growup-mychildren-v12`.
- Runtime tiếp tục dùng một JS entrypoint + một CSS entrypoint; `v12-runtime.js`/`v12.css` là dependency nội bộ.
- Rollback pin về main v1.1.0 commit `359ea99f041654108c517d5c16be5e819932bb64`.
- Legacy module definitions có API read-only để browser gate thu evidence từ đúng selector runtime.

### Security / Privacy
- Safe export v2 bỏ Health/Nutrition và mọi trường ngoài allowlist; `Portfolio.note` không được đưa vào gói wizard.
- Download bị khóa cho tới khi preview hợp lệ; thay đổi lựa chọn làm preview cũ mất hiệu lực.
- Saved search vẫn chỉ lưu criteria, không cache result/snippet.
- Recovery reminder không lưu passphrase và không tự restore; cùng source/date không tạo bản trùng.
- Compatibility matrix không cho phép retire khi thiếu bất kỳ flow bắt buộc hoặc module active ở bất kỳ flow nào.

### Gate
- PR #13 final head `4c169fe104bdd766c628fa5454a43c18224fc066`, CI run `34133139602`: `verify` PASS và Chromium browser E2E + Axe PASS.
- Merged stable main commit `483a6a9e9225da2641348686bcbe8e331ea9e821`.
- GitHub Pages vẫn là blocker riêng ở `Configure Pages`/repository setting, issue #2.

## [1.1.0] - 2026-09-07
### Added
- Lượt 76: Child-profile portability map phân loại local-only / safe-export / encrypted-backup-only / future-cloud-capable.
- Lượt 77: Family workload windows 7/14/30 ngày với tổng thời lượng/lịch trung tính, không xếp hạng trẻ.
- Lượt 78: Saved privacy-safe search views chỉ lưu criteria đã chuẩn hóa.
- Lượt 79: Recovery drill schedule/checklist metadata và reminder candidate cục bộ.
- Lượt 80: Runtime compatibility observation; chưa xóa legacy module khi chưa đủ bằng chứng nhiều flow.

### Changed
- App version `1.1.0`, schema v5, SW cache `growup-mychildren-v11`.
- Rollback về v1.0.0 commit `605c4948cbcc60164d8a34ba220558d39d8eeeb5`.

### Gate
- PR #12 final head `ca3d6579d665ee7f5aef98e8e71b452d0d0915a1`: `verify` PASS và Chromium E2E/Axe PASS.
- Main merge commit `359ea99f041654108c517d5c16be5e819932bb64`: CI hậu merge `verify` + `browser-e2e` đều PASS.
- GitHub Pages vẫn fail riêng ở `Configure Pages` do repository setting, issue #2.

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
- Final candidate head `677ca11e69236624f72538581aeb289867b25d75`: `verify` PASS và Chromium E2E/Axe PASS trước merge PR #11.

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
- Chromium E2E + Axe: **14/14 PASS** trên final code head trước merge PR #10.

### Rollback
- Điểm rollback ổn định trước v0.9: v0.8.0 / commit `241653d6fb12f021ebd20704144e47a5a12cc8fd`.

## [0.8.0] - 2026-09-07
- Lượt 61–65: audit explorer, versioned taxonomy, family planning, encrypted backup và release hardening.
- Unit/static/privacy + Chromium E2E/Axe PASS trước merge.

## [0.7.0]
- Lượt 56–60: consistency scanner, manual retention, neutral year-over-year summary, printable report opt-in Health, privacy/destructive regression và Axe/Chromium gate.

## [0.6.0]
- Lượt 51–55: evidence repair, portable archive manifest SHA-256, timeline period filters, dialog/focus accessibility và Pages post-deploy verification.

## [0.5.0]
- Lượt 46–50: unified development timeline, evidence links, family policy safeguards, safe interoperability exports và Chromium production-readiness gate.
