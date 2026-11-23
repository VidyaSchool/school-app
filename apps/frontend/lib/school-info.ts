/**
 * Central Content Source of Truth for VIDYA School, Gurugram
 * Validated against official CBSE mandatory disclosures and institutional records.
 */

export const SCHOOL_INFO = {
  name: "VIDYA School",
  fullName: "The VIDYA School, Gurugram",
  tagline: "Be the Guiding Star — Empowering Minds, Shaping Futures",
  organization: "VIDYA Integrated Development for Youth and Adults (VIDYA India)",
  schoolWebsite: "https://www.vidyaschool.com",
  organizationWebsite: "https://vidya-india.org",
  
  // CBSE Affiliation & Identification
  affiliationNumber: "531105",
  schoolCode: "41054",
  board: "Central Board of Secondary Education (CBSE)",
  status: "Senior Secondary (Class Nursery to XII)",
  
  // Leadership
  principal: {
    name: "Ms. Ila Sarin",
    qualification: "MSc (Chemistry), B.Ed.",
    designation: "Principal",
    email: "principal.vidyaschool@vidya-india.org",
  },

  // Contact Details
  phone: "+91-8130672281",
  displayPhone: "+91-8130672281",
  emails: {
    general: "info.vidyaschool@vidya-india.org",
    principal: "principal.vidyaschool@vidya-india.org",
  },

  // Standardized Postal Address (Approved PIN: 122002)
  address: {
    line1: "Plot No. 3126, Block S",
    landmark: "Near St. Stephen's Hospital",
    area: "DLF Phase 3, Sector 24",
    city: "Gurugram",
    state: "Haryana",
    pinCode: "122002",
    country: "India",
    full: "Plot No. 3126, Block S, Sector 24, DLF Phase 3, Gurugram, Haryana 122002, India",
    mapsUrl: "https://maps.google.com/?q=DLF+Phase+3+Sector+24+Gurugram+Haryana+122002",
  },

  // Operational Timings
  hours: {
    office: {
      weekday: "Monday – Friday: 8:00 AM – 4:30 PM (16:30 Hrs)",
      saturday: "Saturday: 8:00 AM – 2:00 PM (14:00 Hrs)",
      sunday: "Sunday: Closed",
    },
    helpline: {
      weekday: "8:00 AM – 4:30 PM",
      saturday: "8:00 AM – 2:00 PM",
      note: "Phone lines active during office hours",
    },
    visitors: {
      timing: "Monday – Friday: 9:00 AM – 1:00 PM",
      note: "By prior appointment only",
    },
  },

  // Academic Sessions
  currentAcademicSession: "2026–27",
  upcomingAcademicSession: "2027–28",
  activeFeeScheduleSession: "2026–27 (Continuing 2025–26 approved government rates)",

  // Official Faculty Data (CBSE Mandatory Disclosure)
  facultyStats: {
    totalTeachers: 49,
    pgt: 16,
    tgt: 18,
    prt: 15,
    specialEducator: {
      name: "Ms. Uma Jangra",
      qualification: "B.A, M.A (Political Science), B.Ed (Special Education)",
      count: 1,
    },
    counselor: {
      name: "Ms. Nikita Kulhari",
      qualification: "M.A (Applied Psychology)",
      count: 1,
    },
    petCoaches: 4,
    teacherSectionRatio: "40:1",
    oasisDisclosureDate: "February 2026",
  },

  // Verified CBSE Board Examination Results (100% Pass Percentage)
  boardResults: {
    classX: [
      { year: "2022-2023", registered: 70, passed: 70, passPercentage: "100%" },
      { year: "2023-2024", registered: 79, passed: 79, passPercentage: "100%" },
      { year: "2024-2025", registered: 67, passed: 67, passPercentage: "100%" },
    ],
    classXII: [
      { year: "2022-2023", registered: 72, passed: 72, passPercentage: "100%" },
      { year: "2023-2024", registered: 88, passed: 88, passPercentage: "100%" },
      { year: "2024-2025", registered: 82, passed: 82, passPercentage: "100%" },
    ],
  },
} as const
