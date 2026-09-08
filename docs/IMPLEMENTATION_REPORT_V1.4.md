# Báo cáo triển khai v1.4.0 — Lượt 91–95

## Mục tiêu
v1.4 tiếp tục hardening các workflow cục bộ của GrowUP My Children mà không mở rộng data schema, không thêm cloud write và không đưa dữ liệu trẻ sang dịch vụ ngoài. Data schema giữ nguyên **v5**; rollback ổn định được khóa về v1.3 main `51e4a80609d40915106663e983dbfa1202fee228`.

## Lượt 91 — Safe-export verification receipt history
- Module: `src/core/export-verification-history.js`.
- Tối đa 50 receipt trong `settings.safeExportVerificationReceipts`.
- Mỗi receipt chỉ có `at`, `format`, `algorithm`, `checksumResult` (`valid`/`invalid`).
- Không lưu expected/actual/raw checksum, file name, file JSON, preview, child payload hoặc free-text.
- Runtime v14 móc vào form xác minh checksum v13 chỉ sau thao tác submit rõ ràng của người dùng.

## Lượt 92 — Workload display presets
- Module: `src/core/workload-presets.js`.
- Ba preset trung tính: Gọn, Tiêu chuẩn, Mở rộng; hỗ trợ reset về mặc định.
- Chỉ thay đổi `settings.workloadDisplayBands`, local-only và hoàn tác được.
- Không gắn preset với childId, sức khỏe, thành tích, score/rank/rating/percentile.

## Lượt 93 — Portable Saved Search criteria package
- Module: `src/core/saved-search-package.js`.
- Format: `growup-saved-search-criteria-v1`, version 1.
- Export chỉ qua `normalizeSavedSearch`; field ngoài criteria/metadata tổ chức bị loại.
- Import bắt buộc preview trước apply; dataset ngoài `SAFE_SEARCH_DATASETS` bị loại và criteria trùng bị bỏ qua.
- Không lưu/khôi phục result, snippet, Health/Nutrition payload.

## Lượt 94 — Recovery calendar bridge
- Module: `src/core/recovery-calendar-bridge.js`.
- Chỉ reminder `source=recovery-drill` + `type=recovery` được đưa vào danh sách candidate.
- Chỉ reminder được người dùng tích chọn mới được tạo thành `.ics`.
- File giữ lineage tối thiểu bằng `X-GROWUP-SOURCE`, `X-GROWUP-ORIGIN-DATE`, `X-GROWUP-COMPLETED`.
- Không đưa tên trẻ, passphrase hoặc backup payload vào file; không đăng nhập/ghi Google Calendar, không background write, không auto restore.

## Lượt 95 — Legacy retirement dry-run
- Module: `src/core/retirement-dry-run.js`.
- Kế thừa review L90: evidence matrix + static runtime dependency graph.
- Gói dry-run chỉ chứa module/evidence/dependency/decision/proposed-diff metadata.
- Luôn `removalsApplied:false`, `safeToRemoveAutomatically:false`, `requiresSeparateRemovalCommit:true`.
- Bất kỳ actual removal nào đều phải là commit riêng và PASS `verify` + Chromium E2E + Axe trên exact removal head.

## Runtime/PWA
- `src/v14-runtime.js` thêm 5 panel Overview tương ứng L91–95.
- `src/v14.css` responsive 2 cột → 1 cột; không tạo entrypoint HTML mới.
- `src/runtime-entry.js` vẫn là JavaScript entrypoint công khai duy nhất; v14 được import sau v13 và trước accessibility layer.
- `src/runtime.css` vẫn là CSS entrypoint công khai duy nhất.
- Service worker cache: `growup-mychildren-v14`; không gọi `skipWaiting()` trong install, chỉ áp dụng update khi nhận `SKIP_WAITING` rõ ràng.

## Test/regression
### Unit/static
- `tests/v14-core.test.mjs`: receipt metadata-only/bounded; preset neutral/reset; Saved Search package privacy + duplicate-safe import; explicit recovery `.ics`; dry-run no removal.
- Release/static tests được nâng lên app 1.4.0, cache v14, rollback v1.3 nhưng giữ nguyên encryption/privacy/PWA/destructive gates cũ.

### Browser/Axe
- `e2e/v14.spec.mjs`: kiểm receipt qua form v13; preset apply/reset; export/import Saved Search package; `.ics` explicit selection; dry-run download; mobile overflow + Axe serious/critical.
- `e2e/audit.spec.mjs` chờ đủ panel v8–v14 trước khi chạy Axe để không PASS sớm khi UI mới chưa render.
- Không skip Axe rule và không hạ blocking severity.

## Release profile
- App: `1.4.0`
- Schema: `5`
- SW cache: `growup-mychildren-v14`
- Node: `22.x`
- Playwright: `1.55.0`
- Axe Playwright: `4.10.2`
- Rollback: v1.3 / `51e4a80609d40915106663e983dbfa1202fee228`

## Merge gate
Không merge v1.4 vào `main` cho đến khi **cùng exact final PR head** PASS cả:
1. `verify` — syntax/static/unit/privacy regression.
2. Chromium `browser-e2e` + Axe serious/critical.

Nếu một gate fail, sửa nguyên nhân thật trên cùng nhánh và chạy lại; không vô hiệu hóa assertion/Axe để lấy PASS.

## GitHub Pages
Pages vẫn là blocker repository setting riêng (issue #2). Workflow deploy có post-deploy verification nhưng `Configure Pages` sẽ tiếp tục fail cho đến khi repository bật **Settings → Pages → Source → GitHub Actions**. Trạng thái Pages không được dùng thay thế source CI gate.
