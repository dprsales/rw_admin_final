/**
 * Day 20 sample Team + Projects data.
 * Shared by list cards, detail stubs, and Dashboard links. Live APIs later.
 */

import type { CrmRole } from './crmRoles';

export type SamplePerson = {
  id: string;
  name: string;
  role: CrmRole;
  roleLabel: string;
  mobile: string;
  projects: string[];
  overdue: number;
  openLeads: number;
  hot: number;
  weekLog: { day: string; summary: string }[];
};

export type SampleProject = {
  id: string;
  name: string;
  open: number;
  hot: number;
  overdue: number;
  unassigned: number;
  health: number;
  next: string;
  people: string[];
  stages: { label: string; count: number }[];
  recent: string[];
};

export const SAMPLE_PEOPLE: SamplePerson[] = [
  {
    id: 'priya',
    name: 'Priya',
    role: 'salesperson',
    roleLabel: 'Salesperson',
    mobile: '9876500001',
    projects: ['skyline', 'parkside'],
    overdue: 2,
    openLeads: 18,
    hot: 4,
    weekLog: [
      { day: 'Mon', summary: '22 dials · 9 connects · 1 visit booked' },
      { day: 'Tue', summary: '18 dials · 7 connects · cost sheet sent ×2' },
      { day: 'Wed', summary: '14 dials · 6 connects · Skyline follow-ups' },
      { day: 'Thu', summary: '20 dials · 11 connects · visit done' },
      { day: 'Fri', summary: 'Sample today · 8 dials so far' },
    ],
  },
  {
    id: 'arjun',
    name: 'Arjun',
    role: 'salesperson',
    roleLabel: 'Salesperson',
    mobile: '9876500002',
    projects: ['lakeview', 'skyline'],
    overdue: 5,
    openLeads: 16,
    hot: 3,
    weekLog: [
      { day: 'Mon', summary: '16 dials · 5 connects · overdue stack' },
      { day: 'Tue', summary: '19 dials · 8 connects · Lakeview chase' },
      { day: 'Wed', summary: '12 dials · 4 connects · hot idle 36h' },
      { day: 'Thu', summary: '21 dials · 9 connects' },
      { day: 'Fri', summary: 'Sample today · clearing overdue' },
    ],
  },
  {
    id: 'neha',
    name: 'Neha',
    role: 'salesperson',
    roleLabel: 'Salesperson',
    mobile: '9876500003',
    projects: ['skyline', 'orchid'],
    overdue: 1,
    openLeads: 15,
    hot: 5,
    weekLog: [
      { day: 'Mon', summary: '24 dials · 12 connects' },
      { day: 'Tue', summary: 'Site visit done · Ananya Reddy' },
      { day: 'Wed', summary: 'Brochure sends ×4' },
      { day: 'Thu', summary: 'Strong connects day' },
      { day: 'Fri', summary: 'Sample today · proposal follow-ups' },
    ],
  },
  {
    id: 'karan',
    name: 'Karan',
    role: 'salesperson',
    roleLabel: 'Salesperson',
    mobile: '9876500004',
    projects: ['skyline', 'orchid'],
    overdue: 7,
    openLeads: 14,
    hot: 2,
    weekLog: [
      { day: 'Mon', summary: '10 dials · 3 connects · 7 overdue' },
      { day: 'Tue', summary: 'Attempted batch · Orchid' },
      { day: 'Wed', summary: 'Manager nudge on overdue' },
      { day: 'Thu', summary: '14 dials · 5 connects' },
      { day: 'Fri', summary: 'Sample today · catch-up block' },
    ],
  },
  {
    id: 'meera',
    name: 'Meera',
    role: 'salesperson',
    roleLabel: 'Salesperson',
    mobile: '9876500005',
    projects: ['orchid', 'parkside'],
    overdue: 4,
    openLeads: 12,
    hot: 2,
    weekLog: [
      { day: 'Mon', summary: 'New leads unworked · 6 waiting' },
      { day: 'Tue', summary: 'Started Orchid dials' },
      { day: 'Wed', summary: '11 dials · 4 connects' },
      { day: 'Thu', summary: 'Parkside fresh dials' },
      { day: 'Fri', summary: 'Sample today · clearing new pile' },
    ],
  },
];

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'skyline',
    name: 'Skyline Residences',
    open: 48,
    hot: 9,
    overdue: 6,
    unassigned: 5,
    health: 72,
    next: 'Cost sheet chase · 2 today',
    people: ['priya', 'arjun', 'neha', 'karan'],
    stages: [
      { label: 'New Lead', count: 14 },
      { label: 'Connected', count: 11 },
      { label: 'Site Visit', count: 8 },
      { label: 'Negotiation', count: 5 },
      { label: 'Booked', count: 3 },
    ],
    recent: [
      'Neha · Site Visit Done · Ananya Reddy',
      'Priya · cost sheet sent ×2',
      'Karan · 2 leads → Attempted',
      '12 new Meta leads landed',
    ],
  },
  {
    id: 'lakeview',
    name: 'Lakeview Towers',
    open: 41,
    hot: 7,
    overdue: 4,
    unassigned: 3,
    health: 64,
    next: 'Site visit confirm · 3',
    people: ['arjun'],
    stages: [
      { label: 'New Lead', count: 10 },
      { label: 'Connected', count: 12 },
      { label: 'Site Visit', count: 7 },
      { label: 'Negotiation', count: 4 },
      { label: 'Booked', count: 2 },
    ],
    recent: [
      'Arjun · Connected · Vikram Shah',
      'Hot lead idle 36h · Sana Khan',
      'Visit confirm pending ×3',
    ],
  },
  {
    id: 'parkside',
    name: 'Parkside Avenue',
    open: 36,
    hot: 5,
    overdue: 8,
    unassigned: 11,
    health: 48,
    next: 'Fresh dials · 11 new',
    people: ['priya', 'meera'],
    stages: [
      { label: 'New Lead', count: 16 },
      { label: 'Connected', count: 8 },
      { label: 'Site Visit', count: 5 },
      { label: 'Negotiation', count: 3 },
      { label: 'Booked', count: 1 },
    ],
    recent: [
      'Visit no-shows rising · 3 this week',
      'Priya · visit booked tomorrow 11:00',
      'Meera · fresh dials started',
    ],
  },
  {
    id: 'orchid',
    name: 'Orchid Heights',
    open: 29,
    hot: 4,
    overdue: 3,
    unassigned: 4,
    health: 58,
    next: 'Proposal follow-ups',
    people: ['neha', 'karan', 'meera'],
    stages: [
      { label: 'New Lead', count: 9 },
      { label: 'Connected', count: 7 },
      { label: 'Site Visit', count: 4 },
      { label: 'Negotiation', count: 3 },
      { label: 'Booked', count: 1 },
    ],
    recent: [
      'Karan · Attempted batch',
      'Neha · proposal follow-ups',
      'Meera · clearing new pile',
    ],
  },
];

export function samplePerson(id?: string) {
  return SAMPLE_PEOPLE.find((p) => p.id === id);
}

export function sampleProject(id?: string) {
  return SAMPLE_PROJECTS.find((p) => p.id === id);
}

export function projectName(id: string) {
  return sampleProject(id)?.name || id;
}

export function personName(id: string) {
  return samplePerson(id)?.name || id;
}
