const ConfirmModal = ({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Yes, Delete',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) => (
  <div className="modal-backdrop" onClick={onCancel}>
    <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
      <h3 style={{ margin: '0 0 10px' }}>{title}</h3>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)' }}>{message}</p>
      <div className="form-actions">
        <button
          className={`btn btn-${confirmVariant}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
        <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          No
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
