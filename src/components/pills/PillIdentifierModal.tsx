import React from 'react';

const DeprecatedPillIdentifierModal: React.FC = () => (
  <div style={{ padding: '20px', border: '2px solid red', borderRadius: '8px', backgroundColor: '#fff0f0', margin: '20px' }}>
    <h1 style={{ color: 'red', fontSize: '24px', fontWeight: 'bold' }}>Component Deprecated</h1>
    <p>This component file (<code>components/pills/PillIdentifierModal.tsx</code>) is deprecated and should be deleted.</p>
    <p>The "Pill Identifier" feature has been removed from the application as requested.</p>
    <p>Please remove this file to clean up the project structure. The app will continue to function correctly without it.</p>
  </div>
);

export default DeprecatedPillIdentifierModal;
