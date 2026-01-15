import React from 'react';
import { ConsultationPageShowcase } from './ConsultationPageShowcase';

const NurseSimStatic: React.FC = () => {
  return <ConsultationPageShowcase onBack={() => window.history.back()} />;
};

export default NurseSimStatic;
