import React from 'react';
import { Link } from 'react-router-dom';

const STUB_CARDS = [
  { title: 'Overdue', hint: 'Missed follow-ups' },
  { title: 'Due today', hint: 'Next actions for today' },
  { title: 'Hot', hint: 'Hot leads needing a move' },
  { title: 'New / unworked', hint: 'New Lead and Attempted' },
];

/**
 * Day 14 home: My Day layout stub.
 * Real API lists land in later calendar days.
 */
const CrmHome: React.FC = () => {
  return (
    <div className="crm-page">
      <div className="crm-hero">
        <div>
          <p className="crm-kicker">My Day</p>
          <h1 className="crm-title">Today’s desk</h1>
          <p className="crm-sub">
            Cream, dark, and gold shell is live. Lead lists and Call / WhatsApp wire in next
            days. No Outpero on this desk.
          </p>
        </div>
        <Link to="/crm/leads" className="crm-btn">
          Open leads
        </Link>
      </div>

      <div className="crm-stats">
        {STUB_CARDS.map((card) => (
          <div key={card.title} className="crm-stat">
            <strong>—</strong>
            <span>{card.title}</span>
            <em>{card.hint}</em>
          </div>
        ))}
      </div>

      <div className="crm-panel">
        <div className="crm-panel__head">Due today · stub</div>
        <div className="crm-panel__empty">
          Follow-ups will load here from the API. Shell first, then wire.
        </div>
      </div>
    </div>
  );
};

export default CrmHome;
