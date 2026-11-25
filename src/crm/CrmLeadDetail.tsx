import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import {
  CRM_ROLE_LABELS,
  crmHomeRoute,
  isCrmRole,
  stubCrmRoleFromUserType,
  type CrmRole,
} from './crmRoles';

type Temp = 'hot' | 'warm' | 'cold';

type TimelineItem = {
  id: string;
  when: string;
  title: string;
  detail: string;
};

type LeadDetail = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  project: string;
  temperature: Temp;
  stage: string;
  source: string;
  followUp: string;
  followUpDue: boolean;
  ageDays: number;
  owner: string;
  ownerName: string;
  dnd: boolean;
  visitorMessage?: string;
  formAnswers: { label: string; value: string }[];
  timeline: TimelineItem[];
};

/** Layout-only sample leads for Day 19. Live API is Day 24+. */
const SAMPLE_DETAILS: LeadDetail[] = [
  {
    id: 'l1',
    name: 'Ananya Reddy',
    phone: '9876543210',
    email: 'ananya.reddy@example.com',
    project: 'Skyline Residences',
    temperature: 'hot',
    stage: 'Site Visit Done',
    source: 'Meta',
    followUp: 'Today 4:00 pm',
    followUpDue: true,
    ageDays: 6,
    owner: 'me',
    ownerName: 'You',
    dnd: false,
    visitorMessage: 'Looking for a 3 BHK facing the park. Budget around 1.8 Cr. Prefer evening site visit.',
    formAnswers: [
      { label: 'Budget', value: '₹1.5 Cr – ₹2 Cr' },
      { label: 'Configuration', value: '3 BHK' },
      { label: 'Possession', value: 'Ready to move' },
      { label: 'City', value: 'Hyderabad' },
    ],
    timeline: [
      { id: 't1', when: 'Today 10:12 am', title: 'Follow-up due', detail: 'Call · send cost sheet' },
      { id: 't2', when: 'Yesterday 5:40 pm', title: 'Site visit done', detail: 'Liked unit 1204. Asked for payment plan.' },
      { id: 't3', when: 'Mon 11:20 am', title: 'WhatsApp sent', detail: 'Shared brochure and location pin.' },
      { id: 't4', when: 'Sat 3:05 pm', title: 'New lead', detail: 'Came in from Meta Instant Form.' },
    ],
  },
  {
    id: 'l2',
    name: 'Vikram Shah',
    phone: '9876501234',
    email: 'vikram.shah@example.com',
    project: 'Lakeview Towers',
    temperature: 'warm',
    stage: 'Proposal Sent',
    source: 'Website',
    followUp: 'Yesterday 11:00 am',
    followUpDue: true,
    ageDays: 14,
    owner: 'me',
    ownerName: 'You',
    dnd: false,
    visitorMessage: 'Need proposal for 2 BHK. Comparing with another project in Gachibowli.',
    formAnswers: [
      { label: 'Budget', value: '₹90 L – ₹1.2 Cr' },
      { label: 'Configuration', value: '2 BHK' },
      { label: 'Timeline', value: '3 months' },
    ],
    timeline: [
      { id: 't1', when: 'Yesterday 11:00 am', title: 'Follow-up missed', detail: 'No answer on call.' },
      { id: 't2', when: 'Fri 4:15 pm', title: 'Proposal sent', detail: 'Emailed payment plan PDF.' },
      { id: 't3', when: 'Wed 9:40 am', title: 'Connected', detail: 'Discussed carpet area and parking.' },
    ],
  },
  {
    id: 'l3',
    name: 'Meera Iyer',
    phone: '9988776655',
    project: 'Skyline Residences',
    temperature: 'warm',
    stage: 'Qualified',
    source: 'Referral',
    followUp: 'Tomorrow 2:30 pm',
    followUpDue: false,
    ageDays: 4,
    owner: 'me',
    ownerName: 'You',
    dnd: false,
    visitorMessage: 'Referred by Mr Rao. Wants weekend visit with family.',
    formAnswers: [
      { label: 'Budget', value: '₹2 Cr+' },
      { label: 'Configuration', value: '3 BHK' },
      { label: 'Referral', value: 'Mr Rao · Skyline buyer' },
    ],
    timeline: [
      { id: 't1', when: 'Today 9:00 am', title: 'Visit planned', detail: 'Saturday 11:00 am with family.' },
      { id: 't2', when: 'Mon 6:20 pm', title: 'Qualified', detail: 'Budget and timeline confirmed.' },
    ],
  },
  {
    id: 'l4',
    name: 'Rohit Nair',
    phone: '9123456780',
    project: 'Parkside Avenue',
    temperature: 'cold',
    stage: 'New Lead',
    source: 'Google',
    followUp: 'Not set',
    followUpDue: false,
    ageDays: 1,
    owner: 'me',
    ownerName: 'You',
    dnd: true,
    visitorMessage: 'Do not call after 8 pm. Prefer WhatsApp only for now.',
    formAnswers: [
      { label: 'Budget', value: 'Exploring' },
      { label: 'Configuration', value: '2 BHK' },
    ],
    timeline: [
      { id: 't1', when: 'Today 8:10 am', title: 'New lead', detail: 'Google form. DND flagged on create.' },
    ],
  },
  {
    id: 'l5',
    name: 'Sana Khan',
    phone: '9012345678',
    project: 'Lakeview Towers',
    temperature: 'hot',
    stage: 'Negotiation',
    source: 'WhatsApp',
    followUp: 'Today 6:00 pm',
    followUpDue: true,
    ageDays: 21,
    owner: 'me',
    ownerName: 'You',
    dnd: false,
    visitorMessage: 'Ready to book if floor rise is waived.',
    formAnswers: [
      { label: 'Budget', value: '₹1.4 Cr' },
      { label: 'Unit interest', value: 'Tower B · 8th floor' },
    ],
    timeline: [
      { id: 't1', when: 'Today 1:00 pm', title: 'Negotiation', detail: 'Asked for floor rise waiver.' },
      { id: 't2', when: 'Sun 12:30 pm', title: 'Site visit done', detail: 'Chose Tower B view unit.' },
    ],
  },
  {
    id: 'l6',
    name: 'Arjun Patel',
    phone: '9090909090',
    project: 'Parkside Avenue',
    temperature: 'warm',
    stage: 'Attempted',
    source: 'Manual',
    followUp: 'Fri 10:00 am',
    followUpDue: false,
    ageDays: 3,
    owner: 'me',
    ownerName: 'You',
    dnd: false,
    visitorMessage: 'Walk-in enquiry at desk. Left visiting card.',
    formAnswers: [
      { label: 'Budget', value: '₹1 Cr' },
      { label: 'Configuration', value: '2.5 BHK' },
    ],
    timeline: [
      { id: 't1', when: 'Yesterday 7:05 pm', title: 'Attempted', detail: 'Ringing, no answer.' },
      { id: 't2', when: 'Mon 2:00 pm', title: 'New lead', detail: 'Hand-created from walk-in.' },
    ],
  },
  {
    id: 'l7',
    name: 'Divya Rao',
    phone: '9887766554',
    project: 'Orchid Heights',
    temperature: 'cold',
    stage: 'Connected',
    source: 'Channel partner',
    followUp: 'Mon 12:00 pm',
    followUpDue: false,
    ageDays: 9,
    owner: 'peer',
    ownerName: 'Priya Sales',
    dnd: false,
    visitorMessage: 'Partner lead. Soft interest only.',
    formAnswers: [{ label: 'Partner', value: 'Horizon Realty' }],
    timeline: [
      { id: 't1', when: 'Tue 3:40 pm', title: 'Connected', detail: 'Asked for brochure only.' },
    ],
  },
  {
    id: 'l8',
    name: 'Karthik Menon',
    phone: '9776655443',
    project: 'Skyline Residences',
    temperature: 'hot',
    stage: 'Site Visit Planned',
    source: 'Website',
    followUp: 'Sat 11:00 am',
    followUpDue: false,
    ageDays: 5,
    owner: 'peer',
    ownerName: 'Amit Sales',
    dnd: false,
    visitorMessage: 'Wants Saturday morning slot.',
    formAnswers: [
      { label: 'Budget', value: '₹1.7 Cr' },
      { label: 'Configuration', value: '3 BHK' },
    ],
    timeline: [
      { id: 't1', when: 'Thu 5:10 pm', title: 'Site visit planned', detail: 'Saturday 11:00 am.' },
    ],
  },
];

const OUTCOMES = [
  'Connected',
  'No answer',
  'Busy',
  'Wrong number',
  'Callback later',
  'Not interested',
] as const;

function currentCrmRole(): CrmRole {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

function telLink(phone: string) {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `tel:+91${digits}`;
}

function ageLabel(days: number) {
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function TempPill({ temperature }: { temperature: Temp }) {
  return <span className={`crm-temp crm-temp--${temperature}`}>{temperature}</span>;
}

/**
 * Day 19: Lead detail layout with Call (tel:) and WhatsApp.
 * DND blocks Call. No Outpero. Outcome log is a local stub until APIs wire.
 */
const CrmLeadDetail: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const crmRole = currentCrmRole();
  const home = crmHomeRoute(crmRole);
  const homeLabel = home.includes('dashboard') ? 'Dashboard' : 'My Day';
  const ownOnly = crmRole === 'salesperson';

  const lead = useMemo(
    () => SAMPLE_DETAILS.find((row) => row.id === leadId) || null,
    [leadId],
  );

  const blockedPeer = Boolean(lead && ownOnly && lead.owner !== 'me');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);
  const [outcomeSaved, setOutcomeSaved] = useState(false);

  if (!lead) {
    return (
      <div className="crm-page">
        <nav className="crm-crumbs" aria-label="Breadcrumb">
          <Link to={home}>{homeLabel}</Link>
          <span className="crm-crumbs__sep" aria-hidden="true">/</span>
          <Link to="/crm/leads">Leads</Link>
          <span className="crm-crumbs__sep" aria-hidden="true">/</span>
          <span className="crm-crumbs__current">Not found</span>
        </nav>
        <div className="crm-hero">
          <div>
            <h1 className="crm-title">Lead not found</h1>
            <p className="crm-sub">This sample id is not on the Day 19 list. Open a lead from the list or My Day.</p>
          </div>
          <Link to="/crm/leads" className="crm-btn crm-btn--ghost">
            Back to leads
          </Link>
        </div>
      </div>
    );
  }

  if (blockedPeer) {
    return (
      <div className="crm-page">
        <nav className="crm-crumbs" aria-label="Breadcrumb">
          <Link to={home}>{homeLabel}</Link>
          <span className="crm-crumbs__sep" aria-hidden="true">/</span>
          <Link to="/crm/leads">Leads</Link>
          <span className="crm-crumbs__sep" aria-hidden="true">/</span>
          <span className="crm-crumbs__current">Blocked</span>
        </nav>
        <div className="crm-hero">
          <div>
            <p className="crm-kicker">Role wall · {CRM_ROLE_LABELS[crmRole]}</p>
            <h1 className="crm-title">You cannot open this lead</h1>
            <p className="crm-sub">
              Salespeople only see their own leads. Pasting another person’s lead id stays blocked (API will enforce this on Day 24+).
            </p>
          </div>
          <Link to="/crm/leads" className="crm-btn">
            Back to my leads
          </Link>
        </div>
        <p className="crm-banner crm-banner--warn" role="alert">
          Sample peer lead hidden. Owner on file: {lead.ownerName}.
        </p>
      </div>
    );
  }

  const saveOutcome = (outcome: string) => {
    setLastOutcome(outcome);
    setOutcomeSaved(true);
  };

  return (
    <div className="crm-page crm-page--wide">
      <nav className="crm-crumbs" aria-label="Breadcrumb">
        <Link to={home}>{homeLabel}</Link>
        <span className="crm-crumbs__sep" aria-hidden="true">/</span>
        <Link to="/crm/leads">Leads</Link>
        <span className="crm-crumbs__sep" aria-hidden="true">/</span>
        <span className="crm-crumbs__current">{lead.name}</span>
      </nav>

      <div className="crm-hero crm-lead-hero">
        <div className="crm-lead-hero__main">
          <Link to="/crm/leads" className="crm-lead-back">
            <ArrowBackRoundedIcon fontSize="small" aria-hidden="true" />
            All leads
          </Link>
          <p className="crm-kicker">Lead · {CRM_ROLE_LABELS[crmRole]}</p>
          <h1 className="crm-title">{lead.name}</h1>
          <p className="crm-sub crm-lead-hero__meta">
            <a href={telLink(lead.phone)}>{lead.phone}</a>
            {lead.email ? (
              <>
                <span aria-hidden="true"> · </span>
                <a href={`mailto:${lead.email}`}>{lead.email}</a>
              </>
            ) : null}
            <span aria-hidden="true"> · </span>
            {lead.project}
          </p>
          <div className="crm-lead-chips">
            <TempPill temperature={lead.temperature} />
            <span className="crm-chip">{lead.stage}</span>
            <span className="crm-chip">{lead.source}</span>
            <span className="crm-chip">Owner · {lead.ownerName}</span>
            <span className={`crm-chip${lead.followUpDue ? ' crm-chip--due' : ''}`}>
              Follow-up · {lead.followUp}
            </span>
            <span className="crm-chip">Age · {ageLabel(lead.ageDays)}</span>
            {lead.dnd ? <span className="crm-chip crm-chip--dnd">Do not call</span> : null}
          </div>
        </div>

        <div className="crm-hero__actions crm-lead-actions">
          {lead.dnd ? (
            <button
              type="button"
              className="crm-btn crm-btn--ghost"
              disabled
              title="Do-not-call is set on this lead"
            >
              <BlockRoundedIcon fontSize="small" aria-hidden="true" />
              Call blocked
            </button>
          ) : (
            <a className="crm-btn" href={telLink(lead.phone)}>
              <CallRoundedIcon fontSize="small" aria-hidden="true" />
              Call
            </a>
          )}
          <a
            className="crm-btn crm-btn--soft"
            href={waLink(lead.phone)}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon fontSize="small" aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      </div>

      <p className="crm-banner" role="note">
        Day 19 layout sample. Call uses your phone dialer. No Outpero on this desk. Knowlarity bridge is Days 68–75.
        Outcome save is local only until APIs wire.
      </p>

      {lead.dnd ? (
        <p className="crm-banner crm-banner--warn" role="status">
          Do-not-call is on. Call stays blocked. WhatsApp is still available if the lead asked for messages only.
        </p>
      ) : null}

      <div className="crm-lead-grid">
        <div className="crm-lead-col">
          <section className="crm-panel">
            <div className="crm-panel__head">Visitor message</div>
            <p className="crm-lead-copy">
              {lead.visitorMessage || 'No message on this sample lead.'}
            </p>
          </section>

          <section className="crm-panel">
            <div className="crm-panel__head">Form answers</div>
            <dl className="crm-lead-facts">
              {lead.formAnswers.map((row) => (
                <div key={row.label} className="crm-lead-facts__row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="crm-panel">
            <div className="crm-panel__head">CRM fields (read layout)</div>
            <dl className="crm-lead-facts">
              <div className="crm-lead-facts__row">
                <dt>Stage</dt>
                <dd>{lead.stage}</dd>
              </div>
              <div className="crm-lead-facts__row">
                <dt>Temperature</dt>
                <dd>
                  <TempPill temperature={lead.temperature} />
                </dd>
              </div>
              <div className="crm-lead-facts__row">
                <dt>Project</dt>
                <dd>{lead.project}</dd>
              </div>
              <div className="crm-lead-facts__row">
                <dt>Next follow-up</dt>
                <dd className={lead.followUpDue ? 'crm-leads__due is-due' : undefined}>{lead.followUp}</dd>
              </div>
            </dl>
            <p className="crm-lead-hint">Save CRM fields wires with APIs later. Layout only for now.</p>
          </section>
        </div>

        <div className="crm-lead-col">
          <section className="crm-panel">
            <div className="crm-panel__head">Call outcome</div>
            <p className="crm-lead-copy">
              After you finish the phone call, tap what happened. This is a stub save for Day 19.
            </p>
            <div className="crm-outcome-grid" role="group" aria-label="Call outcome">
              {OUTCOMES.map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  className={`crm-btn crm-btn--ghost crm-outcome-btn${lastOutcome === outcome ? ' is-on' : ''}`}
                  onClick={() => saveOutcome(outcome)}
                  disabled={lead.dnd && outcome !== 'Callback later'}
                >
                  {outcome}
                </button>
              ))}
            </div>
            <label className="crm-lead-note">
              <span>Note (optional)</span>
              <textarea
                rows={3}
                value={outcomeNote}
                onChange={(e) => setOutcomeNote(e.target.value)}
                placeholder="Short note for the timeline"
              />
            </label>
            {outcomeSaved ? (
              <p className="crm-lead-saved" role="status">
                Saved locally: {lastOutcome}
                {outcomeNote.trim() ? ` · ${outcomeNote.trim()}` : ''}. API save comes later.
              </p>
            ) : null}
          </section>

          <section className="crm-panel">
            <div className="crm-panel__head crm-panel__head--split">
              <span>Timeline</span>
              <span className="crm-panel__count">{lead.timeline.length} sample</span>
            </div>
            <ol className="crm-timeline">
              {lead.timeline.map((item) => (
                <li key={item.id} className="crm-timeline__item">
                  <p className="crm-timeline__when">{item.when}</p>
                  <p className="crm-timeline__title">{item.title}</p>
                  <p className="crm-timeline__detail">{item.detail}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CrmLeadDetail;
