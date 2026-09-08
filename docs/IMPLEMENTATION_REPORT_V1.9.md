# Implementation Report v1.9.0 — Lượt 116–120

Ngày: 2026-09-08

## Phạm vi

Bản v1.9.0 tiếp tục lớp portability/audit/recovery/compatibility evidence trên schema v5, local-first/offline và không mở thêm cloud write, external calendar write hoặc legacy auto-retirement.

### Lượt 116 — Receipt import-history package verification receipt management

- Thêm `src/core/receipt-import-history-package-verification-receipts.js`.
- Verify package L111 đồng thời ghi receipt xác minh cục bộ tối đa 50 mục.
- Receipt chỉ giữ `at`, `format`, `algorithm`, `valid/invalid`, `importCount`, `receiptCount`.
- Có filter, metadata-only export và confirmed-clear.
- Verify không import/restore source history package vào state.
- Runtime v19 retire form verify L111 cũ để không bypass managed verification receipt history.

### Lượt 117 — Workload preset import-audit review

- Thêm `src/core/workload-preset-import-audit-review.js`.
- Lọc theo strategy `skip/rename`, status và conflict-only.
- Tạo summary trung tính: audit/decision/conflict/resolved/skipped/rejected/accepted/source→resolved changes/added presets.
- Luôn `readOnly:true`, `actionsApplied:false`.
- Không đọc preset config/internal signature và không tạo score/rank/performance/health semantics.

### Lượt 118 — Saved Search receipt import-history portability integrity

- Thêm `src/core/saved-search-receipt-import-history-package-integrity.js`.
- Export package history metadata có SHA-256 manifest và canonical checksum.
- Verify/review chỉ đọc package; không restore/import history và không thực hiện remote undo.
- Undo vẫn giới hạn trong managed state cục bộ của L113.
- Package không chứa criteria/result/snippet, Health/Nutrition, raw checksum, source package hay internal history id.

### Lượt 119 — Recovery verification-receipt package integrity

- Thêm `src/core/recovery-reconciliation-verification-receipt-package-integrity.js`.
- Bọc package receipt L114 bằng SHA-256 manifest.
- Verify cục bộ và lưu verification history tối đa 50 mục: `at/format/algorithm/result/receiptCount`.
- Retire unsigned export L114; filter/clear L114 vẫn giữ hoạt động.
- Không lưu report payload, child name, reminder title, raw ICS/raw checksum và không mutate reminder/calendar.

### Lượt 120 — Compatibility freshness review package + explicit Axe recheck

- Thêm `src/core/compatibility-evidence-freshness-review-package.js`.
- Freshness review được export với SHA-256, luôn `retirementAllowed:false` và `actionsApplied:false`.
- UI chỉ tạo pending Axe recheck request; không có nút người dùng tự đánh dấu PASS.
- `recordActualLocalAxeRecheck()` chỉ chấp nhận `passed:true`, `source:'actual-local-axe'` và pending request tương ứng.
- Browser E2E chỉ ghi PASS sau khi `AxeBuilder` thực sự chạy và không có serious/critical violation.
- Không có automatic legacy removal hoặc active-state mutation.

## Runtime / Release / PWA

- Thêm `src/v19-runtime.js` và nạp từ `src/runtime-entry.js` trước accessibility layer.
- Giữ đúng một public JavaScript entrypoint `src/runtime-entry.js` và một public stylesheet `src/runtime.css`.
- App version: `1.9.0`.
- Data schema: tiếp tục v5, không migration mới.
- Service-worker cache: `growup-mychildren-v19`.
- Rollback pin về stable v1.8 code merge `c0cfca3cdf261b462932a480ef56637efbf0d44e`.
- Branch v1.9 được tạo từ stable main docs head `2ce123c8a923fb7ae318cc67d655b732b2806d78`, run `34217696745` đã PASS `verify` + Chromium/Axe.

## Regression / Gate history

### Candidate đầu

- Head: `b891946117ade3123f609de7d869753d55f2d0f9`.
- `verify`: PASS.
- `browser-e2e`: FAIL.
- Diagnostics cho thấy 2 lỗi đều ở regression v1.8: test L111 còn thao tác form verify cũ và test L114 còn bấm unsigned export cũ, trong khi hai đường này đã được v1.9 retire có chủ đích để bắt buộc L116/L119 managed path.

### Sửa nguyên nhân

- Không mở lại đường cũ.
- `e2e/v18.spec.mjs` được cập nhật để:
  - vẫn test L111 export metadata SHA-256 nhưng xác nhận verify form cũ hidden/disabled;
  - vẫn test L114 filter/confirmed-clear nhưng xác nhận unsigned export cũ hidden/disabled.
- L116 và L119 được test đầy đủ trong `e2e/v19.spec.mjs` cho managed verify/integrity replacement path.
- Một lỗi cú pháp phát sinh trong patch regression được bắt trước final gate và sửa ở head `f193cef00eef3ed2e6072414c5d6da0d8719b879`.
- Không bỏ/hạ Axe rule và không giảm assertion về privacy/integrity/mutation boundaries.

### Candidate code đã PASS

- Exact code head: `f193cef00eef3ed2e6072414c5d6da0d8719b879`.
- CI run: `34219471956`.
- `verify`: PASS.
- `browser-e2e`: PASS.
- Chromium E2E + Axe serious/critical: PASS.
- Playwright diagnostics preservation step: PASS.

## Privacy / Safety invariants

- Không external/cloud write.
- Không Google Calendar authorization hoặc calendar mutation.
- Health/Nutrition không được đưa vào safe metadata package.
- Không raw child payload/free text trong portability/receipt histories.
- Imported Axe evidence không được tin cậy; actual local browser Axe run vẫn bắt buộc.
- Workload review không tạo child score/rank/performance/health semantics.
- Không automatic legacy retirement/removal.

## Trạng thái trước merge

Candidate code đã PASS, nhưng v1.9 chỉ được merge sau khi changelog/roadmap/report hoàn tất và **exact final PR head** PASS lại cả `verify` và Chromium E2E/Axe trên cùng SHA. Sau merge, `main` phải PASS lại cả hai source jobs. GitHub Pages vẫn là blocker riêng L31/issue #2.