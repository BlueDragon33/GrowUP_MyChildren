document.addEventListener('change',(event)=>{
  if(!event.target.closest('#v16RecoveryReportPreviewForm input[name="file"]'))return;
  const rows=document.querySelector('#v16RecoveryReportRows');
  const button=document.querySelector('#v16RecoveryReportExportForm button[type="submit"]');
  const status=document.querySelector('#v16RecoveryReportStatus');
  if(rows)rows.innerHTML='<div class="empty">File đã thay đổi; hãy preview lại trước khi chọn dòng.</div>';
  if(button)button.disabled=true;
  if(status)status.textContent='File đã thay đổi. Preview cũ đã bị vô hiệu hóa; không áp dụng thay đổi lên reminder.';
});
