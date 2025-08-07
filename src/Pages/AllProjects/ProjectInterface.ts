// ProjectInterface.ts

export interface Projects {
  title: string;
  bhk: number[];
  towers: number;
  parkingarea: number;
  location: string;
  sqft: number[];
  highlights: string[];
  slug: string;
  projectimage: string;
  rera: string;
  date: number; 
}

export interface ProjectDetails {
  title: string;
  description: string;
  bhk: number[]; // Example: [3, 4, 5]
  sqft: number[]; // Example: [8888, 9999, 11111]
  visits: number; // default: 0, only positive integers
  leads: number; // default: 0, only positive integers
  slug: string;
  launchdate: number; // timestamp or year
  sftPrice: number;
  location: string;
  zone: string; // Expected: 'east' | 'west' | 'north' | 'south'
  street: string;
  towers: number;
  locationiframe: string;
  parkingarea: number;
  propertyType: string; // Enum: 'Apartments' | 'Villas'
  bankOffers: {
    bankIcon: string;
    bankName: string;
  }[];
  highlights: {
    items: string[]; // array of highlight strings
  };
}

export interface HeroSection {
  backgroundimage: string;
  projectimage: string;
  projectlogo: string;
  h1: string;
  h2: string;
  h3: string;
  rera: string;
  loc: string;
  alig: string; // Expected: 'left' | 'right'

}

export interface AboutSection {
  des: string;
  images: {
    img: string;
    h1?: string;
  }[];
  highlights: {
    h1: string;
    d1: string;
  }[];
}

export interface GalleryGrid {
  c0r0?: string[];
  c0r1?: string[];
  c1r0?: string[];
  c2r0?: string[];
  c2r1?: string[];
}

export interface GallerySection {
  interior: GalleryGrid;
  exterior: GalleryGrid;
}
export interface Layout {
  d1: string;
  img: string;
  highlights: string[];
}
export interface FloorPlan {
  gid: string;
  tower: string;
  sft: number;
  bhk: number; // Example: 3, 3.5, 4, 4.5, etc.
  facing: string; // Expected: 'east' | 'west' | 'north' | 'south'
  floorplanimage: string;
  tableimage: string;
}

export interface FloorPlans {
  layoutimage: string;
  data: FloorPlan[];
}

export interface Amenity {
  logo: string;
  h1: string;
}


export interface Amenities {
  d1: string;
  data: Amenity[];
}

export interface NearbyLocation {
  h1: string;
  time: number; // in minutes
}

export interface ConnectedLocationGroup {
  type: string;
  data: NearbyLocation[];
}

export interface ConnectedLiving {
  locationimage: string;
  data: ConnectedLocationGroup[];
}

export interface project {
  projects:Projects;
  projectdetails: ProjectDetails;
  herosection: HeroSection;
  aboutsection: AboutSection;
  gallerysection: GallerySection;
  layout: Layout;
  floorplans: FloorPlans;
  amenities: Amenities;
  connectedliving: ConnectedLiving;
}

// Unified Project interface for Projects.tsx and ProjectDetails
export interface Project {
  _id: string;
  title: string;
  description: string;
  bhk: number[];
  sqft: number[];
  visits: number;
  leads: number;
  slug: string;
  launchdate: number;
  sftPrice: number;
  location: string;
  zone: string;
  street: string;
  towers: number;
  locationiframe: string;
  parkingarea: number;
  propertyType: string;
  bankOffers: {
    bankIcon: string;
    bankName: string;
  }[];
  name: string;
  projectId: string;
  Layout: any[];
  projectImages?: any[];
  locationHighlights?: any[];
  floorPlans?: any[];
  amenities?: any[];
  connectedliving: any[];
  projectBHK: (string | number)[];
}
