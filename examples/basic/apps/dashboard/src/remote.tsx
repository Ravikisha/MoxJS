import React from 'react';

export default function RemoteApp() {
  return (
    <div
      data-testid="remote-loaded"
      style={{ padding: 16, border: '2px solid #6366f1', borderRadius: 8 }}
    >
      <h3 style={{ marginTop: 0, color: '#4f46e5' }}>📦 Dashboard (remote)</h3>
      <p>This component is loaded via Module Federation from the <strong>dashboard</strong> app.</p>
      <p>Development in progress.....</p>
    </div>
  );
}
