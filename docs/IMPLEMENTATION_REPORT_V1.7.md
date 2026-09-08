# Implementation Report v1.7.0 — Lượt 106–110

## Phạm vi
v1.7 tiếp tục hardening luồng import/export metadata local-first của GrowUP My Children. Data schema vẫn là v5; không thêm cloud write, không thêm Google Calendar authorization, không mở rộng Health/Nutrition vào các package an toàn và không thực hiện legacy module removal.

## Lượt 106 — Managed verification receipt import history + undo
- Receipt package SHA-256 vẫn phải qua integrity preview trước khi apply.
- Import mới đi qua managed path và ghi bounded local history của đúng metadata delta đã thực sự thêm.
- History chỉ giữ `at`, `format`, `algorithm`, `checksumResult` và package format; không lưu expected/actual checksum, manifest/payload nguồn hoặc dữ liệu trẻ.
- Undo chỉ gỡ đúng receipt metadata thuộc lần import gần nhất; mục khác không bị chạm tới.
- Runtime khóa apply form v1.6 cũ để không thể bỏ qua history/undo path.

## Lượt 107 — Workload preset import audit + safe undo
- Preset package vẫn phải qua SHA-256 và preview xung đột trước apply.
- Audit ghi chiến lược `skip`/`rename`, source ID/name → resolved ID/name, quyết định conflict và chữ ký của preset trung tính đã thực sự thêm.
- Undo chỉ xóa preset nếu preset hiện tại vẫn đúng chữ ký lúc import; preset người dùng đã sửa sau import được giữ lại.
- Không lưu childId, Health/Nutrition hoặc score/rank/performance semantics.
- Runtime khóa apply form v1.6 cũ để mọi preset import đi qua audit/undo path.

## Lượt 108 — Saved Search receipt package integrity + duplicate-safe import
- Package receipt management được bọc thêm SHA-256 manifest.
- Import bắt buộc integrity PASS trước preview/apply.
- Preview loại receipt sai cấu trúc và receipt trùng; store vẫn bounded tối đa 50 metadata receipt.
- Persist chỉ có `at`, `format`, `algorithm`, valid/invalid; không lưu criteria payload, search result/snippet hoặc Health/Nutrition.

## Lượt 109 — Recovery reconciliation signed report + verification receipt
- Reconciliation report các dòng người dùng chọn được bọc SHA-256 manifest.
- Signed report upload có thể được xác minh cục bộ; receipt chỉ giữ timestamp/format/algorithm/valid-invalid/rowCount.
- Không lưu raw checksum trong verification history, không lưu child name, reminder title, raw ICS hoặc report payload.
- Luồng vẫn report-only: không apply reminder và không ghi external calendar.

## Lượt 110 — Compatibility evidence import audit/undo + freshness
- Compatibility evidence import chỉ ghi audit delta cho non-Axe records.
- Imported Axe evidence vẫn bị từ chối; thiết bị đích phải chạy Axe thật để tái tạo evidence.
- Undo chỉ hoàn tác record vẫn đúng trạng thái sau import; record đã thay đổi sau đó được giữ lại.
- Freshness summary mặc định 30 ngày, hiển thị missing/stale flow và Axe local recheck requirement.
- Freshness chỉ là cảnh báo/evidence quality; không tự kích hoạt retirement và không có legacy deletion path.

## Runtime migration boundary
Ba form apply import v1.6 đã được retire khỏi tương tác người dùng để không thể bypass managed v1.7 path:
- `hidden=true`
- `aria-hidden=true`
- `display:none !important`
- toàn bộ `input/select/textarea/button/fieldset` bị `disabled`
- control bị loại khỏi tab order bằng `tabindex=-1`

E2E v16 xác minh đường cũ thực sự không còn tương tác được; E2E v17 thực hiện import/apply/undo thật trên managed path thay vì chỉ kiểm core bằng unit test.

## Release profile
- App: `1.7.0`
- Data schema: `5`
- Service worker cache: `growup-mychildren-v17`
- Rollback: stable v1.6 main `4e579b512b6fff64161350b7ca5df51b17375f1e`
- Node: `22.x`
- Playwright: `1.55.0`
- Axe Playwright: `4.10.2`
- Public runtime vẫn đúng 1 JavaScript entrypoint + 1 CSS entrypoint; `v17-runtime.js` là dependency nội bộ sau v16 guard và trước accessibility layer.

## Stop-on-error đã thực hiện
CI đầu của PR #22 phát hiện 5 lỗi: ba assertion còn ghim v1.6, một assertion L106 nhầm `checksumResult` với raw checksum và một null-delta bug trong compatibility import history. Merge bị dừng. Null normalization được sửa tại core; release/RC profile và tests được đồng bộ lên v1.7; assertion privacy được đổi sang kiểm đúng các raw field bị cấm thay vì cấm tên metadata `checksumResult` hợp lệ.

Sau khi bổ sung browser coverage v1.7, Chromium gate tiếp tục phát hiện 2 regression v16: form import cũ có thuộc tính `hidden` nhưng CSS `.form` vẫn khiến browser coi chúng là hiển thị. Merge tiếp tục bị khóa. Runtime được sửa tại nguyên nhân bằng retirement mạnh (`display:none !important` + `aria-hidden` + disable controls + loại khỏi tab order), không xóa test và không hạ accessibility gate.

## Gate bắt buộc
Final PR head phải cùng một SHA PASS cả:
1. `verify`
2. Chromium E2E + Axe serious/critical

Không hạ Axe rule, không bỏ assertion và không merge dựa trên run của SHA cũ. Sau merge phải kiểm lại cả hai job trên `main`. GitHub Pages là deployment gate riêng, vẫn phụ thuộc repository setting issue #2 và không được dùng thay source gate.
