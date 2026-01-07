
import React from 'react';
import IssueReporter from '../components/IssueReporter';

const CampusMatrix: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <IssueReporter onActivityLogged={() => {}} />
    </div>
  );
};

export default CampusMatrix;
