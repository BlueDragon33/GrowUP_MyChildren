# GrowUP MyChildren ↔ Application Management

## Ranh giới

GrowUP là client độc lập và local-first. Application Management chỉ quản lý quyền, trạng thái vận hành và các thay đổi mà GrowUP chủ động gửi lên; control-plane **không được trở thành kho dữ liệu trẻ em**.

## Dữ liệu tuyệt đối không đưa vào control-plane

- hồ sơ trẻ;
- nhật ký sức khỏe/dinh dưỡng;
- ghi chú riêng tư dạng free-text;
- portfolio/minh chứng;
- nội dung backup cục bộ;
- dữ liệu dùng để xếp hạng hoặc suy diễn về trẻ.

## Dữ liệu quản trị có thể trao đổi

- mã và loại thiết bị;
- trạng thái truy cập;
- quyền chỉnh sửa;
- phiên bản ứng dụng/trạng thái dịch vụ;
- audit metadata đã lọc;
- cấu hình hoặc bản sửa mà người dùng chủ động gửi lên để duyệt.

## Contract cần có trước khi bật quản trị từ xa

1. Registry thiết bị riêng namespace `GU-...`.
2. P-256 device gate.
3. Phân loại `desktop / tablet / phone`.
4. Access permission và edit permission tách biệt.
5. Admin API app-scoped.
6. Remote audit API chỉ trả metadata allowlist.
7. Configuration review API không chứa child/health records.

Cho tới khi backend trên tồn tại, Application Management chỉ hiển thị readiness và privacy boundary; không dựng thao tác giả.

Nguồn machine-readable: [`../control/application-management.contract.json`](../control/application-management.contract.json).
