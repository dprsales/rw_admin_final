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

export const getLeads = async () => {
  const response = await http.get('/leads');
  return response.data; // { leads: [...] }
}

export const getLeadDetails = (leadId: string) => {
  return http.get(`/leads/${leadId}`);
};

export const addLead = (data: any) => {
  return http.post("/leads", data);
};

export const updateLead = (leadId: string, data: any) => {
  return http.patch(`/leads/${leadId}`, data);
};

export const deleteLead = (leadId: string) => {
  return http.delete(`/leads/${leadId}`);
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

export const resetUserPassword = (userId: string, password: string) => {
  return http.patch(`/users/${userId}/password`, { password });
};

export const deleteUser = (userId: string) => {
  return http.delete(`/users/${userId}`);
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

export const sendCoachingInvoice = (paymentId: string) => {
  return http.post(`/payments/admin/${paymentId}/invoice`);
};

export const createUser = (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  usertype: string;
  userimage?: string;
}) => {
  return http.post('/users', data);
};

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

export const sendEmployeeInvitation = (employeeId: string) => {
  return http.post(`/employees/${employeeId}/invitation`);
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





































































































































































































































