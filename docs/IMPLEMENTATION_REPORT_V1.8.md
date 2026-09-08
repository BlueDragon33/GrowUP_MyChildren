# Implementation Report v1.8.0 — Lượt 111–115

## Phạm vi
v1.8 tiếp tục hardening các luồng metadata local-first của GrowUP My Children. Data schema vẫn là v5. Không thêm cloud write, không thêm Google Calendar authorization, không mở rộng Health/Nutrition vào package an toàn, không tin Axe evidence nhập từ file và không có legacy removal tự động.

## Lượt 111 — Receipt import-history portability package
- Export history của managed receipt import dưới package riêng có SHA-256 manifest.
- Package chỉ chứa `at`, `packageFormat` và receipt metadata `at/format/algorithm/valid-invalid`.
- Không xuất internal history id, raw source package, source manifest, expected/actual checksum, child payload hoặc free-text.
- Upload package chỉ verify/review; không apply/import history vào state.

## Lượt 112 — Workload preset import-audit package
- Export audit history thành package SHA-256 read-only.
- Review giữ chiến lược `skip`/`rename`, source ID/name → resolved ID/name và conflict flags.
- Package cố ý bỏ preset `config`, internal signature và raw import package.
- Không có childId, score/rank/performance/health semantics và không apply preset từ audit package.

## Lượt 113 — Managed Saved Search receipt import history + undo
- Saved Search receipt package vẫn phải PASS integrity trước preview/apply.
- Apply đi qua managed history path và ghi bounded delta metadata của đúng receipt thực sự thêm.
- Undo chỉ gỡ đúng delta của lần managed import gần nhất; receipt không thuộc delta được giữ nguyên.
- `#v17SavedReceiptImportForm` được retire khỏi tương tác người dùng bằng `hidden`, `aria-hidden`, `display:none !important`, disabled controls và loại khỏi tab order.
- Export SHA-256 của L108 vẫn hoạt động; chỉ direct apply cũ bị thay thế.

## Lượt 114 — Recovery reconciliation verification-receipt management
- Filter theo valid/invalid và format.
- Export package metadata-only gồm `at/format/algorithm/result/rowCount`.
- Clear bắt buộc explicit confirmation và chỉ xóa receipt đang khớp bộ lọc.
- Không xuất report payload, raw checksum, child name, reminder title hay raw ICS; không apply reminder/calendar.
- Open-ended date normalization coi `null/undefined/empty` là không giới hạn; không được biến thành Unix epoch.

## Lượt 115 — Compatibility evidence freshness policy + review gate
- Policy local-only cấu hình `freshDays`, mặc định 30 và bounded 1–3650 ngày.
- Review chỉ liệt kê module có missing/stale flow và module cần Axe local recheck.
- Gate luôn `retirementAllowed:false` và `actionsApplied:false`; không xóa module, không đổi active state.
- Axe stale/missing phải được tái tạo bằng actual local Axe run; imported Axe evidence vẫn không được tin cậy.

## Release profile
- App: `1.8.0`
- Data schema: `5`
- Service worker cache: `growup-mychildren-v18`
- Rollback: stable v1.7 merge `d59680e4e1bcd122f6adc14ed9a21ede8db26cd7`
- Node: `22.x`
- Playwright: `1.55.0`
- Axe Playwright: `4.10.2`
- Public runtime tiếp tục đúng 1 JavaScript entrypoint + 1 CSS entrypoint; `v18-runtime.js` là dependency nội bộ sau v17 và trước accessibility layer.

## Browser regression
- L111: export SHA-256 + upload verify/review metadata-only.
- L112: export/review conflict audit và kiểm package không chứa config/signature.
- L113: xác minh direct v17 apply bị retire, managed v18 apply/undo hoạt động trên exact delta.
- L114: filter/export/confirmed-clear receipt metadata.
- L115: update freshness policy, review stale module và Axe serious/critical trên overview.

## Stop-on-error đã thực hiện
CI đầu của PR #23 phát hiện L114 double-normalization bug: criteria đã chuẩn hóa với `from/to = null` được chuẩn hóa lần hai; JavaScript `new Date(null)` biến `null` thành Unix epoch 1970 và làm package filter sai. Merge bị khóa. Core được sửa để `null`, `undefined` và chuỗi rỗng luôn giữ nghĩa “không giới hạn ngày”; regression L114 tiếp tục giữ assertion package/filter để tránh tái phát.

## Gate bắt buộc
Final PR head phải cùng một SHA PASS cả:
1. `verify`
2. Chromium E2E + Axe serious/critical

Không hạ Axe rule, không bỏ assertion và không merge dựa trên run của SHA cũ. Sau merge phải kiểm lại cả hai job trên `main`. GitHub Pages vẫn là deployment gate riêng bị chặn bởi L31/issue #2 và không được dùng thay source gate.
