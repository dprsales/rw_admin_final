import axios from "axios";
import { http } from "../http";

// Auth
export const authLogin = (data: any) => {
  return http.post("/auth/login", data);
};



// export const getProjects = () => {
//   return http.get("/projects");
// }

// api/services.ts

export const getProjects = async (page = 1, search = '', limit = 100) => {
  const response = await http.get("/projects", {
    params: { page, limit, search },
  });
  return response.data; // ✅ Only return the actual data payload
};


export const getProjectDetails = (slug: string) => {
  return http.get(`/projects/${slug}`);
};

export const addProject = (data: any) => {
  return http.post("/projects", data);
};


//update hero section

export const updateProjectSection = (slug: string, section: string, data: any) => {
  return http.put(`/projects/${slug}/${section}`, data);
};



// herosection
export const heroSection = (slug: string, heroSection: any) => {
  return http.post(`/projects/${slug}/herosection`, heroSection);
};



//about section

export const aboutSection = (slug: string, aboutsection: any) => {
  return http.post(`/projects/${slug}/aboutsection`, aboutsection);
}; 

//gallery
export const gallerySection  = (slug: string, gallerysections: any) => {
  return http.post(`/projects/${slug}/gallerysection`, gallerysections);
}; 

//layout
export const layoutSection   = (slug: string, layoutsections: any) => {
  return http.post(`/projects/${slug}/layoutsection`, layoutsections);
}; 
//floorplans
export const floorPlans   = (slug: string, floorplan: any) => {
  return http.post(`/projects/${slug}/floorplans`, floorplan);
}; 
//amenities
export const amenity   = (slug: string, amenity: any) => {
  return http.post(`/projects/${slug}/amenities`, amenity);
};

//connected living
export const getConnectedLiving   = (slug: string, connectedlivings: any) => {
  return http.post(`/projects/${slug}/connectedliving`, connectedlivings);
};





// Leads
// export const getLeads = () => {
//   return http.get("/leads");
// };

export type GetLeadsParams = {
  page?: number;
  limit?: number;
  ownerId?: string;
  projectId?: string;
  stage?: string;
  phone?: string;
};

/**
 * Day 11 — paged list; optional owner / project / stage / phone filters.
 * Pass ownerId `unassigned` for the open pool (managers).
 */
export const getLeads = async (params: GetLeadsParams = {}) => {
  const response = await http.get('/leads', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      ...(params.ownerId ? { ownerId: params.ownerId } : {}),
      ...(params.projectId ? { projectId: params.projectId } : {}),
      ...(params.stage ? { stage: params.stage } : {}),
      ...(params.phone ? { phone: params.phone } : {}),
    },
  });
  return response.data; // { totalCount, page, limit, totalPages, leads }
};

export const getLeadDetails = (leadId: string) => {
  return http.get(`/leads/${leadId}`);
};

export const addLead = (data: any) => {
  return http.post("/leads", data);
};

/** Interim desk hand-create (auth). Prefer this over public addLead. */
export type StaffLeadPayload = {
  name: string;
  email: string;
  phoneNumber: string;
  type?: 'project' | 'contact' | 'coaching';
  projectName?: string;
  projectId?: string;
  message?: string;
  pageSource?: string;
  crmSource?: string;
  stage?: string;
  temperature?: string;
  ownerId?: string;
};

export const addStaffLead = async (data: StaffLeadPayload) => {
  const response = await http.post('/leads/staff', data);
  return response.data; // { message, leadId, lead }
};

/** One normalized row for Privyr / desk CSV import. */
export type StaffLeadImportRow = {
  name: string;
  phoneNumber: string;
  email?: string;
  message?: string;
  projectName?: string;
  pageSource?: string;
  crmSource?: string;
  stage?: string;
  temperature?: string;
  ownerId?: string;
  ownerEmail?: string;
  importRef?: string;
  createdAt?: string;
};

export type StaffLeadImportResult = {
  message: string;
  created: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  errors?: { row: number; reason: string }[];
  leadIds?: string[];
};

export const importStaffLeads = async (
  rows: StaffLeadImportRow[],
): Promise<StaffLeadImportResult> => {
  const response = await http.post('/leads/staff/import', { rows });
  return response.data;
};

export type WhatsappAgentStatus = {
  enabled: boolean;
  agentEnabled: boolean;
  autoTemplatesEnabled: boolean;
  configured: boolean;
  note?: string;
  message?: string;
};

export const getWhatsappAgentStatus = async (): Promise<WhatsappAgentStatus> => {
  const response = await http.get('/whatsapp/agent');
  return response.data;
};

export const setWhatsappControls = async (patch: {
  agentEnabled?: boolean;
  autoTemplatesEnabled?: boolean;
}): Promise<WhatsappAgentStatus> => {
  const response = await http.patch('/whatsapp/agent', patch);
  return response.data;
};

export type AssignableOwner = {
  _id: string;
  name: string;
  email: string;
  usertype: string;
};

export const getAssignableLeadOwners = async (): Promise<AssignableOwner[]> => {
  const response = await http.get('/leads/meta/assignable-owners');
  return response.data?.owners || [];
};

export const updateLead = (leadId: string, data: any) => {
  return http.patch(`/leads/${leadId}`, data);
};

export const addLeadNote = async (leadId: string, note: string) => {
  const response = await http.post(`/leads/${leadId}/notes`, { note });
  return response.data; // { activity }
};

export const updateLeadNote = async (leadId: string, noteId: string, note: string) => {
  const response = await http.patch(
    `/leads/${encodeURIComponent(String(leadId))}/notes/${encodeURIComponent(String(noteId))}`,
    { note: String(note) },
  );
  return response.data; // { activity }
};

export const deleteLeadNote = async (leadId: string, noteId: string) => {
  const response = await http.delete(
    `/leads/${encodeURIComponent(String(leadId))}/notes/${encodeURIComponent(String(noteId))}`,
  );
  return response.data; // { ok, id }
};

export const assignLeadOwner = async (leadId: string, ownerId: string | null) => {
  const response = await http.patch(`/leads/${encodeURIComponent(String(leadId))}/assign`, {
    ownerId,
  });
  return response.data;
};

export const getLeadActivities = async (leadId: string) => {
  // Cache-bust with query only. Do not send Cache-Control request headers
  // (they trigger CORS preflight and our API allowlist blocks them).
  const response = await http.get(`/leads/${leadId}/activities`, {
    params: { _ts: Date.now() },
  });
  return response.data; // { activities: [...] }
};

export const deleteLead = (leadId: string) => {
  return http.delete(`/leads/${leadId}`);
};

/** Sales starts one Outpero call for a coaching lead. Secrets stay on the API. */
export const sendLeadCall = async (leadId: string) => {
  const response = await http.post(`/leads/${encodeURIComponent(String(leadId))}/call`);
  return response.data as {
    message: string;
    callId: string;
    outperoCallId?: string;
    status: string;
    phoneSent: string;
  };
};

export const getLeadCalls = async (leadId: string) => {
  const response = await http.get(`/leads/${encodeURIComponent(String(leadId))}/calls`);
  return response.data;
};

/** Clear stuck In progress when Outpero never sent a final status (busy / no answer). */
export const releaseLeadCall = async (leadId: string) => {
  const response = await http.post(
    `/leads/${encodeURIComponent(String(leadId))}/call/release`,
  );
  return response.data as { released: boolean };
};

/** AiSensy template list for the lead desk Send WhatsApp picker. */
export const getWhatsappTemplates = async () => {
  const response = await http.get('/leads/meta/whatsapp-templates');
  return response.data as {
    configured: boolean;
    autoEnabled: boolean;
    templates: Array<{
      key: string;
      label: string;
      campaignName: string;
      ready: boolean;
    }>;
  };
};

/** Staff sends one approved WhatsApp template to a coaching/consulting lead. */
export const sendLeadWhatsapp = async (leadId: string, campaign: string) => {
  const response = await http.post(`/leads/${encodeURIComponent(String(leadId))}/whatsapp`, {
    campaign,
  });
  return response.data as {
    message: string;
    campaign: string;
    campaignName: string;
    destination: string;
    activity?: { _id: string; note?: string; type?: string; createdAt?: string };
  };
};

// Career applications
export const getApplications = async () => {
  const response = await http.get('/applications');
  return response.data;
};

export const getApplicationDetails = (applicationId: string) => {
  return http.get(`/applications/${applicationId}`);
};

export const deleteApplication = (applicationId: string) => {
  return http.delete(`/applications/${applicationId}`);
};

export const downloadApplicationResume = (applicationId: string) => {
  return http.get(`/applications/${applicationId}/resume/download`, { responseType: 'blob' });
};

// Channel partner enrolments
export const getChannelPartners = async () => {
  const response = await http.get('/channel-partners');
  return response.data;
};

export const updateChannelPartner = (partnerId: string, data: any) => {
  return http.patch(`/channel-partners/${partnerId}`, data);
};

export const deleteChannelPartner = (partnerId: string) => {
  return http.delete(`/channel-partners/${partnerId}`);
};

export const downloadChannelPartnersCsv = () => {
  return http.get('/channel-partners/export/csv', { responseType: 'blob' });
};

export const getVendors = async () => {
  const response = await http.get('/vendors');
  return response.data;
};

export const createVendor = (data: FormData | Record<string, unknown>) => {
  return http.post('/vendors', data);
};

export const updateVendor = (vendorId: string, data: FormData | Record<string, unknown>) => {
  return http.patch(`/vendors/${vendorId}`, data);
};

export const removeVendorDocument = async (vendorId: string, kind: 'cheque' | 'brochure') => {
  const response = await http.delete(`/vendors/${vendorId}/documents/${kind}`);
  return response.data;
};

export const deleteVendor = (vendorId: string) => {
  return http.delete(`/vendors/${vendorId}`);
};

export const getVendorPartners = async () => {
  const response = await http.get('/vendor-partners');
  return response.data;
};

export const updateVendorPartner = (id: string, data: { status: 'approved' | 'rejected' | 'resubmit' }) => {
  return http.patch(`/vendor-partners/${id}`, data);
};

export const deleteVendorPartner = (id: string) => {
  return http.delete(`/vendor-partners/${id}`);
};

// Users — staff listing and role changes
export const getUsers = async () => {
  const response = await http.get('/users');
  return response.data;
};

export const changeUserRole = (userId: string, usertype: string) => {
  return http.patch(`/users/${userId}/role`, { usertype });
};

export const setUserAccess = (userId: string, enabled: boolean) => {
  return http.patch(`/users/${userId}/access`, { enabled });
};

/** Super admin: department + custom staff menu allowlist. */
export const updateUserAccessProfile = (
  userId: string,
  data: {
    department?: string;
    deskAccess?: string[];
    menuAccess?: string[];
    useRoleDefaults?: boolean;
    usertype?: string;
  },
) => {
  return http.patch(`/users/${userId}/access-profile`, data);
};

export const resetUserPassword = (userId: string, password: string) => {
  return http.patch(`/users/${userId}/password`, { password });
};

export const deleteUser = (userId: string) => {
  return http.delete(`/users/${userId}`);
};

/** Owner / builder listings on the public site (`properties` + `listing_users`). */
export const getAdminListings = async (status?: string) => {
  const response = await http.get('/properties/admin/all', { params: status ? { status } : undefined });
  return response.data;
};

export const getAdminListing = async (id: string) => {
  const response = await http.get(`/properties/admin/${id}`);
  return response.data;
};

export const updateAdminListing = async (
  id: string,
  data: {
    city?: string;
    listingType?: string;
    details?: Record<string, unknown>;
    ownerName?: string;
    email?: string;
    mobile?: string;
  },
) => {
  const response = await http.patch(`/properties/admin/${id}`, data);
  return response.data;
};

export const approveAdminListing = async (id: string) => {
  const response = await http.patch(`/properties/admin/${id}/approve`);
  return response.data;
};

export const rejectAdminListing = async (id: string, reason?: string) => {
  const response = await http.patch(`/properties/admin/${id}/reject`, { reason });
  return response.data;
};

export const deleteAdminListing = async (id: string) => {
  const response = await http.delete(`/properties/admin/${id}`);
  return response.data;
};

export const bulkApproveAdminListings = async (ids: string[]) => {
  const response = await http.post('/properties/admin/bulk-approve', { ids });
  return response.data;
};

export const bulkRejectAdminListings = async (ids: string[], reason?: string) => {
  const response = await http.post('/properties/admin/bulk-reject', { ids, reason });
  return response.data;
};

export const bulkDeleteAdminListings = async (ids: string[]) => {
  const response = await http.post('/properties/admin/bulk-delete', { ids });
  return response.data;
};

export const getAdminListingUsers = async () => {
  const response = await http.get('/properties/admin/users');
  return response.data;
};

export const getAdminListingUser = async (userId: string) => {
  const response = await http.get(`/properties/admin/users/${userId}`);
  return response.data;
};

export const createAdminListingUser = async (data: {
  email: string;
  password: string;
  name?: string;
  mobile?: string;
  city?: string;
}) => {
  const response = await http.post('/properties/admin/users', data);
  return response.data;
};

export const updateAdminListingUser = async (
  userId: string,
  data: { email?: string; name?: string; mobile?: string; city?: string },
) => {
  const response = await http.patch(`/properties/admin/users/${userId}`, data);
  return response.data;
};

export const resetAdminListingUserPassword = async (userId: string, password: string) => {
  const response = await http.patch(`/properties/admin/users/${userId}/password`, { password });
  return response.data;
};

export const deleteAdminListingUser = async (userId: string) => {
  const response = await http.delete(`/properties/admin/users/${userId}`);
  return response.data;
};

export const bulkDeleteAdminListingUsers = async (ids: string[]) => {
  const response = await http.post('/properties/admin/users/bulk-delete', { ids });
  return response.data;
};

export interface CoachingPayment {
  _id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  modules: { id: number; title: string; category?: string }[];
  count: number;
  baseAmount: number;
  discountPercent: number;
  discountAmount: number;
  payableAmount: number;
  currency: string;
  customer: { name: string; email: string; phone: string };
  status: 'pending' | 'completed' | 'failed';
  failureReason?: string;
  webhookVerifiedAt?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
  invoiceSentAt?: string;
  invoiceSentTo?: string;
  createdAt: string;
}

export const getCoachingPayments = async (): Promise<CoachingPayment[]> => {
  const response = await http.get('/payments/admin');
  return response.data;
};

/** Spend / tool expenses from Gmail Sheet sync + manual entries. */
export type MoneyEntry = {
  _id: string;
  date: string;
  type: 'expense' | 'income';
  merchant: string;
  product?: string;
  category?: string;
  amountOriginal: number;
  currency: string;
  amountInr: number;
  month?: string;
  year?: string;
  likelySubscription?: string;
  note?: string;
  project?: string;
  gmailLink?: string;
  externalId?: string;
  source?: string;
  status?: string;
};

export type MoneySummary = {
  year: string;
  expenseCount: number;
  totalInr: number;
  byMonth: { month: string; count: number; totalInr: number }[];
  subscriptions: {
    merchant: string;
    timesSeen: number;
    totalInr: number;
    lastDate: string;
    estMonthlyInr: number;
  }[];
};

export type MoneyEntryInput = {
  date: string;
  type?: 'expense' | 'income';
  merchant: string;
  product?: string;
  category?: string;
  amountOriginal: number;
  currency?: string;
  amountInr: number;
  likelySubscription?: string;
  note?: string;
  project?: string;
};

export const getMoneyEntries = async (params: {
  month?: string;
  year?: string;
  type?: string;
  limit?: number;
} = {}): Promise<MoneyEntry[]> => {
  const response = await http.get('/money-entries', { params });
  return response.data;
};

export const getMoneySummary = async (year?: string): Promise<MoneySummary> => {
  const response = await http.get('/money-entries/summary', {
    params: year ? { year } : undefined,
  });
  return response.data;
};

export const createMoneyEntry = (data: MoneyEntryInput) => {
  return http.post('/money-entries', data);
};

export const updateMoneyEntry = (id: string, data: Partial<MoneyEntryInput>) => {
  return http.patch(`/money-entries/${id}`, data);
};

export const deleteMoneyEntry = (id: string) => {
  return http.delete(`/money-entries/${id}`);
};

export const sendCoachingInvoice = (paymentId: string) => {
  return http.post(`/payments/admin/${paymentId}/invoice`);
};

export const createUser = (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  usertype: string;
  department?: string;
  userimage?: string;
}) => {
  return http.post('/users', data);
};

export interface EmployeeJoinProgress {
  completedCount: number;
  totalSteps: number;
  percent: number;
  label: string;
  nextStep: string;
}

export interface EmployeeRecord {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  personalEmail: string;
  phone: string;
  designation: string;
  department: string;
  joiningDate: string;
  onboardingStatus: string;
  employmentStatus: string;
  createdAt?: string;
  invitationExpiresAt?: string | null;
  invitationExpired?: boolean;
  invitationEmailVerified?: boolean;
  canResendJoinLink?: boolean;
  joinCompletedSteps?: number[];
  joinProgress?: EmployeeJoinProgress;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  personalEmail: string;
  phone: string;
  designation: string;
  department: string;
  joiningDate: string;
}

export const getEmployees = async (): Promise<EmployeeRecord[]> => {
  const response = await http.get('/employees');
  return response.data;
};

export const createEmployee = (data: CreateEmployeeInput) => {
  return http.post('/employees', data);
};

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  employmentStatus?: string;
}

export const updateEmployee = (employeeId: string, data: UpdateEmployeeInput) => {
  return http.patch(`/employees/${employeeId}`, data);
};

export const deleteEmployee = (employeeId: string) => {
  return http.delete(`/employees/${employeeId}`);
};

export const getEmployeeForm = async (employeeId: string): Promise<JoinFormDraft> => {
  const response = await http.get(`/employees/${employeeId}/form`);
  return response.data;
};

export const saveEmployeeForm = async (
  employeeId: string,
  data: Omit<
    JoinFormDraft,
    | 'firstName'
    | 'lastName'
    | 'personalEmail'
    | 'personalSectionSavedAt'
    | 'formDraftSavedAt'
    | 'onboardingStatus'
  >,
): Promise<JoinFormDraft> => {
  const response = await http.put(`/employees/${employeeId}/form`, data);
  return response.data;
};

export const uploadEmployeeDocument = async (
  employeeId: string,
  documentType: string,
  file: File,
): Promise<JoinDocumentsChecklist> => {
  const body = new FormData();
  body.append('file', file);
  const response = await http.post(`/employees/${employeeId}/documents/${documentType}/upload`, body, {
    headers: {
      'Content-Type': undefined as unknown as string,
    },
  });
  return response.data;
};

export const sendEmployeeInvitation = (employeeId: string) => {
  return http.post(`/employees/${employeeId}/invitation`);
};

/** Fresh join URL for expired / incomplete forms. Keeps saved details; skips OTP if already verified. */
export const resendEmployeeJoinLink = (employeeId: string) => {
  return http.post(`/employees/${employeeId}/invitation/resend`);
};

export const getEmployeeDocuments = async (
  employeeId: string,
): Promise<JoinDocumentsChecklist> => {
  const response = await http.get(`/employees/${employeeId}/documents`);
  return response.data;
};

export const fetchEmployeeDocumentBlob = async (
  employeeId: string,
  documentType: string,
): Promise<{ blob: Blob; mimeType: string }> => {
  const response = await http.get(`/employees/${employeeId}/documents/${documentType}/file`, {
    responseType: 'blob',
  });
  const mimeType =
    (response.headers['content-type'] as string) ||
    response.data.type ||
    'application/octet-stream';
  return { blob: response.data as Blob, mimeType };
};

export const approveEmployeeDocument = async (employeeId: string, documentType: string) => {
  const response = await http.post(`/employees/${employeeId}/documents/${documentType}/approve`);
  return response.data as JoinDocumentsChecklist;
};

export const rejectEmployeeDocument = async (
  employeeId: string,
  documentType: string,
  reason: string,
) => {
  const response = await http.post(`/employees/${employeeId}/documents/${documentType}/reject`, {
    reason,
  });
  return response.data as JoinDocumentsChecklist;
};

export const deleteEmployeeDocument = async (employeeId: string, documentType: string) => {
  const response = await http.delete(`/employees/${employeeId}/documents/${documentType}`);
  return response.data as JoinDocumentsChecklist;
};

export type EmployeePackageReview = {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  personalEmail: string;
  phone: string;
  designation: string;
  department: string;
  joiningDate: string;
  onboardingStatus: string;
  packageSubmittedAt: string | null;
  packageReviewedAt: string | null;
  packageCorrectionReason: string;
  canStartReview: boolean;
  canApprove: boolean;
  canReturn: boolean;
  form: {
    phone: string;
    currentAddress: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    educationCount: number;
    isFresher: boolean;
    previousEmploymentCount: number;
    referencesCount: number;
    bankName: string;
    bankIfsc: string;
    formDraftSavedAt: string | null;
  };
  documents: {
    requiredCount: number;
    uploadedCount: number;
    approvedCount: number;
    allRequiredApproved: boolean;
    rows: Array<{
      documentType: string;
      label: string;
      required: boolean;
      status: string;
      rejectionReason: string;
    }>;
  };
  policies: {
    requiredCount: number;
    acknowledgedCount: number;
    allAcknowledged: boolean;
    declarationAccepted: boolean;
    declarationVersion: string;
    rows: Array<{
      policyId: string;
      title: string;
      version: string;
      acknowledged: boolean;
      acknowledgedAt: string | null;
    }>;
  };
};

export const getEmployeePackageReview = async (
  employeeId: string,
): Promise<EmployeePackageReview> => {
  const response = await http.get(`/employees/${employeeId}/review`);
  return response.data;
};

export const startEmployeePackageReview = async (
  employeeId: string,
): Promise<EmployeePackageReview> => {
  const response = await http.post(`/employees/${employeeId}/review/start`);
  return response.data;
};

export const approveEmployeePackage = async (
  employeeId: string,
): Promise<EmployeePackageReview> => {
  const response = await http.post(`/employees/${employeeId}/review/approve`);
  return response.data;
};

export const returnEmployeePackage = async (
  employeeId: string,
  reason: string,
): Promise<EmployeePackageReview> => {
  const response = await http.post(`/employees/${employeeId}/review/return`, { reason });
  return response.data;
};

export interface InvitationLookup {
  valid: true;
  firstName: string;
  emailVerified: boolean;
  maskedEmail: string;
}

export interface JoinSessionResult {
  verified: true;
  firstName: string;
  accessToken: string;
}

export interface JoinEducationRow {
  qualification: string;
  institution: string;
  yearOfPassing: string;
  percentageOrCgpa: string;
  specialization: string;
}

export interface JoinEmploymentRow {
  companyName: string;
  designation: string;
  fromDate: string;
  toDate: string;
  lastCtc: string;
  reasonForLeaving: string;
  referenceName: string;
  referencePhone: string;
}

export interface JoinReferenceRow {
  name: string;
  relation: string;
  phone: string;
  email: string;
  organization: string;
  designation: string;
  address: string;
  yearsKnown: string;
}

export interface JoinFormDraft {
  firstName: string;
  lastName: string;
  personalEmail: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  alternatePhone: string;
  fatherName: string;
  motherName: string;
  maritalStatus: string;
  spouseName: string;
  bloodGroup: string;
  nationality: string;
  currentCity: string;
  hometown: string;
  languagesKnown: string;
  totalExperienceYears: string;
  noticePeriodDays: string;
  passportNumber: string;
  drivingLicenseNumber: string;
  uanNumber: string;
  pfNumber: string;
  esiNumber: string;
  linkedInUrl: string;
  currentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  education: JoinEducationRow[];
  isFresher: boolean;
  previousEmployment: JoinEmploymentRow[];
  references: JoinReferenceRow[];
  bankAccountHolderName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  personalSectionSavedAt: string | null;
  formDraftSavedAt: string | null;
  onboardingStatus: string;
  joinCompletedSteps?: number[];
  joinStepTotal?: number;
}

/** @deprecated use JoinFormDraft */
export type JoinPersonalDraft = JoinFormDraft;

/** Join APIs must not reuse the staff cookie Authorization header. */
const joinHttp = axios.create({
  baseURL: (http.defaults.baseURL as string) || '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
  },
});

const joinAuth = (accessToken: string) => ({
  headers: { Authorization: `Bearer ${accessToken}` },
});

export const resolveInvitation = async (token: string): Promise<InvitationLookup> => {
  const response = await joinHttp.get('/join', { params: { token } });
  return response.data;
};

export const requestJoinOtp = async (token: string) => {
  const response = await joinHttp.post('/join/otp', { token });
  return response.data as { message: string; maskedEmail: string; expiresAt: string };
};

export const verifyJoinOtp = async (token: string, code: string): Promise<JoinSessionResult> => {
  const response = await joinHttp.post('/join/verify', { token, code });
  return response.data;
};

export const resumeJoinSession = async (token: string): Promise<JoinSessionResult> => {
  const response = await joinHttp.post('/join/session', { token });
  return response.data;
};

export const getJoinForm = async (accessToken: string): Promise<JoinFormDraft> => {
  const response = await joinHttp.get('/join/form', joinAuth(accessToken));
  return response.data;
};

export const saveJoinForm = async (
  accessToken: string,
  data: Omit<
    JoinFormDraft,
    | 'firstName'
    | 'lastName'
    | 'personalEmail'
    | 'personalSectionSavedAt'
    | 'formDraftSavedAt'
    | 'onboardingStatus'
    | 'joinCompletedSteps'
    | 'joinStepTotal'
  > & { completedStep?: number },
) => {
  const response = await joinHttp.put('/join/form', data, joinAuth(accessToken));
  return response.data as JoinFormDraft;
};

export const markJoinStepComplete = async (
  accessToken: string,
  completedStep: number,
): Promise<JoinFormDraft> => {
  const response = await joinHttp.post(
    '/join/progress',
    { completedStep },
    joinAuth(accessToken),
  );
  return response.data as JoinFormDraft;
};

/** @deprecated use getJoinForm / saveJoinForm */
export const getJoinPersonal = getJoinForm;
export const saveJoinPersonal = saveJoinForm;

export type JoinDocumentItem = {
  documentType: string;
  label: string;
  required: boolean;
  status: string;
  version: number;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string | null;
  rejectionReason?: string;
  reviewedAt?: string | null;
};

export type JoinDocumentsChecklist = {
  documents: JoinDocumentItem[];
  requiredCount: number;
  uploadedCount: number;
  approvedCount?: number;
};

export const getJoinDocuments = async (accessToken: string): Promise<JoinDocumentsChecklist> => {
  const response = await joinHttp.get('/join/documents', joinAuth(accessToken));
  return response.data;
};

export const uploadJoinDocument = async (
  accessToken: string,
  documentType: string,
  file: File,
): Promise<JoinDocumentsChecklist> => {
  const body = new FormData();
  body.append('file', file);
  const response = await joinHttp.post(`/join/documents/${documentType}`, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Let the browser set multipart boundary; do not force JSON.
      'Content-Type': undefined as unknown as string,
    },
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData && headers) {
          delete (headers as Record<string, unknown>)['Content-Type'];
        }
        return data;
      },
    ],
  });
  return response.data;
};

export const deleteJoinDocument = async (
  accessToken: string,
  documentType: string,
): Promise<JoinDocumentsChecklist> => {
  const response = await joinHttp.delete(`/join/documents/${documentType}`, joinAuth(accessToken));
  return response.data;
};

/** Private preview blob. Caller must revokeObjectURL when done. */
export const fetchJoinDocumentBlob = async (
  accessToken: string,
  documentType: string,
): Promise<{ blob: Blob; mimeType: string }> => {
  const response = await joinHttp.get(`/join/documents/${documentType}/file`, {
    ...joinAuth(accessToken),
    responseType: 'blob',
  });
  const mimeType =
    (response.headers['content-type'] as string) ||
    response.data.type ||
    'application/octet-stream';
  return { blob: response.data as Blob, mimeType };
};

export type JoinPolicyItem = {
  policyId: string;
  version: string;
  title: string;
  summary: string;
  body: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
};

export type JoinPoliciesState = {
  policies: JoinPolicyItem[];
  requiredCount: number;
  acknowledgedCount: number;
  allPoliciesAcknowledged: boolean;
  declaration: {
    version: string;
    title: string;
    body: string;
    accepted: boolean;
    acceptedAt: string | null;
  };
};

export const getJoinPolicies = async (accessToken: string): Promise<JoinPoliciesState> => {
  const response = await joinHttp.get('/join/policies', joinAuth(accessToken));
  return response.data;
};

export const acknowledgeJoinPolicy = async (
  accessToken: string,
  policyId: string,
): Promise<JoinPoliciesState> => {
  const response = await joinHttp.post(
    `/join/policies/${policyId}/acknowledge`,
    {},
    joinAuth(accessToken),
  );
  return response.data;
};

export const acceptJoinDeclaration = async (
  accessToken: string,
): Promise<JoinPoliciesState> => {
  const response = await joinHttp.post(
    '/join/declaration',
    { accepted: true },
    joinAuth(accessToken),
  );
  return response.data;
};

export type JoinReadinessState = {
  ready: boolean;
  alreadySubmitted: boolean;
  onboardingStatus: string;
  packageSubmittedAt: string | null;
  packageCorrectionReason?: string;
  form: { ready: boolean; issues: string[] };
  documents: {
    ready: boolean;
    issues: string[];
    requiredCount: number;
    uploadedCount: number;
  };
  policies: {
    ready: boolean;
    issues: string[];
    requiredCount: number;
    acknowledgedCount: number;
    declarationAccepted: boolean;
  };
};

export const getJoinReadiness = async (accessToken: string): Promise<JoinReadinessState> => {
  const response = await joinHttp.get('/join/readiness', joinAuth(accessToken));
  return response.data;
};

export const submitJoinPackage = async (accessToken: string): Promise<JoinReadinessState> => {
  const response = await joinHttp.post('/join/submit', {}, joinAuth(accessToken));
  return response.data;
};

// Site visits — daily unique-visitor tracker
export const getSiteVisitsSummary = async () => {
  const response = await http.get('/site-visits/summary');
  return response.data;
};


export const searchProjects = (searchItem: string) => {
  return http.get("/projects/search", { params: { searchItem } });
};

export const updateProject = (projectId: string, data: any) => {
  return http.put(`/projects/${projectId}`, data);
};

export const updateProjectOcReceived = (slug: string, ocReceived: boolean) => {
  return http.put(`/projects/${slug}/oc-received`, { ocReceived });
};

export const deleteProject = (projectId: string) => {
  return http.delete(`/projects/${projectId}`);
};




export interface BlogSection {
  title?: string;
  description?: string;
  type?: string;
}

export interface BlogRecord {
  _id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  imageurl?: string;
  posturl?: string;
  embedposturl?: string;
  Linkedinprofileurl?: string;
  sections?: BlogSection[];
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogInput {
  title: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  imageurl?: string;
  posturl?: string;
  embedposturl?: string;
  Linkedinprofileurl?: string;
  sections?: BlogSection[];
  published?: boolean;
}

export const getAdminBlogs = async (): Promise<BlogRecord[]> => {
  const response = await http.get('/blogs/admin');
  return response.data;
};

export const createBlog = (data: BlogInput) => {
  return http.post('/blogs', data);
};

export const updateBlog = (blogId: string, data: BlogInput) => {
  return http.patch(`/blogs/${blogId}`, data);
};

export const deleteBlog = (blogId: string) => {
  return http.delete(`/blogs/${blogId}`);
};

export const importDprBlogs = async () => {
  const response = await http.post('/blogs/import');
  return response.data as { imported: number; skipped: number; total: number };
};

export const FileUpload = (folderName: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file); // Append the file to FormData
  return http.post(`/bunny/upload/${folderName}`, formData);
};

export interface GalleryPhotoRecord {
  _id: string;
  url: string;
  filename?: string;
  title?: string;
  caption?: string;
  alt?: string;
  sortOrder?: number;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryPhotoInput {
  url: string;
  filename?: string;
  title?: string;
  caption?: string;
  alt?: string;
  sortOrder?: number;
  published?: boolean;
}

export const getAdminGalleryPhotos = async (): Promise<GalleryPhotoRecord[]> => {
  const response = await http.get('/gallery-photos/admin');
  return response.data;
};

export const createGalleryPhoto = (data: GalleryPhotoInput) => {
  return http.post('/gallery-photos', data);
};

export const updateGalleryPhoto = (photoId: string, data: Partial<GalleryPhotoInput>) => {
  return http.patch(`/gallery-photos/${photoId}`, data);
};

export const deleteGalleryPhoto = (photoId: string) => {
  return http.delete(`/gallery-photos/${photoId}`);
};





































































































































































































































