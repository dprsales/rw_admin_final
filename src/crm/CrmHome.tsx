import React from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  CRM_ROLE_LABELS,
  crmHomeBlurb,
  isCrmRole,
  stubCrmRoleFromUserType,
} from './crmRoles';

const STUB_CARDS = [
  { title: 'Overdue', hint: 'Missed follow-ups' },
  { title: 'Due today', hint: 'Next actions for today' },
  { title: 'Hot', hint: 'Hot leads needing a move' },
  { title: 'New / unworked', hint: 'New Lead and Attempted' },
];

function currentCrmRole() {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

/**
 * Day 14–15 home: My Day layout stub, role-aware copy.
 */
const CrmHome: React.FC = () => {
  const crmRole = currentCrmRole();
  const name = (Cookies.get('user_name') || 'Team').trim();

  return (
    <div className="crm-page">
      <nav className="crm-crumbs" aria-label="Breadcrumb">
        <span>Sales CRM</span>
        <span className="crm-crumbs__sep" aria-hidden="true">/</span>
        <span className="crm-crumbs__current">My Day</span>
      </nav>

      <div className="crm-hero">
        <div>
          <p className="crm-kicker">My Day · {CRM_ROLE_LABELS[crmRole]}</p>
          <h1 className="crm-title">Today’s desk</h1>
          <p className="crm-sub">
            Hi {name}. {crmHomeBlurb(crmRole)}
          </p>
        </div>
        <Link to="/crm/leads" className="crm-btn">
          Open leads
        </Link>
      </div>

      {crmRole === 'sales_manager' ? (
        <div className="crm-panel" style={{ marginBottom: 16 }}>
          <div className="crm-panel__head">Manager strip · stub</div>
          <div className="crm-panel__empty">
            Your people’s overdue and fresh queue counts land here. Open{' '}
            <Link to="/crm/team">Team</Link> for the line.
          </div>
        </div>
      ) : null}

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
