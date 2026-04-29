import React from 'react';
import PreferencesFlow from './PreferencesFlow';

interface PreferencesScreenProps {
  onClose: () => void;
}

const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ onClose }) => {
  return (
    <PreferencesFlow onClose={onClose} />
  );
};

export default PreferencesScreen;
