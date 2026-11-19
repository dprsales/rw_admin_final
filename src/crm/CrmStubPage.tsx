import React from 'react';

type Props = {
  title: string;
  blurb: string;
};

/** Placeholder screens so the Day 14 nav walks without ops admin pages. */
const CrmStubPage: React.FC<Props> = ({ title, blurb }) => {
  return (
    <div className="crm-page crm-page--narrow">
      <p className="crm-kicker">Sales CRM</p>
      <h1 className="crm-title">{title}</h1>
      <p className="crm-sub">{blurb}</p>
      <div className="crm-stub-box">Screen stub · filled in later calendar days</div>
    </div>
  );
};

export default CrmStubPage;
