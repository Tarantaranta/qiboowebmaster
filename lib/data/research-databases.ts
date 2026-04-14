// Research Databases - Structured data for academic and medical research database references
// Used by UI components to display database information, search links, and categorization

export type AccessType = "free" | "subscription" | "institutional" | "freemium";

export type DatabaseCategory =
  | "general-medical"
  | "chinese-medicine"
  | "systematic-reviews"
  | "clinical-trials"
  | "multidisciplinary"
  | "complementary-medicine"
  | "pharmacology"
  | "regional"
  | "grey-literature"
  | "citation-index";

export interface ResearchDatabase {
  id: string;
  name: string;
  url: string | null;
  category: DatabaseCategory;
  description: string;
  primaryUseCase: string;
  specialNotes: string | null;
  accessType: AccessType;
  language: string;
  searchTips: string | null;
}

export const DATABASE_CATEGORIES: Record<DatabaseCategory, string> = {
  "general-medical": "General Medical",
  "chinese-medicine": "Chinese Medicine",
  "systematic-reviews": "Systematic Reviews & Meta-Analyses",
  "clinical-trials": "Clinical Trials",
  "multidisciplinary": "Multidisciplinary",
  "complementary-medicine": "Complementary & Alternative Medicine",
  "pharmacology": "Pharmacology & Natural Products",
  "regional": "Regional Databases",
  "grey-literature": "Grey Literature & Theses",
  "citation-index": "Citation Indexes",
};

export const RESEARCH_DATABASES: ResearchDatabase[] = [
  // === General Medical Databases ===
  {
    id: "pubmed",
    name: "PubMed / MEDLINE",
    url: "https://pubmed.ncbi.nlm.nih.gov",
    category: "general-medical",
    description:
      "The premier biomedical literature database maintained by the U.S. National Library of Medicine. Contains over 36 million citations from MEDLINE, life science journals, and online books.",
    primaryUseCase:
      "Primary search for biomedical and life sciences journal literature, including acupuncture RCTs published in English-language journals.",
    specialNotes:
      "Use MeSH terms for precise searching. Acupuncture-specific MeSH: 'Acupuncture Therapy', 'Acupuncture Points', 'Electroacupuncture'. Includes some Chinese journal articles with English abstracts.",
    accessType: "free",
    language: "English (with some multilingual abstracts)",
    searchTips:
      "Use the 'Acupuncture Therapy'[MeSH] term combined with condition-specific MeSH for best results.",
  },
  {
    id: "embase",
    name: "Embase",
    url: "https://www.embase.com",
    category: "general-medical",
    description:
      "Elsevier's biomedical database with strong European and pharmacological coverage. Contains over 40 million records from 8,500+ journals.",
    primaryUseCase:
      "Comprehensive literature searches, particularly for pharmacology, drug research, and European publications not indexed in MEDLINE.",
    specialNotes:
      "Significant overlap with MEDLINE but includes ~6 million unique records. Uses Emtree thesaurus. Important for systematic reviews to reduce publication bias.",
    accessType: "subscription",
    language: "English",
    searchTips:
      "Use Emtree terms alongside free-text. 'Acupuncture' in Emtree has different subheadings than MeSH.",
  },
  {
    id: "medline-ovid",
    name: "MEDLINE (Ovid)",
    url: "https://www.ovid.com",
    category: "general-medical",
    description:
      "Ovid's interface to the MEDLINE database, offering advanced search features including proximity operators, field-specific searching, and search strategy management.",
    primaryUseCase:
      "Advanced systematic review searches with complex Boolean logic and reproducible search strategies.",
    specialNotes:
      "Preferred by many systematic reviewers for its advanced search syntax. Same content as PubMed's MEDLINE subset but with more powerful search tools.",
    accessType: "institutional",
    language: "English",
    searchTips:
      "Use .mp. for multi-purpose field search and exp for exploded MeSH terms.",
  },

  // === Chinese Medicine Databases ===
  {
    id: "cnki",
    name: "CNKI (China National Knowledge Infrastructure)",
    url: "https://www.cnki.net",
    category: "chinese-medicine",
    description:
      "China's largest and most comprehensive academic database, containing journals, dissertations, conference proceedings, newspapers, and yearbooks.",
    primaryUseCase:
      "Essential source for Chinese-language acupuncture research, clinical studies, and traditional Chinese medicine literature.",
    specialNotes:
      "Critical for Chinese acupuncture literature. Contains the vast majority of Chinese acupuncture RCTs. Interface available in Chinese and English. Many systematic reviews of acupuncture require CNKI searching.",
    accessType: "subscription",
    language: "Chinese (with English interface option)",
    searchTips:
      "Search in both Chinese characters and pinyin. Use subject categories for Traditional Chinese Medicine (TCM).",
  },
  {
    id: "wanfang",
    name: "Wanfang Data",
    url: "https://www.wanfangdata.com.cn",
    category: "chinese-medicine",
    description:
      "Major Chinese academic database covering journals, dissertations, conference proceedings, and standards. Strong in science, technology, and medicine.",
    primaryUseCase:
      "Supplementary Chinese-language database for acupuncture research. Important for capturing studies not indexed in CNKI.",
    specialNotes:
      "Second-largest Chinese academic database after CNKI. Some unique content not found in CNKI. Particularly strong for Chinese dissertations and theses.",
    accessType: "subscription",
    language: "Chinese",
    searchTips:
      "Cross-reference with CNKI results to ensure comprehensive coverage of Chinese literature.",
  },
  {
    id: "vip-cqvip",
    name: "VIP (CQVIP / Chongqing VIP)",
    url: "https://www.cqvip.com",
    category: "chinese-medicine",
    description:
      "Chinese scientific and technical journal database maintained by Chongqing VIP Information Co. Covers over 12,000 Chinese journals.",
    primaryUseCase:
      "Third major Chinese database for comprehensive Chinese-language literature coverage in systematic reviews.",
    specialNotes:
      "Important third Chinese database alongside CNKI and Wanfang. Some unique journal coverage. Required for comprehensive systematic reviews of Chinese acupuncture literature.",
    accessType: "subscription",
    language: "Chinese",
    searchTips:
      "Use alongside CNKI and Wanfang for comprehensive Chinese literature searches.",
  },
  {
    id: "cbm-sinomed",
    name: "CBM / SinoMed (Chinese Biomedical Literature Database)",
    url: "https://www.sinomed.ac.cn",
    category: "chinese-medicine",
    description:
      "Chinese biomedical literature database maintained by the Chinese Academy of Medical Sciences. Focuses specifically on biomedical literature.",
    primaryUseCase:
      "Biomedical-specific Chinese literature search, particularly useful for clinical studies and medical research in Chinese.",
    specialNotes:
      "More focused on biomedical content than CNKI. Uses Chinese Medical Subject Headings (CMeSH) which parallel English MeSH terms.",
    accessType: "institutional",
    language: "Chinese",
    searchTips:
      "Use CMeSH terms for standardized searching. Structure mirrors MeSH hierarchy.",
  },

  // === Systematic Reviews & Meta-Analyses ===
  {
    id: "cochrane-library",
    name: "Cochrane Library",
    url: "https://www.cochranelibrary.com",
    category: "systematic-reviews",
    description:
      "The gold standard collection of databases for evidence-based medicine, including the Cochrane Database of Systematic Reviews (CDSR) and CENTRAL (Cochrane Central Register of Controlled Trials).",
    primaryUseCase:
      "Finding high-quality systematic reviews and RCTs. CENTRAL is the most comprehensive source of reports of controlled trials.",
    specialNotes:
      "The Cochrane Complementary Medicine field has a dedicated group. CENTRAL includes trial records harvested from MEDLINE, Embase, and hand-searched sources.",
    accessType: "freemium",
    language: "English",
    searchTips:
      "Search CENTRAL for trials and CDSR for existing systematic reviews. Check if a Cochrane review already exists for your topic.",
  },
  {
    id: "prospero",
    name: "PROSPERO",
    url: "https://www.crd.york.ac.uk/prospero",
    category: "systematic-reviews",
    description:
      "International prospective register of systematic reviews. Maintained by the Centre for Reviews and Dissemination (CRD) at the University of York.",
    primaryUseCase:
      "Registering systematic review protocols and checking for ongoing or completed reviews to avoid duplication.",
    specialNotes:
      "Registration is recommended before starting a systematic review. Helps identify ongoing reviews in acupuncture to enable collaboration or avoid duplication.",
    accessType: "free",
    language: "English",
    searchTips:
      "Search before starting a new systematic review to check for existing or ongoing reviews on your topic.",
  },

  // === Clinical Trials ===
  {
    id: "clinicaltrials-gov",
    name: "ClinicalTrials.gov",
    url: "https://clinicaltrials.gov",
    category: "clinical-trials",
    description:
      "U.S. National Library of Medicine's registry and results database of publicly and privately supported clinical studies conducted around the world.",
    primaryUseCase:
      "Identifying ongoing, completed, or planned acupuncture clinical trials. Required for comprehensive systematic review searches.",
    specialNotes:
      "Contains trial results that may not yet be published in journals. Important for identifying publication bias in systematic reviews.",
    accessType: "free",
    language: "English",
    searchTips:
      "Search for 'acupuncture' in intervention/treatment field. Filter by condition and study status.",
  },
  {
    id: "who-ictrp",
    name: "WHO ICTRP (International Clinical Trials Registry Platform)",
    url: "https://trialsearch.who.int",
    category: "clinical-trials",
    description:
      "WHO's portal providing access to a central database of clinical trial registries worldwide, including data from ClinicalTrials.gov, ChiCTR, and other national registries.",
    primaryUseCase:
      "Searching multiple international trial registries simultaneously, especially for trials registered outside the US.",
    specialNotes:
      "Aggregates data from the Chinese Clinical Trial Registry (ChiCTR) and other national registries. Essential for finding Chinese acupuncture trials not registered on ClinicalTrials.gov.",
    accessType: "free",
    language: "English",
    searchTips:
      "Use as a complement to ClinicalTrials.gov for international trial coverage, especially Chinese trials registered in ChiCTR.",
  },
  {
    id: "chictr",
    name: "ChiCTR (Chinese Clinical Trial Registry)",
    url: "https://www.chictr.org.cn",
    category: "clinical-trials",
    description:
      "China's primary clinical trial registry, a WHO ICTRP Primary Registry. Contains registrations of clinical trials conducted in China.",
    primaryUseCase:
      "Finding Chinese acupuncture clinical trials registered in China. Many Chinese acupuncture trials are registered here rather than ClinicalTrials.gov.",
    specialNotes:
      "Critical for comprehensive trial searches in acupuncture research. Bilingual interface (Chinese/English). Feeds into WHO ICTRP.",
    accessType: "free",
    language: "Chinese / English",
    searchTips:
      "Search in both English and Chinese for comprehensive results.",
  },

  // === Complementary & Alternative Medicine ===
  {
    id: "amed",
    name: "AMED (Allied and Complementary Medicine Database)",
    url: null,
    category: "complementary-medicine",
    description:
      "Bibliographic database produced by the Health Care Information Service of the British Library. Covers complementary medicine, physiotherapy, occupational therapy, and related disciplines.",
    primaryUseCase:
      "Dedicated database for complementary and alternative medicine literature including acupuncture, covering journals not indexed elsewhere.",
    specialNotes:
      "One of the few databases specifically focused on complementary medicine. Indexes specialized acupuncture journals. Available through OVID and EBSCO.",
    accessType: "institutional",
    language: "English",
    searchTips:
      "Access via OVID or EBSCO. Covers many niche CAM journals not in MEDLINE.",
  },
  {
    id: "cam-quest",
    name: "CAM-QUEST",
    url: "https://cam-quest.org",
    category: "complementary-medicine",
    description:
      "Database of clinical studies in complementary and alternative medicine maintained by the Carstens Foundation.",
    primaryUseCase:
      "Finding CAM-specific clinical studies including acupuncture trials, particularly European studies.",
    specialNotes:
      "Focuses specifically on clinical studies in CAM. Useful supplementary source for systematic reviews.",
    accessType: "free",
    language: "English / German",
    searchTips:
      "Use as a supplementary database for CAM-focused systematic reviews.",
  },

  // === Pharmacology & Natural Products ===
  {
    id: "napralert",
    name: "NAPRALERT (Natural Products Alert)",
    url: "https://napralert.org",
    category: "pharmacology",
    description:
      "Database of worldwide literature on natural products including ethnomedical, pharmacological, and biochemical information on plant, microbial, and marine organisms.",
    primaryUseCase:
      "Research on natural products, herbal medicines, and pharmacological data related to plants used in traditional Chinese medicine.",
    specialNotes:
      "Useful when acupuncture research intersects with herbal medicine or traditional Chinese medicine formulations.",
    accessType: "subscription",
    language: "English",
    searchTips:
      "Search by plant species, chemical compound, or pharmacological activity.",
  },

  // === Multidisciplinary Databases ===
  {
    id: "web-of-science",
    name: "Web of Science",
    url: "https://www.webofscience.com",
    category: "citation-index",
    description:
      "Clarivate's multidisciplinary citation index covering sciences, social sciences, arts, and humanities. Includes Science Citation Index Expanded (SCI-E).",
    primaryUseCase:
      "Citation tracking, impact factor analysis, and comprehensive multidisciplinary literature searches. Useful for finding citing articles.",
    specialNotes:
      "Citation tracking feature is valuable for finding related acupuncture studies. SCI-E inclusion is often used as a journal quality indicator in China.",
    accessType: "institutional",
    language: "English",
    searchTips:
      "Use 'Cited Reference Search' to find papers citing key acupuncture studies. Topic search supports Boolean operators.",
  },
  {
    id: "scopus",
    name: "Scopus",
    url: "https://www.scopus.com",
    category: "citation-index",
    description:
      "Elsevier's abstract and citation database covering peer-reviewed literature from over 27,000 titles across science, technology, medicine, social sciences, and arts.",
    primaryUseCase:
      "Alternative citation index to Web of Science. Broader journal coverage and useful for bibliometric analysis.",
    specialNotes:
      "Wider journal coverage than Web of Science, including more non-English language journals. h-index calculations and author profiling available.",
    accessType: "institutional",
    language: "English",
    searchTips:
      "Use advanced search with field codes (e.g., TITLE-ABS-KEY) for precise results.",
  },
  {
    id: "google-scholar",
    name: "Google Scholar",
    url: "https://scholar.google.com",
    category: "multidisciplinary",
    description:
      "Free web search engine indexing the full text or metadata of scholarly literature across disciplines and formats.",
    primaryUseCase:
      "Broad literature discovery, finding full-text versions of articles, and citation tracking. Useful for initial scoping searches.",
    specialNotes:
      "Not suitable as a sole search source for systematic reviews due to lack of reproducibility. Good for finding grey literature and non-indexed sources.",
    accessType: "free",
    language: "Multiple",
    searchTips:
      "Use advanced search and exact phrase matching. Results are ranked by relevance, not date. Limited to first ~1000 results.",
  },

  // === Regional Databases ===
  {
    id: "lilacs",
    name: "LILACS (Latin American and Caribbean Health Sciences Literature)",
    url: "https://lilacs.bvsalud.org",
    category: "regional",
    description:
      "Comprehensive index of scientific and technical literature from Latin America and the Caribbean health sciences.",
    primaryUseCase:
      "Finding health sciences literature from Latin America and the Caribbean not indexed in major international databases.",
    specialNotes:
      "Important for reducing geographical bias in systematic reviews. Part of the Virtual Health Library (BVS).",
    accessType: "free",
    language: "Spanish / Portuguese / English",
    searchTips:
      "Access via BVS portal. Search in Spanish and Portuguese for comprehensive coverage.",
  },
  {
    id: "kmbase",
    name: "KMbase (Korean Medical Database)",
    url: "https://kmbase.medric.or.kr",
    category: "regional",
    description:
      "Korean medical literature database maintained by the Medical Research Information Center (MedRIC). Covers Korean medical journals.",
    primaryUseCase:
      "Finding Korean acupuncture and traditional Korean medicine research not indexed in international databases.",
    specialNotes:
      "South Korea has a significant body of acupuncture research. Important for comprehensive systematic reviews in East Asian medicine.",
    accessType: "free",
    language: "Korean / English",
    searchTips:
      "Search in both Korean and English. Korean acupuncture terminology may differ from Chinese/Japanese usage.",
  },
  {
    id: "j-stage",
    name: "J-STAGE (Japan Science and Technology Information Aggregator)",
    url: "https://www.jstage.jst.go.jp",
    category: "regional",
    description:
      "Japan's electronic journal platform operated by the Japan Science and Technology Agency (JST). Provides full-text access to Japanese scholarly journals.",
    primaryUseCase:
      "Finding Japanese acupuncture and Kampo medicine research published in Japanese journals.",
    specialNotes:
      "Japan has unique acupuncture traditions and research. Many articles available in full text. Important for East Asian medicine systematic reviews.",
    accessType: "free",
    language: "Japanese / English",
    searchTips:
      "Many articles have English abstracts. Use both Japanese and English search terms.",
  },
  {
    id: "kci",
    name: "KCI (Korea Citation Index)",
    url: "https://www.kci.go.kr",
    category: "regional",
    description:
      "Korean citation index database operated by the National Research Foundation of Korea. Indexes Korean academic journals across all disciplines.",
    primaryUseCase:
      "Citation analysis and finding Korean scholarly articles, particularly in traditional Korean medicine and acupuncture.",
    specialNotes:
      "Complementary to KMbase for Korean literature. Provides citation metrics for Korean journals.",
    accessType: "free",
    language: "Korean / English",
    searchTips:
      "Combine with KMbase searches for comprehensive Korean literature coverage.",
  },

  // === Grey Literature & Theses ===
  {
    id: "opengrey",
    name: "OpenGrey",
    url: "https://opengrey.eu",
    category: "grey-literature",
    description:
      "System for information on grey literature in Europe. Covers technical reports, dissertations, conference papers, and other non-conventional literature.",
    primaryUseCase:
      "Finding grey literature (unpublished studies, conference abstracts, theses) to reduce publication bias in systematic reviews.",
    specialNotes:
      "Grey literature searching is recommended in systematic review methodology to address publication bias.",
    accessType: "free",
    language: "Multiple (primarily European languages)",
    searchTips:
      "Search for conference proceedings and dissertations related to acupuncture topics.",
  },
  {
    id: "proquest-dissertations",
    name: "ProQuest Dissertations & Theses Global",
    url: "https://www.proquest.com/dissertations",
    category: "grey-literature",
    description:
      "The world's most comprehensive collection of dissertations and theses from around the world, spanning from 1861 to the present day.",
    primaryUseCase:
      "Finding doctoral dissertations and master's theses related to acupuncture research.",
    specialNotes:
      "Important source of grey literature for systematic reviews. Many acupuncture-related dissertations contain unpublished trial data.",
    accessType: "institutional",
    language: "Multiple",
    searchTips:
      "Search by subject area (Traditional Chinese Medicine, Acupuncture) and filter by degree type.",
  },

  // === Specialized ===
  {
    id: "cinahl",
    name: "CINAHL (Cumulative Index to Nursing and Allied Health Literature)",
    url: "https://www.ebsco.com/products/research-databases/cinahl-database",
    category: "general-medical",
    description:
      "Authoritative resource for nursing and allied health professionals. Covers nursing, biomedicine, health sciences librarianship, and related disciplines.",
    primaryUseCase:
      "Finding nursing and allied health literature related to acupuncture, particularly studies on acupuncture in clinical nursing practice.",
    specialNotes:
      "Strong coverage of nursing interventions involving acupuncture. Important supplementary database for systematic reviews.",
    accessType: "institutional",
    language: "English",
    searchTips:
      "Use CINAHL Headings (similar to MeSH) for structured searching. 'Acupuncture' is a CINAHL subject heading.",
  },
  {
    id: "psycinfo",
    name: "APA PsycINFO",
    url: "https://www.apa.org/pubs/databases/psycinfo",
    category: "general-medical",
    description:
      "American Psychological Association's database of behavioral science and mental health literature. Covers psychology, psychiatry, and related fields.",
    primaryUseCase:
      "Finding psychological and behavioral research related to acupuncture, such as acupuncture for anxiety, depression, PTSD, and pain psychology.",
    specialNotes:
      "Important when researching acupuncture for mental health conditions. Contains unique content not found in MEDLINE for psychological outcomes.",
    accessType: "institutional",
    language: "English",
    searchTips:
      "Use PsycINFO's Thesaurus terms. 'Acupuncture' is indexed as a treatment approach.",
  },
  {
    id: "pedro",
    name: "PEDro (Physiotherapy Evidence Database)",
    url: "https://pedro.org.au",
    category: "complementary-medicine",
    description:
      "Free database of randomized trials, systematic reviews, and clinical practice guidelines in physiotherapy. Each trial is independently quality-rated.",
    primaryUseCase:
      "Finding quality-rated physiotherapy evidence including acupuncture and dry needling trials with built-in methodological quality scores.",
    specialNotes:
      "PEDro quality scores provide quick assessment of trial methodology. Covers acupuncture within the scope of physiotherapy practice.",
    accessType: "free",
    language: "English",
    searchTips:
      "Use the 'Acupuncture' therapy filter. PEDro scores range from 0-10 for methodological quality.",
  },
];

// --- Helper functions ---

export function getDatabasesByCategory(
  category: DatabaseCategory
): ResearchDatabase[] {
  return RESEARCH_DATABASES.filter((db) => db.category === category);
}

export function getDatabasesByAccessType(
  accessType: AccessType
): ResearchDatabase[] {
  return RESEARCH_DATABASES.filter((db) => db.accessType === accessType);
}

export function getFreeDatabases(): ResearchDatabase[] {
  return RESEARCH_DATABASES.filter(
    (db) => db.accessType === "free" || db.accessType === "freemium"
  );
}

export function getDatabaseById(id: string): ResearchDatabase | undefined {
  return RESEARCH_DATABASES.find((db) => db.id === id);
}

export function searchDatabases(query: string): ResearchDatabase[] {
  const lowerQuery = query.toLowerCase();
  return RESEARCH_DATABASES.filter(
    (db) =>
      db.name.toLowerCase().includes(lowerQuery) ||
      db.description.toLowerCase().includes(lowerQuery) ||
      db.primaryUseCase.toLowerCase().includes(lowerQuery) ||
      (db.specialNotes?.toLowerCase().includes(lowerQuery) ?? false)
  );
}
