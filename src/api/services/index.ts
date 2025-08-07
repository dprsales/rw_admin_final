import { http } from "../http";

// Auth
export const authLogin = (data: any) => {
  return http.post("/auth/login", data);
};



// export const getProjects = () => {
//   return http.get("/projects");
// }

// api/services.ts

export const getProjects = async () => {
  const response = await http.get("/projects");
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


export const searchProjects = (searchItem: string) => {
  return http.get("/projects/search", { params: { searchItem } });
};

export const updateProject = (projectId: string, data: any) => {
  return http.patch(`/projects/${projectId}`, data);
};




export const FileUpload = (folderName: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file); // Append the file to FormData
  return http.post(`/bunny/upload/${folderName}`, formData);
};





































































































































































































































