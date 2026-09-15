import os
import sys
import json
import time
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment
load_dotenv('/home/ankit/Documents/Code/vs/backend/.env')
sys.path.insert(0, '/home/ankit/Documents/Code/vs/backend')

from app.core.database import get_db
from sqlmodel import select
from models import CustomPage

PAGES_DATA = [
    {
        "slug": "home",
        "title": "Home - The VIDYA School",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "The VIDYA School – Integrated Development for Youth and Adults",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Inaugurated in November 2009, the VIDYA School in Sector 24, Gurugram, Haryana, is a state-of-the-art English-medium CBSE institution dedicated to delivering transformative, holistic education to over 1,000+ less-privileged children."
                }
            },
            {
                "id": "blk-stats",
                "type": "stats",
                "data": {
                    "stat": "1,000+",
                    "label": "Students Empowered",
                    "subtext": "Quality English-medium CBSE education in DLF Phase-3, Gurugram"
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "c1",
                            "badge": "Academic Excellence",
                            "title": "Holistic CBSE Curriculum",
                            "description": "Comprehensive academic learning enriched by experiential pedagogy, language labs, and moral grounding.",
                            "linkUrl": "/p/curriculum"
                        },
                        {
                            "id": "c2",
                            "badge": "Modern Infrastructure",
                            "title": "Advanced STEM & Sports",
                            "description": "State-of-the-art robotics studio, science laboratories, digital library, and multi-sport grounds.",
                            "linkUrl": "/p/infrastructure"
                        },
                        {
                            "id": "c3",
                            "badge": "Community Impact",
                            "title": "Get Involved & Mentorship",
                            "description": "Empower our students through the VIDYA MITR mentoring program, career workshops, and corporate visits.",
                            "linkUrl": "/p/get-involved"
                        }
                    ]
                }
            },
            {
                "id": "blk-quote",
                "type": "quote",
                "data": {
                    "text": "To educate a child is to turn walls into doors.",
                    "caption": "Marian Wright Edelman – The VIDYA School Ethos"
                }
            },
            {
                "id": "blk-buttons",
                "type": "button",
                "data": {
                    "align": "left",
                    "items": [
                        {
                            "id": "b1",
                            "text": "Explore Admissions",
                            "url": "/p/admission-process",
                            "variant": "default"
                        },
                        {
                            "id": "b2",
                            "text": "Get Involved",
                            "url": "/p/get-involved",
                            "variant": "outline"
                        },
                        {
                            "id": "b3",
                            "text": "Contact Us",
                            "url": "/p/contact",
                            "variant": "secondary"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "vision-and-mission",
        "title": "Vision & Mission",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Vision & Mission of The VIDYA School",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "At The VIDYA School, our foundational mission is to educate, empower, and transform young lives through holistic education, cutting-edge infrastructure, and moral grounding."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "vm1",
                            "badge": "Our Vision",
                            "title": "Educate, Empower & Transform",
                            "description": "To nurture a generation of empowered, socially responsible, and intellectually curious young leaders capable of thriving in India's emerging global knowledge economy.",
                            "linkUrl": "/p/about-vidyaschool"
                        },
                        {
                            "id": "vm2",
                            "badge": "Our Mission",
                            "title": "Equal Opportunities for All",
                            "description": "To provide equal access to world-class English-medium education, digital literacy, life skills, and character building for children from underprivileged backgrounds.",
                            "linkUrl": "/p/about-vidyaschool"
                        },
                        {
                            "id": "vm3",
                            "badge": "Core Values",
                            "title": "Integrity, Empathy & Excellence",
                            "description": "Fostering academic curiosity, moral leadership, resilient spirit, gender equality, and lifelong civic responsibility.",
                            "linkUrl": "/p/student-life"
                        }
                    ]
                }
            },
            {
                "id": "blk-quote",
                "type": "quote",
                "data": {
                    "text": "The difference between who you are and who you want to be is what you do.",
                    "caption": "The VIDYA Guiding Principle"
                }
            },
            {
                "id": "blk-list",
                "type": "list",
                "data": {
                    "style": "unordered",
                    "items": [
                        "Deliver high-standard CBSE education with complete learning resources provided to all students.",
                        "Equip every learner with modern STEM, robotics, computer science, and English conversational fluency.",
                        "Foster vibrant artistic expression through classical music, fine arts, and physical education.",
                        "Engage institutional partners and mentors to bridge the digital and corporate opportunities divide."
                    ]
                }
            }
        ]
    },
    {
        "slug": "leadership",
        "title": "Leadership & Governance",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "School Leadership & Governance",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "The VIDYA School operates under the visionary guidance of experienced educators, community leaders, and institutional trustees committed to transparency, excellence, and social equity."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "lead-1",
                            "badge": "Governance",
                            "title": "Board of Trustees & Patrons",
                            "description": "Guiding institutional strategy, educational outreach, regulatory compliance, and community partnerships.",
                            "linkUrl": "/p/school-management-committee"
                        },
                        {
                            "id": "lead-2",
                            "badge": "Academics",
                            "title": "Principal & Directorate",
                            "description": "Steering pedagogy, continuous professional teacher training, student mental wellness, and board exam preparation.",
                            "linkUrl": "/p/principals-message"
                        },
                        {
                            "id": "lead-3",
                            "badge": "Operations",
                            "title": "Administration & Staff",
                            "description": "Ensuring campus safety, health and nutrition programs, infrastructure maintenance, and parent relations.",
                            "linkUrl": "/p/faculty-details"
                        }
                    ]
                }
            },
            {
                "id": "blk-btn",
                "type": "button",
                "data": {
                    "align": "left",
                    "items": [
                        {
                            "id": "b1",
                            "text": "School Management Committee",
                            "url": "/p/school-management-committee",
                            "variant": "default"
                        },
                        {
                            "id": "b2",
                            "text": "Principal's Message",
                            "url": "/p/principals-message",
                            "variant": "outline"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "subjects",
        "title": "Academic Subjects",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Academic Subjects & Curriculum Disciplines",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "The VIDYA School offers a comprehensive array of core and elective subjects aligned with the Central Board of Secondary Education (CBSE) and the National Education Policy (NEP)."
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Grade Level", "Core Academic Subjects", "Skill & Co-Curricular Subjects", "Assessment Scheme"],
                        ["Primary (Grades I - V)", "English, Hindi, Mathematics, Environmental Studies (EVS)", "Computer Basics, Visual Arts, Music, Physical Education", "Continuous & Comprehensive Evaluation (CCE)"],
                        ["Middle School (Grades VI - VIII)", "English, Hindi, Sanskrit, Mathematics, Integrated Science, Social Science", "Artificial Intelligence, Coding, Performing Arts, Yoga", "Term-End Summative & Formative Unit Tests"],
                        ["Secondary (Grades IX - X)", "English Communicative, Hindi Course-A, Mathematics Standard/Basic, Science, Social Science", "Information Technology, Financial Literacy, Health & Physical Education", "CBSE AISSE Board Examination & Internal Practicums"],
                        ["Senior Secondary (Grades XI - XII)", "Physics, Chemistry, Biology, Mathematics, Accountancy, Business Studies, Economics", "Computer Science, Applied Mathematics, Physical Education", "CBSE AISSCE Board Examinations & Laboratory Practicals"]
                    ]
                }
            },
            {
                "id": "blk-btn",
                "type": "button",
                "data": {
                    "align": "left",
                    "items": [
                        {
                            "id": "b1",
                            "text": "View Curriculum Overview",
                            "url": "/p/curriculum",
                            "variant": "default"
                        },
                        {
                            "id": "b2",
                            "text": "Download Syllabus",
                            "url": "/p/syllabus",
                            "variant": "outline"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "syllabus",
        "title": "Curriculum Syllabus",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Curriculum Syllabus & Unit Frameworks",
                    "level": 1
                }
            },
            {
                "id": "blk-alert",
                "type": "alert",
                "data": {
                    "title": "Academic Year 2025-2026 Syllabus",
                    "message": "All subject modules are aligned with the latest CBSE guidelines, NCERT core textbooks, and national competency-based learning standards.",
                    "variant": "warning"
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 2,
                    "items": [
                        {
                            "id": "syl-1",
                            "badge": "Foundational & Primary",
                            "title": "Classes I to V Syllabus",
                            "description": "Activity-centered learning focusing on foundational literacy, numeracy, storytelling, environmental observations, and motor skills.",
                            "linkUrl": "/p/subjects"
                        },
                        {
                            "id": "syl-2",
                            "badge": "Middle School",
                            "title": "Classes VI to VIII Syllabus",
                            "description": "Scientific inquiry, algebraic reasoning, historical civilizations, bilingual proficiency, and introductory coding.",
                            "linkUrl": "/p/subjects"
                        },
                        {
                            "id": "syl-3",
                            "badge": "Secondary",
                            "title": "Classes IX & X (AISSE) Syllabus",
                            "description": "Structured CBSE curriculum covering experimental science, mathematics, world history, geography, and digital applications.",
                            "linkUrl": "/p/examinations"
                        },
                        {
                            "id": "syl-4",
                            "badge": "Senior Secondary",
                            "title": "Classes XI & XII (AISSCE) Syllabus",
                            "description": "Specialized coursework in Science and Commerce streams preparing students for board exams and competitive university entrance tests.",
                            "linkUrl": "/p/examinations"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "textbooks",
        "title": "Prescribed Textbooks",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Prescribed Textbooks & Learning Materials",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "The VIDYA School prescribes authentic NCERT textbooks and authorized CBSE reference literature to ensure standardized, equitable, and top-tier learning materials."
                }
            },
            {
                "id": "blk-alert",
                "type": "alert",
                "data": {
                    "title": "CBSE Compliance Certification",
                    "message": "The school strictly adheres to CBSE directives regarding textbook prescription and prohibits unnecessary commercial books. All core books and learning kits are provided to enrolled students.",
                    "variant": "success"
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Class Band", "Official Publisher", "Core Subject Titles", "Provision Details"],
                        ["Primary (I - V)", "NCERT Publications", "Mridang, Marigold, Math-Magic, Looking Around (EVS)", "Provided free/subsidized with school stationery kits"],
                        ["Middle (VI - VIII)", "NCERT Publications", "Honeysuckle, Vasant, Mathematics, Science, Our Pasts", "Supplied through school book bank & digital library"],
                        ["Secondary (IX - X)", "NCERT Publications", "Beehive, Moments, Kshitij, Standard Mathematics, Science", "Issued from school resource center with lab manuals"],
                        ["Senior Secondary (XI - XII)", "NCERT / CBSE", "Physics, Chemistry, Biology, Accountancy, Economics", "Comprehensive library loan system and digital copies"]
                    ]
                }
            }
        ]
    },
    {
        "slug": "examinations",
        "title": "Examinations & Assessments",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Examinations, Assessments & Evaluations",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Our examination framework balances continuous formative feedback with standardized summative evaluations, nurturing critical thinking over rote memorization."
                }
            },
            {
                "id": "blk-stats",
                "type": "stats",
                "data": {
                    "stat": "100%",
                    "label": "CBSE Board Pass Rate",
                    "subtext": "Exemplary performance across Class X and Class XII examinations"
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "exam-1",
                            "badge": "Formative Reviews",
                            "title": "Periodic Tests (PT 1, 2, 3)",
                            "description": "Regular unit checks assessing student conceptual grasp, assignments, notebook upkeep, and subject enrichment.",
                            "linkUrl": "/p/academic-calendar"
                        },
                        {
                            "id": "exam-2",
                            "badge": "Summative Milestones",
                            "title": "Term-End Examinations",
                            "description": "Mid-term and annual comprehensive assessments formatted in full alignment with official CBSE question blueprints.",
                            "linkUrl": "/p/results"
                        },
                        {
                            "id": "exam-3",
                            "badge": "Board Simulation",
                            "title": "Pre-Board Assessments",
                            "description": "Three rigorous simulation cycles for board-appearing classes with personalized remedial clinics and answer analysis.",
                            "linkUrl": "/p/results"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "academic-calendar",
        "title": "Academic Calendar",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Academic Calendar 2025 - 2026",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Schedule of terms, examinations, vacations, sports meets, cultural fests, and parent-teacher consultations for the academic session."
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Month / Period", "Academic Milestones", "Examinations & Assessments", "Holidays & Observances"],
                        ["April - May 2025", "Session Commencement, Baseline Assessments, Earth Day", "Diagnostic Skill Tests", "Mahavir Jayanti, Good Friday, Summer Vacation"],
                        ["July - September 2025", "School Reopening, Science Fair, Independence Day", "Periodic Test 1, Mid-Term / Half-Yearly Exams", "Independence Day, Raksha Bandhan, Janmashtami"],
                        ["October - December 2025", "Annual Sports Championship, Vidya Tech Fest, Lit Fest", "Periodic Test 2, Practical Project Submissions", "Gandhi Jayanti, Dussehra, Diwali Break, Christmas"],
                        ["January - March 2026", "Republic Day Celebrations, Remedial Clinics, Pre-Boards", "Pre-Board II, Annual Final Exams, CBSE Board Exams", "Republic Day, Maha Shivratri, Holi"]
                    ]
                }
            }
        ]
    },
    {
        "slug": "results",
        "title": "Board Results & Academic Performance",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Board Examination Results & Academic Laurels",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Celebrating the stellar achievements and inspirational academic triumphs of VIDYA School scholars in the CBSE Board examinations."
                }
            },
            {
                "id": "blk-stats",
                "type": "stats",
                "data": {
                    "stat": "98.4%",
                    "label": "Top Class X Board Score",
                    "subtext": "100% first-division pass record in secondary board exams"
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "res-1",
                            "badge": "AISSE Class X",
                            "title": "100% Board Pass Percentage",
                            "description": "Consistent high distinctions with students scoring 90%+ in Mathematics, Science, and English.",
                            "linkUrl": "/p/achievements"
                        },
                        {
                            "id": "res-2",
                            "badge": "AISSCE Class XII",
                            "title": "Senior Secondary Success",
                            "description": "Scholars securing prestigious admissions in engineering, business administration, medical sciences, and arts.",
                            "linkUrl": "/p/achievements"
                        },
                        {
                            "id": "res-3",
                            "badge": "Higher Education",
                            "title": "College & Career Pathways",
                            "description": "Active scholarship placements and corporate internships supporting graduates through university degrees.",
                            "linkUrl": "/p/get-involved"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "laboratories",
        "title": "Laboratories & Research Facilities",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Modern Laboratories & Research Facilities",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Practical inquiry and scientific discovery are central to learning at The VIDYA School. We maintain advanced, fully compliant laboratories."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 2,
                    "items": [
                        {
                            "id": "lab-1",
                            "badge": "Physical Sciences",
                            "title": "Physics Laboratory",
                            "description": "Equipped with precision optical benches, electronic meters, resonance apparatus, and mechanics kits meeting CBSE practical specifications.",
                            "linkUrl": "/p/infrastructure"
                        },
                        {
                            "id": "lab-2",
                            "badge": "Chemical Sciences",
                            "title": "Chemistry Laboratory",
                            "description": "Features modern fume hoods, chemical storage, digital titration instruments, fire retardant benches, and safety showers.",
                            "linkUrl": "/p/infrastructure"
                        },
                        {
                            "id": "lab-3",
                            "badge": "Life Sciences",
                            "title": "Biology Laboratory",
                            "description": "High-powered binocular microscopes, extensive human anatomy models, botanical specimens, and ecological testing kits.",
                            "linkUrl": "/p/infrastructure"
                        },
                        {
                            "id": "lab-4",
                            "badge": "Digital Computing",
                            "title": "Computer & IT Center",
                            "description": "High-speed networked terminals, fiber-optic internet, licensed programming environments, and digital audio-visual suites.",
                            "linkUrl": "/p/stem"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "library",
        "title": "Library & Learning Resource Centre",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Library & Learning Resource Centre",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "A sanctuary of knowledge fostering reading habits, research acumen, and curiosity with a curated collection of literature, periodicals, and digital media."
                }
            },
            {
                "id": "blk-stats",
                "type": "stats",
                "data": {
                    "stat": "10,000+",
                    "label": "Books & Literary Volumes",
                    "subtext": "Spanning fiction, science, history, encyclopedias, and regional literature"
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "lib-1",
                            "badge": "Book Stacks",
                            "title": "Comprehensive Catalog",
                            "description": "Extensive multilingual collection in English, Hindi, and Sanskrit covering classical literature, biographies, and STEM reference.",
                            "linkUrl": "/p/infrastructure"
                        },
                        {
                            "id": "lib-2",
                            "badge": "Digital Kiosk",
                            "title": "e-Learning & Research",
                            "description": "Computer terminals equipped with educational multimedia encyclopedias, CBSE reference papers, and online journals.",
                            "linkUrl": "/p/stem"
                        },
                        {
                            "id": "lib-3",
                            "badge": "Literary Circles",
                            "title": "Book Clubs & Story Hours",
                            "description": "Weekly reading circles, creative writing workshops, book reviews, and author guest lectures.",
                            "linkUrl": "/p/clubs"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "sports",
        "title": "Sports & Physical Education",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Sports, Athletics & Physical Education",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "At The VIDYA School, athletic training, physical vitality, and teamwork are fundamental pillars of holistic human development."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "sp-1",
                            "badge": "Outdoor Arena",
                            "title": "Outdoor Sports Complex",
                            "description": "Cricket training pitches, full-size football turf, regulation basketball court, volleyball arena, and running tracks.",
                            "linkUrl": "/p/infrastructure"
                        },
                        {
                            "id": "sp-2",
                            "badge": "Indoor Sports",
                            "title": "Indoor Games & Fitness",
                            "description": "Badminton courts, table tennis arenas, chess and carrom halls, and gymnastics practice facilities.",
                            "linkUrl": "/p/activities"
                        },
                        {
                            "id": "sp-3",
                            "badge": "Mind-Body Health",
                            "title": "Daily Yoga & Wellness",
                            "description": "Morning pranayama, yogic asanas, mental mindfulness conditioning, and annual sports championship meets.",
                            "linkUrl": "/p/student-life"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "arts-and-music",
        "title": "Arts, Dance & Music",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Arts, Dance & Music Academy",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Fostering boundless artistic expression, aesthetic sensibility, and cultural heritage through visual arts, Indian classical music, and theater."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "art-1",
                            "badge": "Fine Arts",
                            "title": "Visual Arts Studio",
                            "description": "Oil and acrylic painting, clay sculpting, sketching, digital illustration, and traditional Indian folk crafts.",
                            "linkUrl": "/p/activities"
                        },
                        {
                            "id": "art-2",
                            "badge": "Harmony",
                            "title": "Vocal & Instrumental Music",
                            "description": "Classical vocal training, harmonium, tabla, guitar, synthesizers, and school choir performances.",
                            "linkUrl": "/p/activities"
                        },
                        {
                            "id": "art-3",
                            "badge": "Expression",
                            "title": "Theater & Dance Studio",
                            "description": "Classical Kathak, contemporary dance, elocution, street plays (Nukkad Natak), and annual stage musicals.",
                            "linkUrl": "/p/events"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "stem",
        "title": "STEM & Robotics Innovation",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "STEM, Robotics & Innovation Hub",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Equipping children with hands-on 21st-century technological skills, design thinking, robotic automation, and problem solving."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "stem-1",
                            "badge": "Robotics Studio",
                            "title": "Lego & Micro-controller Arena",
                            "description": "Hands-on robotics kits, Arduino, Raspberry Pi, sensor integration, and autonomous obstacle navigation.",
                            "linkUrl": "/p/tech-fest"
                        },
                        {
                            "id": "stem-2",
                            "badge": "Software & AI",
                            "title": "Coding & Artificial Intelligence",
                            "description": "Visual block coding for primary students, progressing to Python, web engineering, and introductory AI models.",
                            "linkUrl": "/p/laboratories"
                        },
                        {
                            "id": "stem-3",
                            "badge": "Annual Fest",
                            "title": "Vidya Tech Fest",
                            "description": "Our flagship inter-school technology conclave hosting hackathons, tech exhibitions, and robotic tournaments.",
                            "linkUrl": "/p/tech-fest"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "student-life",
        "title": "Student Life at Vidya",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Vibrant Student Life at The VIDYA School",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "A warm, nurturing home where underprivileged children discover their dreams, build lifelong friendships, and prepare to lead society."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "life-1",
                            "badge": "Camaraderie",
                            "title": "The Four Houses",
                            "description": "Agni, Prithvi, Vayu, and Jal houses inspiring healthy teamwork, sportsmanship, and leadership across all grades.",
                            "linkUrl": "/p/clubs"
                        },
                        {
                            "id": "life-2",
                            "badge": "Health & Care",
                            "title": "Nutrition & Wellness",
                            "description": "Daily hygienic hot meals, pediatric check-ups, dental camps, eye check-ups, and clean RO drinking water systems.",
                            "linkUrl": "/p/infrastructure-details"
                        },
                        {
                            "id": "life-3",
                            "badge": "Student Voice",
                            "title": "Student Council & Leadership",
                            "description": "Head Boy, Head Girl, house captains, and prefects actively participating in school governance and peer mentorship.",
                            "linkUrl": "/p/leadership"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "achievements",
        "title": "Student Achievements & Honors",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Student Achievements & Academic Honors",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Recognizing the remarkable distinctions, competitive victories, and inspiring milestones earned by our brilliant scholars."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "ach-1",
                            "badge": "Olympiads",
                            "title": "National Science & Math Laurels",
                            "description": "Gold and silver medals in National Cyber Olympiad, Science Olympiad Foundation, and inter-school academic bees.",
                            "linkUrl": "/p/results"
                        },
                        {
                            "id": "ach-2",
                            "badge": "Athletics",
                            "title": "District & State Sports Trophies",
                            "description": "Championship wins in inter-school football, athletics sprints, chess tournaments, and yoga competitions.",
                            "linkUrl": "/p/sports"
                        },
                        {
                            "id": "ach-3",
                            "badge": "Alumni",
                            "title": "Inspiring Higher Education Pathways",
                            "description": "Scholars securing admissions into reputed universities and technical academies across engineering, medicine, and management.",
                            "linkUrl": "/p/get-involved"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "clubs",
        "title": "Student Clubs & Societies",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Student Clubs & Societies",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Clubs at The VIDYA School provide collaborative spaces for students to cultivate special passions, teamwork, and creative ideas."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 2,
                    "items": [
                        {
                            "id": "cl-1",
                            "badge": "Technology",
                            "title": "Robotics & Makers Club",
                            "description": "Weekly hands-on circuit assembly, robot programming, 3D modelling, and preparing for national robotics contests.",
                            "linkUrl": "/p/stem"
                        },
                        {
                            "id": "cl-2",
                            "badge": "Sustainability",
                            "title": "Eco & Green Crusaders Club",
                            "description": "Tree plantation drives, waste segregation, solar energy awareness, plastic-free campaigns, and school herb garden care.",
                            "linkUrl": "/p/activities"
                        },
                        {
                            "id": "cl-3",
                            "badge": "Elocution",
                            "title": "Literary & Debating Society",
                            "description": "Bilingual debates, Model United Nations simulations, creative writing, poetry recitations, and the Vidya Vaani newsletter.",
                            "linkUrl": "/p/activities"
                        },
                        {
                            "id": "cl-4",
                            "badge": "Aesthetics",
                            "title": "Arts & Cultural Guild",
                            "description": "Traditional handicrafts, theater drama, street plays, classical music, and preparing for the Vidya Lit Fest.",
                            "linkUrl": "/p/arts-and-music"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "activities",
        "title": "Co-Curricular Activities",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Co-Curricular & Extra-Curricular Activities",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Education extends far beyond textbooks. We offer a rich spectrum of experiential learning, field excursions, and cultural events."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "act-1",
                            "badge": "Exploration",
                            "title": "Educational Excursions",
                            "description": "Visits to the National Science Centre, Nehru Planetarium, National Museum of Natural History, and Sultanpur National Park.",
                            "linkUrl": "/p/get-involved"
                        },
                        {
                            "id": "act-2",
                            "badge": "Industry Insight",
                            "title": "Corporate Office Visits",
                            "description": "Guided 2-3 hour exposure visits to leading corporate offices, inspiring students about modern career opportunities.",
                            "linkUrl": "/p/get-involved"
                        },
                        {
                            "id": "act-3",
                            "badge": "Traditions",
                            "title": "Cultural Celebrations",
                            "description": "Grand celebrations for Independence Day, Republic Day, Diwali, Christmas, Teacher's Day, and Earth Day.",
                            "linkUrl": "/p/events"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "admission-process",
        "title": "Admission Process",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Admission Process & Guidelines",
                    "level": 1
                }
            },
            {
                "id": "blk-alert",
                "type": "alert",
                "data": {
                    "title": "Admissions Open for Academic Session",
                    "message": "The VIDYA School welcomes applications for underprivileged children seeking quality English-medium CBSE education. Application forms can be downloaded online or collected at the school office.",
                    "variant": "warning"
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Admission Step", "Procedure Description", "Key Documentation Required", "Timeline"],
                        ["Step 1: Application Form", "Fill online registration form or collect paper form from school reception", "Child Birth Certificate, 4 Passport Photos", "December – February"],
                        ["Step 2: Document Verification", "Verification of residence and family income affidavit", "Aadhaar Card, Proof of Residence, Income Certificate", "February – March"],
                        ["Step 3: Interaction", "Friendly informal interaction with child and parents to evaluate grade placement", "Previous School Progress Report / TC (if applicable)", "March"],
                        ["Step 4: Orientation & Kit", "Welcome orientation, distribution of textbooks, uniform, and school kit", "Signed parent commitment form", "First week of April"]
                    ]
                }
            },
            {
                "id": "blk-btn",
                "type": "button",
                "data": {
                    "align": "left",
                    "items": [
                        {
                            "id": "b1",
                            "text": "Check Eligibility Criteria",
                            "url": "/p/eligibility",
                            "variant": "default"
                        },
                        {
                            "id": "b2",
                            "text": "Fee Structure & Scholarships",
                            "url": "/p/fee-structure",
                            "variant": "outline"
                        },
                        {
                            "id": "b3",
                            "text": "Admission FAQs",
                            "url": "/p/faqs",
                            "variant": "secondary"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "eligibility",
        "title": "Admission Eligibility Criteria",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Admission Eligibility Criteria & Age Guidelines",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Criteria and minimum age requirements as prescribed by the Directorate of Education and CBSE for entry into various classes."
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Grade Level", "Minimum Age (as of March 31)", "Academic Prerequisites", "Class Section Size"],
                        ["Nursery / Balvatika", "3 Years to 4 Years", "Foundational physical & communicative readiness", "25 - 30 Students"],
                        ["Kindergarten (KG)", "4 Years to 5 Years", "Basic pre-literacy and pre-numeracy familiarity", "30 Students"],
                        ["Class I", "5 Years to 6 Years", "Foundational literacy & basic cognitive readiness", "35 Students"],
                        ["Classes II – VIII", "Age-appropriate (6+ to 13+)", "Passing marks in previous grade from recognized school", "35 - 40 Students"],
                        ["Classes IX – XI", "14+ Years", "CBSE / State Board passing report card and TC", "35 - 40 Students"]
                    ]
                }
            }
        ]
    },
    {
        "slug": "fee-structure",
        "title": "Fee Structure & Scholarships (2025-26)",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Fee Structure for the Academic Year 2025-26",
                    "level": 1
                }
            },
            {
                "id": "blk-intro",
                "type": "paragraph",
                "data": {
                    "text": "Official fee schedule approved for <strong>The VIDYA School, Gurugram</strong> (Notification dated 17.03.2025). As a premier CBSE-affiliated school dedicated to providing quality English-medium education to children from underprivileged backgrounds, fees are heavily subsidized, transparent, and strictly compliant with Haryana Government norms and CBSE affiliation bylaws."
                }
            },
            {
                "id": "blk-alert-zero",
                "type": "alert",
                "data": {
                    "title": "Zero Capitation Policy & 100% Refundable Caution Deposit",
                    "message": "The VIDYA School strictly prohibits capitation fees, donations, or any hidden levies. A nominal one-time caution money of \u20b9750 is collected at the time of admission and is 100% refundable upon student clearance. Deserving students and those from economically weaker sections are supported through full scholarships and philanthropic partnerships.",
                    "variant": "success"
                }
            },
            {
                "id": "blk-quick-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "card-adm",
                            "badge": "One-Time at Admission",
                            "title": "Admission & Caution Money",
                            "description": "Total \u20b9950 across all grades (\u20b9200 Admission Fee + \u20b9750 100% Refundable Caution Deposit).",
                            "linkUrl": "/p/admission-process"
                        },
                        {
                            "id": "card-annual",
                            "badge": "Annual Development",
                            "title": "Annual Statutory Charges",
                            "description": "\u20b9600 School Development Charges plus statutory Haryana Govt Sports, Red Cross, & Welfare funds.",
                            "linkUrl": "/p/admission-process"
                        },
                        {
                            "id": "card-monthly",
                            "badge": "Monthly Subsidized Fee",
                            "title": "From \u20b9565 to \u20b91,355 / Month",
                            "description": "Nominal monthly charges inclusive of Tuition, Computer & Smart Class, Activities, Labs, and Sports.",
                            "linkUrl": "/p/get-involved"
                        }
                    ]
                }
            },
            {
                "id": "blk-h2-table",
                "type": "header",
                "data": {
                    "text": "Official Fee Breakdown (Session 2025-26)",
                    "level": 2
                }
            },
            {
                "id": "blk-table-p",
                "type": "paragraph",
                "data": {
                    "text": "The table below reflects the approved fee structure notified on 17.03.2025 for The VIDYA School, Sector 24, DLF Phase-3, Gurugram:"
                }
            },
            {
                "id": "blk-fee-table",
                "type": "table",
                "data": {
                    "withHeadings": true,
                    "content": [
                        [
                            "S.No",
                            "Particulars",
                            "Fee Class<br>Nurs & KG",
                            "Fee Class<br>I to V",
                            "Fee Class<br>VI to VIII",
                            "Fee Class<br>IX & X",
                            "Fee Class XI & XII<br><span class=\"text-[11px] font-normal text-muted-foreground\">(Arts & Commerce)</span>",
                            "Fee Class XI & XII<br><span class=\"text-[11px] font-normal text-muted-foreground\">(Science Stream)</span>"
                        ],
                        [
                            "<b>1</b>",
                            "<b>At the time of Admission only</b>",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014"
                        ],
                        [
                            "i",
                            "Admission Fee",
                            "\u20b9200",
                            "\u20b9200",
                            "\u20b9200",
                            "\u20b9200",
                            "\u20b9200",
                            "\u20b9200"
                        ],
                        [
                            "ii",
                            "Caution Money (Refundable)",
                            "\u20b9750",
                            "\u20b9750",
                            "\u20b9750",
                            "\u20b9750",
                            "\u20b9750",
                            "\u20b9750"
                        ],
                        [
                            "",
                            "<b>Total (At Admission Only)</b>",
                            "<b>\u20b9950</b>",
                            "<b>\u20b9950</b>",
                            "<b>\u20b9950</b>",
                            "<b>\u20b9950</b>",
                            "<b>\u20b9950</b>",
                            "<b>\u20b9950</b>"
                        ],
                        [
                            "<b>2</b>",
                            "<b>Once in a year (Annual Charges)</b>",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014"
                        ],
                        [
                            "i",
                            "School Development Charges",
                            "\u20b9600",
                            "\u20b9600",
                            "\u20b9600",
                            "\u20b9600",
                            "\u20b9600",
                            "\u20b9600"
                        ],
                        [
                            "ii",
                            "Haryana Govt Sports Fund",
                            "\u2014",
                            "\u2014",
                            "\u20b910",
                            "\u2014",
                            "\u2014",
                            "\u2014"
                        ],
                        [
                            "iii",
                            "Haryana Govt Red Cross Fund",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u20b945",
                            "\u20b945",
                            "\u20b945"
                        ],
                        [
                            "iv",
                            "Haryana Govt Children Welfare Fund",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u20b936",
                            "\u20b936",
                            "\u20b936"
                        ],
                        [
                            "",
                            "<b>Total (Once in a Year)</b>",
                            "<b>\u20b9600</b>",
                            "<b>\u20b9600</b>",
                            "<b>\u20b9610</b>",
                            "<b>\u20b9681</b>",
                            "<b>\u20b9681</b>",
                            "<b>\u20b9681</b>"
                        ],
                        [
                            "<b>3</b>",
                            "<b>Monthly Charges</b>",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014"
                        ],
                        [
                            "i",
                            "Tuition Fee",
                            "\u20b9365",
                            "\u20b9340",
                            "\u20b9350",
                            "\u20b9325",
                            "\u20b9880",
                            "\u20b9880"
                        ],
                        [
                            "ii",
                            "Computer & Smart Class Charges",
                            "\u20b950",
                            "\u20b9100",
                            "\u20b9100",
                            "\u20b9100",
                            "\u20b9100",
                            "\u20b9100"
                        ],
                        [
                            "iii",
                            "Activity Charges",
                            "\u20b9100",
                            "\u20b9100",
                            "\u20b9100",
                            "\u20b9100",
                            "\u20b9100",
                            "\u20b9100"
                        ],
                        [
                            "iv",
                            "Lab Charges",
                            "\u2014",
                            "\u2014",
                            "\u20b9100",
                            "\u20b9100",
                            "\u20b9100",
                            "\u20b9100"
                        ],
                        [
                            "v",
                            "Sports Charges",
                            "\u20b950",
                            "\u20b950",
                            "\u20b950",
                            "\u20b950",
                            "\u20b9100",
                            "\u20b9100"
                        ],
                        [
                            "vi",
                            "Haryana Govt Sports Fund",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u20b925",
                            "\u20b960",
                            "\u20b975"
                        ],
                        [
                            "",
                            "<b>Total (Monthly Charges)</b>",
                            "<b>\u20b9565</b>",
                            "<b>\u20b9590</b>",
                            "<b>\u20b9700</b>",
                            "<b>\u20b9700</b>",
                            "<b>\u20b91,340</b>",
                            "<b>\u20b91,355</b>"
                        ],
                        [
                            "<b>4</b>",
                            "<b>Optional Facility Charges</b>",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014",
                            "\u2014"
                        ],
                        [
                            "vii",
                            "Transport Charges <span class=\"text-xs text-muted-foreground font-normal\">(Only for those who are using the Bus)</span>",
                            "\u20b91,000",
                            "\u20b91,000",
                            "\u20b91,000",
                            "\u20b91,000",
                            "\u20b91,000",
                            "\u20b91,000"
                        ]
                    ]
                }
            },
            {
                "id": "blk-sep1",
                "type": "delimiter",
                "data": {}
            },
            {
                "id": "blk-h2-summary",
                "type": "header",
                "data": {
                    "text": "Grade-by-Grade Fee Summary",
                    "level": 2
                }
            },
            {
                "id": "blk-p-summary",
                "type": "paragraph",
                "data": {
                    "text": "Summary of one-time admission, annual composite charges, and monthly commitments per grade band:"
                }
            },
            {
                "id": "blk-grade-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "g-nursery",
                            "badge": "Pre-Primary",
                            "title": "Nursery & KG",
                            "description": "\u2022 At Admission: \u20b9950 (\u20b9750 refundable caution)<br>\u2022 Annual Charges: \u20b9600 / year<br>\u2022 Monthly Charges: \u20b9565 / month (Tuition \u20b9365, Computer \u20b950, Activities \u20b9100, Sports \u20b950)<br>\u2022 Bus Transport (Optional): \u20b91,000 / month",
                            "linkUrl": "/p/admission-process"
                        },
                        {
                            "id": "g-primary",
                            "badge": "Primary Wing",
                            "title": "Classes I to V",
                            "description": "\u2022 At Admission: \u20b9950 (\u20b9750 refundable caution)<br>\u2022 Annual Charges: \u20b9600 / year<br>\u2022 Monthly Charges: \u20b9590 / month (Tuition \u20b9340, Computer \u20b9100, Activities \u20b9100, Sports \u20b950)<br>\u2022 Bus Transport (Optional): \u20b91,000 / month",
                            "linkUrl": "/p/admission-process"
                        },
                        {
                            "id": "g-middle",
                            "badge": "Middle Wing",
                            "title": "Classes VI to VIII",
                            "description": "\u2022 At Admission: \u20b9950 (\u20b9750 refundable caution)<br>\u2022 Annual Charges: \u20b9610 / year (includes \u20b910 Sports Fund)<br>\u2022 Monthly Charges: \u20b9700 / month (Tuition \u20b9350, Computer \u20b9100, Activities \u20b9100, Labs \u20b9100, Sports \u20b950)<br>\u2022 Bus Transport (Optional): \u20b91,000 / month",
                            "linkUrl": "/p/admission-process"
                        },
                        {
                            "id": "g-secondary",
                            "badge": "Secondary Wing",
                            "title": "Classes IX & X",
                            "description": "\u2022 At Admission: \u20b9950 (\u20b9750 refundable caution)<br>\u2022 Annual Charges: \u20b9681 / year (includes Red Cross \u20b945 & Welfare \u20b936)<br>\u2022 Monthly Charges: \u20b9700 / month (Tuition \u20b9325, Smart Class \u20b9100, Activities \u20b9100, Labs \u20b9100, Sports \u20b950, Sports Fund \u20b925)<br>\u2022 Bus Transport (Optional): \u20b91,000 / month",
                            "linkUrl": "/p/admission-process"
                        },
                        {
                            "id": "g-senior-arts-comm",
                            "badge": "Senior Secondary",
                            "title": "Classes XI & XII (Arts & Commerce)",
                            "description": "\u2022 At Admission: \u20b9950 (\u20b9750 refundable caution)<br>\u2022 Annual Charges: \u20b9681 / year<br>\u2022 Monthly Charges: \u20b91,340 / month (Tuition \u20b9880, Smart Class \u20b9100, Activities \u20b9100, Labs \u20b9100, Sports \u20b9100, Sports Fund \u20b960)<br>\u2022 Bus Transport (Optional): \u20b91,000 / month",
                            "linkUrl": "/p/admission-process"
                        },
                        {
                            "id": "g-senior-sci",
                            "badge": "Senior Secondary",
                            "title": "Classes XI & XII (Science Stream)",
                            "description": "\u2022 At Admission: \u20b9950 (\u20b9750 refundable caution)<br>\u2022 Annual Charges: \u20b9681 / year<br>\u2022 Monthly Charges: \u20b91,355 / month (Tuition \u20b9880, Smart Class \u20b9100, Activities \u20b9100, Labs \u20b9100, Sports \u20b9100, Sports Fund \u20b975)<br>\u2022 Bus Transport (Optional): \u20b91,000 / month",
                            "linkUrl": "/p/admission-process"
                        }
                    ]
                }
            },
            {
                "id": "blk-sep2",
                "type": "delimiter",
                "data": {}
            },
            {
                "id": "blk-h2-doc",
                "type": "header",
                "data": {
                    "text": "Official Notification Circular (PDF)",
                    "level": 2
                }
            },
            {
                "id": "blk-p-doc",
                "type": "paragraph",
                "data": {
                    "text": "Download or preview the official signed circular approved for VIDYA SCHOOL GURGAON:"
                }
            },
            {
                "id": "blk-pdf",
                "type": "pdf",
                "data": {
                    "title": "Official Fee Structure 2025-26 Circular (VIDYA SCHOOL GURGAON)",
                    "fileSize": "Official Notification (Signed & Approved 17.03.2025)",
                    "url": "/docs/Fee-Structure-2025-26.pdf"
                }
            },
            {
                "id": "blk-btns",
                "type": "button",
                "data": {
                    "align": "left",
                    "items": [
                        {
                            "id": "b-dl",
                            "text": "Download Official PDF",
                            "url": "/docs/Fee-Structure-2025-26.pdf",
                            "variant": "default"
                        },
                        {
                            "id": "b-orig",
                            "text": "View on Vidyaschool.com",
                            "url": "https://www.vidyaschool.com/wp-content/uploads/2026/01/Fee-Structure-2025-26.pdf",
                            "variant": "outline"
                        },
                        {
                            "id": "b-adm",
                            "text": "Admission Guidelines",
                            "url": "/p/admission-process",
                            "variant": "secondary"
                        }
                    ]
                }
            },
            {
                "id": "blk-h3-reg",
                "type": "header",
                "data": {
                    "text": "Important Regulations & Fee Policies",
                    "level": 3
                }
            },
            {
                "id": "blk-list-reg",
                "type": "list",
                "data": {
                    "style": "unordered",
                    "items": [
                        "<b>Refundable Caution Deposit:</b> The Caution Money of \u20b9750 collected at the time of admission is fully refundable when a pupil leaves the school, upon presentation of the original caution deposit receipt and complete clearance of all institutional dues.",
                        "<b>School Development Charges:</b> Annual development charges of \u20b9600 are levied once per academic year towards maintaining digital smart classrooms, laboratories, libraries, and campus facilities.",
                        "<b>Statutory Government Levies:</b> Haryana Govt Sports Fund, Red Cross Fund, and Children Welfare Fund are statutory collections remitted strictly to state authorities in compliance with Haryana Education rules.",
                        "<b>Optional Transport:</b> School bus transport is strictly optional and billed at \u20b91,000 per month only for students utilizing the designated bus routes.",
                        "<b>Fee Remittance Schedule:</b> Monthly contributions must be remitted by the 10th of every calendar month through the online payment portal or at the school accounts desk.",
                        "<b>100% Scholarships & Subsidies:</b> Deserving students and children facing extreme economic hardship are eligible for full tuition fee waivers, book sets, uniforms, and mid-day meal sponsorship through VIDYA's philanthropic donor network."
                    ]
                }
            }
        ]
    },
    {
        "slug": "faqs",
        "title": "Frequently Asked Questions (FAQs)",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Frequently Asked Questions (FAQs)",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Common questions regarding admissions, curriculum, academic support, school timings, and student facilities at The VIDYA School."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 2,
                    "items": [
                        {
                            "id": "faq-1",
                            "badge": "Affiliation",
                            "title": "What board is The VIDYA School affiliated with?",
                            "description": "The VIDYA School is fully affiliated with the Central Board of Secondary Education (CBSE), New Delhi, following the national NCERT curriculum framework up to Senior Secondary level.",
                            "linkUrl": "/p/affiliation"
                        },
                        {
                            "id": "faq-2",
                            "badge": "Timings",
                            "title": "What are the daily school operating hours?",
                            "description": "Primary Classes (I - V): 8:00 AM – 1:30 PM. Secondary & Senior Secondary: 8:00 AM – 2:30 PM. Remedial clinics and specialized sports clubs operate until 4:00 PM.",
                            "linkUrl": "/p/academic-calendar"
                        },
                        {
                            "id": "faq-3",
                            "badge": "Transport",
                            "title": "Does the school provide transportation?",
                            "description": "Yes, safe school buses and vans operate across designated routes covering communities in Sector 24, DLF Phase-3, Nathupur, and neighboring Delhi NCR borders.",
                            "linkUrl": "/p/contact"
                        },
                        {
                            "id": "faq-4",
                            "badge": "Mentorship",
                            "title": "How can volunteers get involved?",
                            "description": "Volunteers and corporate professionals can join the VIDYA MITR mentoring program, conduct workshops in STEM, career counseling, or sponsor student educational needs.",
                            "linkUrl": "/p/get-involved"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "teachers-and-staff",
        "title": "Teachers & Staff Faculty",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Teachers, Educators & Administrative Faculty",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Our dedicated educators are passionate mentors committed to unlocking the potential of every child through empathy, patience, and pedagogical excellence."
                }
            },
            {
                "id": "blk-stats",
                "type": "stats",
                "data": {
                    "stat": "60+",
                    "label": "Qualified Teachers & Coaches",
                    "subtext": "1:20 teacher-student ratio providing focused individual mentorship"
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "fac-1",
                            "badge": "Academics",
                            "title": "Subject Master Teachers",
                            "description": "Post-graduate, B.Ed. certified masters in Mathematics, Sciences, Social Studies, English, and Hindi.",
                            "linkUrl": "/p/faculty-details"
                        },
                        {
                            "id": "fac-2",
                            "badge": "Technology & STEM",
                            "title": "Computer & Robotics Mentors",
                            "description": "Specialized instructors leading computer programming, electronics, robotics competitions, and digital literacy.",
                            "linkUrl": "/p/stem"
                        },
                        {
                            "id": "fac-3",
                            "badge": "Holistic Development",
                            "title": "Counselors & Coaches",
                            "description": "Certified child psychologists, special educators, music masters, fine arts trainers, and sports coaches.",
                            "linkUrl": "/p/faculty-details"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "notices",
        "title": "School Notices & Circulars",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Official School Notices & Bulletin",
                    "level": 1
                }
            },
            {
                "id": "blk-alert",
                "type": "alert",
                "data": {
                    "title": "Academic Session Notification",
                    "message": "Classes are operating according to standard seasonal schedules. Parents and students are requested to review notice boards and portals regularly for circulars and calendar updates.",
                    "variant": "warning"
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "not-1",
                            "badge": "Examinations",
                            "title": "CBSE Board Examination Registration",
                            "description": "Verification of list of candidates (LOC) and subject confirmation for Class X and Class XII candidates.",
                            "linkUrl": "/p/examinations"
                        },
                        {
                            "id": "not-2",
                            "badge": "Athletics",
                            "title": "Annual Sports Day Trials",
                            "description": "House trials for track events, relay sprints, cricket, and football begin on campus grounds next week.",
                            "linkUrl": "/p/sports"
                        },
                        {
                            "id": "not-3",
                            "badge": "PTM",
                            "title": "Parent-Teacher Interactive Meeting",
                            "description": "PTM scheduled for Saturday to discuss formative progress reports and individual learning plans.",
                            "linkUrl": "/p/pta"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "circulars",
        "title": "Administrative Circulars",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Administrative & Academic Circulars",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Official directives, policies, and procedural guidelines issued by the School Directorate and CBSE."
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Date", "Circular Reference", "Subject Matter", "Authority"],
                        ["10 August 2025", "VS/ADM/2025/084", "Monsoon School Timings & Bus Safety Protocols", "Office of the Principal"],
                        ["22 September 2025", "VS/ACAD/2025/112", "Mid-Term Formative Evaluation Date Sheet & Syllabus", "Academic Committee"],
                        ["15 November 2025", "VS/EVT/2025/145", "Annual Day & Vidya Lit Fest Participation Guidelines", "Cultural Directorate"],
                        ["05 January 2026", "VS/CBSE/2026/009", "Pre-Board Examination Schedule & Board Admit Cards", "Examination Controller"]
                    ]
                }
            }
        ]
    },
    {
        "slug": "events",
        "title": "School Events & Celebrations",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "School Events, Festivals & Celebrations",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Celebrations at The VIDYA School nurture social unity, creative expression, national pride, and joyous community fellowship."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 2,
                    "items": [
                        {
                            "id": "ev-1",
                            "badge": "Innovation",
                            "title": "Vidya Tech Fest",
                            "description": "Our premier STEM innovation fest bringing together students from Delhi NCR for hackathons, science project exhibits, and robotics competitions.",
                            "linkUrl": "/p/tech-fest"
                        },
                        {
                            "id": "ev-2",
                            "badge": "Literature",
                            "title": "Vidya Lit Fest & Cultural Day",
                            "description": "Annual literary festival featuring elocution, poetry recitation, theatrical drama, storytelling, and book fairs.",
                            "linkUrl": "/p/arts-and-music"
                        },
                        {
                            "id": "ev-3",
                            "badge": "Patriotism",
                            "title": "National Holiday Celebrations",
                            "description": "Unfurling the tricolor on Independence Day and Republic Day with patriotic anthems, cultural parades, and student speeches.",
                            "linkUrl": "/p/get-involved"
                        },
                        {
                            "id": "ev-4",
                            "badge": "Festivals",
                            "title": "Diwali & Christmas Celebrations",
                            "description": "Lighting diyas, sharing sweets, singing Christmas carols, and hosting festive meals with mentors and supporters.",
                            "linkUrl": "/p/get-involved"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "announcements",
        "title": "Official Announcements",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Official School Announcements",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Key institutional news, recognitions, press statements, and milestone achievements of The VIDYA School."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "ann-1",
                            "badge": "Achievement",
                            "title": "CBSE Board Distinction Honors",
                            "description": "Class X and Class XII scholars record 100% pass percentages with exceptional distinctions in mathematics and science.",
                            "linkUrl": "/p/results"
                        },
                        {
                            "id": "ann-2",
                            "badge": "Campus Upgrade",
                            "title": "New Robotics Innovation Lab",
                            "description": "State-of-the-art STEM center equipped with micro-controllers and robotics suites inaugurated on campus.",
                            "linkUrl": "/p/stem"
                        },
                        {
                            "id": "ann-3",
                            "badge": "Partnership",
                            "title": "Corporate Mentorship Expansion",
                            "description": "Expanded VIDYA MITR mentoring cohort connecting senior students with corporate professionals and industry leaders.",
                            "linkUrl": "/p/get-involved"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "mandatory-public-disclosure",
        "title": "Mandatory Public Disclosure (CBSE)",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "CBSE Mandatory Public Disclosure (Appendix IX)",
                    "level": 1
                }
            },
            {
                "id": "blk-alert",
                "type": "alert",
                "data": {
                    "title": "Statutory Transparency Information",
                    "message": "In accordance with CBSE affiliation regulations and Appendix IX directives, complete certified documentation and institutional particulars of The VIDYA School are publicly accessible.",
                    "variant": "warning"
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Disclosure Parameter", "Institutional Particulars", "Verification Authority"],
                        ["Name of the School", "The VIDYA School", "VIDYA Integrated Development for Youth and Adults"],
                        ["Affiliation Status", "CBSE Affiliated Senior Secondary English Medium", "Central Board of Secondary Education, New Delhi"],
                        ["School Location & Address", "Plot No. 3126, Block S, Near St. Stephen's Hospital, DLF Phase-3, Sector 24, Gurugram 122002", "Government of Haryana"],
                        ["Principal Name & Qualifications", "Principal, Post Graduate, B.Ed., Experienced Administrator", "Recognized University"],
                        ["Official Contact Details", "info.vidyaschool@vidya-india.org | +91-8130672281", "Administrative Office"],
                        ["Campus Land Area", "Over 2.0 Acres / 8,000+ sq. meters with boundary wall", "Municipal Corporation of Gurugram (MCG)"]
                    ]
                }
            },
            {
                "id": "blk-btn",
                "type": "button",
                "data": {
                    "align": "left",
                    "items": [
                        {
                            "id": "b1",
                            "text": "School Management Committee (SMC)",
                            "url": "/p/school-management-committee",
                            "variant": "default"
                        },
                        {
                            "id": "b2",
                            "text": "Annual Report",
                            "url": "/p/annual-report",
                            "variant": "outline"
                        },
                        {
                            "id": "b3",
                            "text": "Certificates & Compliance",
                            "url": "/p/certificates",
                            "variant": "secondary"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "affiliation",
        "title": "CBSE Affiliation Status",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "CBSE Affiliation Status & Details",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "The VIDYA School is a recognized English-medium institution affiliated with the Central Board of Secondary Education (CBSE), New Delhi, up to Senior Secondary level."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "aff-1",
                            "badge": "Affiliation",
                            "title": "Senior Secondary Status",
                            "description": "Co-educational English-medium school following the national NCERT curriculum framework.",
                            "linkUrl": "/p/mandatory-public-disclosure"
                        },
                        {
                            "id": "aff-2",
                            "badge": "Curriculum",
                            "title": "NCERT & NEP Aligned",
                            "description": "Strict compliance with all National Education Policy and CBSE examination guidelines.",
                            "linkUrl": "/p/curriculum"
                        },
                        {
                            "id": "aff-3",
                            "badge": "Compliance",
                            "title": "Statutory Certifications",
                            "description": "Valid building safety, fire safety, health hygiene, and drinking water certificates.",
                            "linkUrl": "/p/certificates"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "certificates",
        "title": "School Certificates & Regulatory Compliance",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "School Certificates & Safety Approvals",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Certified compliances verifying structural safety, fire safety, water purity, sanitation, and governmental recognition."
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Certificate Name", "Issuing Government Authority", "Compliance Status", "Inspection Frequency"],
                        ["Building Safety Certificate", "Public Works Department (PWD) / Certified Structural Engineer", "Certified Structurally Sound & Safe", "Periodic Renewal"],
                        ["Fire Safety Certificate (NOC)", "Fire & Emergency Services, Haryana", "Compliant with hydrants, extinguishers, alarms", "Annual Audit Verified"],
                        ["Safe Drinking Water & Sanitation", "Public Health Engineering Department (PHED)", "RO filtration tested & hygienic facilities certified", "Annual Laboratory Test"],
                        ["Government Recognition (NOC)", "Directorate of School Education, Haryana", "Permanent recognition granted for Senior Secondary", "Perpetual Compliance"]
                    ]
                }
            }
        ]
    },
    {
        "slug": "pta",
        "title": "Parents Teachers Association (PTA)",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Parents Teachers Association (PTA)",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Building a close, collaborative bridge between families and teachers to champion the emotional, academic, and physical growth of every child."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "pta-1",
                            "badge": "Consultation",
                            "title": "Regular PTM Forums",
                            "description": "Structured parent-teacher meetings following every assessment cycle to celebrate progress and address support areas.",
                            "linkUrl": "/p/notices"
                        },
                        {
                            "id": "pta-2",
                            "badge": "Representation",
                            "title": "Parent Executive Committee",
                            "description": "Elected parent members providing insights on student welfare, nutrition, transport, and community events.",
                            "linkUrl": "/p/leadership"
                        },
                        {
                            "id": "pta-3",
                            "badge": "Empowerment",
                            "title": "Parent Literacy Workshops",
                            "description": "Community sessions on positive parenting, digital awareness, nutritional guidance, and health practices.",
                            "linkUrl": "/p/student-life"
                        }
                    ]
                }
            },
            {
                "id": "blk-quote",
                "type": "quote",
                "data": {
                    "text": "Education is a shared partnership between committed teachers, motivated students, and supportive parents.",
                    "caption": "VIDYA School PTA Philosophy"
                }
            }
        ]
    },
    {
        "slug": "faculty-details",
        "title": "Faculty Details (CBSE OASIS)",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Faculty Details & Teaching Staff (CBSE OASIS)",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Official disclosure of faculty qualifications, staff strength, and educator ratios in compliance with CBSE OASIS norms."
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Designation", "Total Staff", "Prescribed Qualification", "Compliance Status"],
                        ["Principal", "1", "Post Graduate, B.Ed. with 15+ years experience", "Fully Certified"],
                        ["Post Graduate Teachers (PGT)", "12", "Master's Degree in subject with B.Ed.", "Fully Certified"],
                        ["Trained Graduate Teachers (TGT)", "24", "Bachelor's / Master's with B.Ed. & CTET", "Fully Certified"],
                        ["Primary Teachers (PRT)", "18", "Graduation with B.Ed. / D.El.Ed.", "Fully Certified"],
                        ["Special Educator & Counselor", "2", "Post Graduate in Psychology / RCI Certified", "Fully Certified"],
                        ["Physical Education Coaches", "4", "B.P.Ed. / M.P.Ed. with National Sports Accreditations", "Fully Certified"]
                    ]
                }
            }
        ]
    },
    {
        "slug": "infrastructure-details",
        "title": "Infrastructure Details",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Campus Infrastructure & Safety Details",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "Detailed parameters of campus land, building safety, classroom dimensions, laboratories, sports grounds, and sanitation."
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Facility Parameter", "Dimensions / Capacity", "Specific Equipment & Features"],
                        ["Total Campus Area", "Over 2 Acres (8,000+ sq. m)", "Fenced boundary, gated security, emergency assembly areas"],
                        ["Digital Classrooms", "35+ Ventilated Rooms", "Interactive smart boards, ergonomic desks, ceiling fans, LED lighting"],
                        ["Science Laboratories", "Physics, Chem, Bio Labs", "Fully equipped CBSE apparatus, safety showers, fume chambers"],
                        ["Computer & STEM Lab", "2 Dedicated Tech Studios", "High-speed broadband, robotics kits, coding workstations"],
                        ["Central Library", "Over 10,000 Volumes", "Spacious reading room, reference encyclopedias, digital catalogue"],
                        ["Sports Fields", "Multi-Sport Complex", "Cricket pitches, football turf, basketball court, athletics track"],
                        ["Safety & Hygiene", "Full CCTV & RO Systems", "100% CCTV coverage, fire extinguishers, RO potable drinking water"]
                    ]
                }
            }
        ]
    },
    {
        "slug": "contact",
        "title": "Contact Us",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Contact The VIDYA School",
                    "level": 1
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "We welcome parents, partners, volunteers, and visitors. Please reach out to our school administrative office."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "cnt-1",
                            "badge": "Campus Location",
                            "title": "Gurugram Campus",
                            "description": "Plot No. 3126, Block S, Near St. Stephen's Hospital, DLF Phase-3, Sector 24, Gurugram, Haryana 122002 (Nathupur, Garden Estate 122010)",
                            "linkUrl": "#"
                        },
                        {
                            "id": "cnt-2",
                            "badge": "Direct Helpline",
                            "title": "Phone & Inquiries",
                            "description": "+91-8130672281 (School Office Hours: Monday to Saturday, 8:00 AM – 3:30 PM)",
                            "linkUrl": "tel:+918130672281"
                        },
                        {
                            "id": "cnt-3",
                            "badge": "Email & Web",
                            "title": "Official Inquiries",
                            "description": "info.vidyaschool@vidya-india.org | Official Pan-India Website: www.vidya-india.org",
                            "linkUrl": "mailto:info.vidyaschool@vidya-india.org"
                        }
                    ]
                }
            },
            {
                "id": "blk-alert",
                "type": "alert",
                "data": {
                    "title": "Campus Visitor Timings",
                    "message": "Visitors and prospective parents are welcome between 9:00 AM and 1:00 PM on working school days with prior appointment.",
                    "variant": "default"
                }
            },
            {
                "id": "blk-btn",
                "type": "button",
                "data": {
                    "align": "left",
                    "items": [
                        {
                            "id": "b1",
                            "text": "Admissions Information",
                            "url": "/p/admission-process",
                            "variant": "default"
                        },
                        {
                            "id": "b2",
                            "text": "Get Involved as Volunteer",
                            "url": "/p/get-involved",
                            "variant": "outline"
                        }
                    ]
                }
            }
        ]
    },
    {
        "slug": "get-involved",
        "title": "Get Involved – Volunteering & Mentorship",
        "blocks": [
            {
                "id": "blk-h1",
                "type": "header",
                "data": {
                    "text": "Get Involved – Volunteering & Mentorship",
                    "level": 1
                }
            },
            {
                "id": "blk-alert",
                "type": "alert",
                "data": {
                    "title": "Be the Guiding Star",
                    "message": "Your knowledge, time, and empathy can change a child's destiny. Partner with The VIDYA School to mentor, teach, and inspire our students.",
                    "variant": "success"
                }
            },
            {
                "id": "blk-p1",
                "type": "paragraph",
                "data": {
                    "text": "The VIDYA School invites volunteers, educators, and corporate partners to engage with our students through mentorship, workshops, cultural celebrations, and skill-building programs."
                }
            },
            {
                "id": "blk-cards",
                "type": "card",
                "data": {
                    "columns": 3,
                    "items": [
                        {
                            "id": "gi-1",
                            "badge": "Mentorship",
                            "title": "VIDYA MITR Program",
                            "description": "A structured buddying program pairing mentors with students to build confidence, career goals, and communication skills.",
                            "linkUrl": "/p/contact"
                        },
                        {
                            "id": "gi-2",
                            "badge": "Curriculum Plus",
                            "title": "Beyond Curriculum Learning",
                            "description": "Conduct sessions demystifying Science wonders, Mathematics tricks, Cybersecurity, and English conversational fluency.",
                            "linkUrl": "/p/stem"
                        },
                        {
                            "id": "gi-3",
                            "badge": "Workplace Exposure",
                            "title": "Corporate Office Inductions",
                            "description": "Host a 2-3 hour workplace visit where professionals show students modern office workflows and career horizons.",
                            "linkUrl": "/p/contact"
                        },
                        {
                            "id": "gi-4",
                            "badge": "Festivals",
                            "title": "Festival Celebrations",
                            "description": "Light Diyas together at Diwali, sing carols at Christmas, and unfurl the tricolor on Independence Day with our students.",
                            "linkUrl": "/p/events"
                        },
                        {
                            "id": "gi-5",
                            "badge": "Athletics",
                            "title": "Friendly Sports Matches",
                            "description": "Play a football or cricket match against our students or conduct coaching clinics on school sports day.",
                            "linkUrl": "/p/sports"
                        },
                        {
                            "id": "gi-6",
                            "badge": "Arts & Stories",
                            "title": "Workshops & Storytelling",
                            "description": "Conduct week-long music, dance, or theater workshops, or narrate inspirational stories in the classroom.",
                            "linkUrl": "/p/arts-and-music"
                        }
                    ]
                }
            },
            {
                "id": "blk-quote",
                "type": "quote",
                "data": {
                    "text": "The MITR program is a mentoring/buddying program that endeavors to use the knowledge and experience of mentors to bring out the true potential of VIDYA students.",
                    "caption": "VIDYA School Volunteer Network"
                }
            },
            {
                "id": "blk-table",
                "type": "table",
                "data": {
                    "withHeadings": True,
                    "content": [
                        ["Volunteering Program", "Activity Scope & Description", "Engagement Mode"],
                        ["VIDYA MITR Mentoring", "Mentoring secondary students on personal development and career choices", "Weekly / Bi-weekly in person or online"],
                        ["Beyond Curriculum: STEM & AI", "Hands-on science experiments, coding basics, and safe internet usage", "Weekend workshop / Lecture series"],
                        ["Career Counselling", "Industry overviews in aviation, engineering, medicine, arts, and hospitality", "Interactive panel sessions"],
                        ["Excursions & Field Trips", "Accompanying students to science museums, planetariums, and national parks", "Full day weekend excursions"],
                        ["Creative & Performing Arts", "Music, dance, painting, and theater production training", "Short term guest workshops"]
                    ]
                }
            },
            {
                "id": "blk-btn",
                "type": "button",
                "data": {
                    "align": "left",
                    "items": [
                        {
                            "id": "b1",
                            "text": "Contact School to Volunteer",
                            "url": "/p/contact",
                            "variant": "default"
                        },
                        {
                            "id": "b2",
                            "text": "About The VIDYA School",
                            "url": "/p/about-vidyaschool",
                            "variant": "outline"
                        }
                    ]
                }
            }
        ]
    }
]

def seed_custom_pages():
    db = next(get_db())
    
    # Query existing pages
    existing_pages = db.exec(select(CustomPage)).all()
    existing_slugs = {p.slug.lower().strip(): p for p in existing_pages}
    print(f"Existing pages in database: {len(existing_slugs)}")
    for slug in sorted(existing_slugs.keys()):
        print(f"  - {slug}")
        
    created_count = 0
    skipped_count = 0
    
    timestamp = int(time.time() * 1000)
    
    for page_def in PAGES_DATA:
        slug = page_def["slug"].lower().strip()
        title = page_def["title"].strip()
        
        # Check constraint: Leave if already exist!
        if slug in existing_slugs:
            print(f"[SKIPPED - ALREADY EXISTS] '{slug}' ({title})")
            skipped_count += 1
            continue
            
        page_id = f"page-{slug}-{uuid.uuid4().hex[:8]}"
        widgets_data = {
            "time": timestamp,
            "blocks": page_def["blocks"],
            "version": "2.30.7"
        }
        widgets_json = json.dumps(widgets_data)
        
        new_page = CustomPage(
            id=page_id,
            title=title,
            slug=slug,
            widgets_json=widgets_json,
            author_id=None,
            status="published",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_page)
        print(f"[CREATED] '{slug}' -> Title: '{title}' (ID: {page_id})")
        created_count += 1
        
    if created_count > 0:
        db.commit()
        print(f"\nSuccessfully committed {created_count} new pages to database!")
    else:
        print("\nNo new pages to commit.")
        
    print(f"Summary: Created: {created_count}, Skipped: {skipped_count}, Total in definition: {len(PAGES_DATA)}")

if __name__ == "__main__":
    seed_custom_pages()
