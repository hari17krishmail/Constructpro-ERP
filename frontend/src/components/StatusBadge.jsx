const COLORS = {
  DRAFT: { bg: '#e9ecef', color: '#495057' },
  PENDING_APPROVAL: { bg: '#fff3cd', color: '#856404' },
  APPROVED: { bg: '#d1ecf1', color: '#0c5460' },
  SENT: { bg: '#cce5ff', color: '#004085' },
  PAID: { bg: '#d4edda', color: '#155724' },
  REJECTED: { bg: '#f8d7da', color: '#721c24' },
};

const LABELS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  SENT: 'Sent',
  PAID: 'Paid',
  REJECTED: 'Rejected',
};

const StatusBadge = ({ status }) => {
  const style = COLORS[status] || { bg: '#dee2e6', color: '#333' };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.3,
        whiteSpace: 'nowrap',
      }}
    >
      {LABELS[status] || status}
    </span>
  );
};

export default StatusBadge;
