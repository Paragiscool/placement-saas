import type { CategoryConfig } from '@/types'

// ── 39-CATEGORY TAXONOMY (migrated from the original script.js CAT_CFG) ───────
export const CAT_CFG: Record<string, CategoryConfig> = {
  // ── Tech ──────────────────────────────────────────────────────────────────
  'AI / ML':               { group: 'tech',  badge: 'b-aiml',  icon: '🤖', sub: 'Machine Learning, AI Research, LLM' },
  'Data Science':          { group: 'tech',  badge: 'b-ds',    icon: '📊', sub: 'Statistical Modelling, Predictive Analytics' },
  'Data Engineering':      { group: 'tech',  badge: 'b-de',    icon: '🔧', sub: 'Pipelines, ETL, Data Infrastructure' },
  'Data Analytics':        { group: 'tech',  badge: 'b-da',    icon: '📈', sub: 'BI, Reporting, Business Insights' },
  'Frontend / Design':     { group: 'tech',  badge: 'b-fe',    icon: '🎨', sub: 'UI/UX, React, Angular, Figma' },
  'Mobile Dev':            { group: 'tech',  badge: 'b-mob',   icon: '📱', sub: 'Android, iOS, Flutter, React Native' },
  'Backend Dev':           { group: 'tech',  badge: 'b-be',    icon: '⚙️', sub: 'APIs, Microservices, Databases' },
  'Fullstack Dev':         { group: 'tech',  badge: 'b-fs',    icon: '🔀', sub: 'End-to-End Web Development' },
  'DevOps / Cloud':        { group: 'tech',  badge: 'b-do',    icon: '☁️', sub: 'CI/CD, Kubernetes, AWS/GCP/Azure' },
  'SDE':                   { group: 'tech',  badge: 'b-sde',   icon: '💻', sub: 'General Software Engineering' },
  'Embedded Software':     { group: 'tech',  badge: 'b-emb',   icon: '🔌', sub: 'Firmware, RTOS, Microcontrollers' },
  'QA / Testing':          { group: 'tech',  badge: 'b-qa',    icon: '🧪', sub: 'Test Automation, V&V, Quality Assurance' },
  'Network / IT Security': { group: 'tech',  badge: 'b-net',   icon: '🔒', sub: 'Cybersecurity, Network Infra, IT Systems' },
  'Solutions Architecture':{ group: 'tech',  badge: 'b-arch',  icon: '🏛️', sub: 'Solution/Enterprise/Cloud Architecture' },
  'ERP / Enterprise Tech': { group: 'tech',  badge: 'b-erp',   icon: '🏢', sub: 'SAP, Oracle ERP, Enterprise Systems' },
  // ── Business ──────────────────────────────────────────────────────────────
  'Quant / Algo Trading':  { group: 'biz',   badge: 'b-qt',    icon: '📉', sub: 'Systematic Trading, HFT, Quant Research' },
  'Risk & Credit':         { group: 'biz',   badge: 'b-rc',    icon: '🛡️', sub: 'Risk Modelling, Actuarial, Credit Analysis' },
  'Investment & Finance':  { group: 'biz',   badge: 'b-inv',   icon: '💹', sub: 'IB, PE, VC, Asset Management' },
  'Banking Ops':           { group: 'biz',   badge: 'b-bank',  icon: '🏦', sub: 'Retail Banking, NBFC, Branch Ops' },
  'Consulting':            { group: 'biz',   badge: 'b-cons',  icon: '🤝', sub: 'Strategy, Management & Tech Consulting' },
  'Mgmt Trainee / GET':    { group: 'biz',   badge: 'b-mgt',   icon: '🎓', sub: 'Rotational Graduate & Engineer Programs' },
  'Business Analysis':     { group: 'biz',   badge: 'b-ba',    icon: '📋', sub: 'Process Analysis, Business Insights' },
  'Product Management':    { group: 'biz',   badge: 'b-pm',    icon: '🚀', sub: 'APM, TPM, Product Strategy & Roadmap' },
  'Growth / Operations':   { group: 'biz',   badge: 'b-go',    icon: '📣', sub: 'Growth, Revenue, Category & Ops Mgmt' },
  'Marketing / Content':   { group: 'biz',   badge: 'b-mc',    icon: '📢', sub: 'Digital Marketing, Content, SEO, Brand' },
  // ── Core Engineering ──────────────────────────────────────────────────────
  'Mechanical Engg':       { group: 'core',  badge: 'b-mech',  icon: '🔩', sub: 'Design, CAD, Manufacturing, Production' },
  'Aerospace & Defence':   { group: 'core',  badge: 'b-aero',  icon: '✈️', sub: 'Avionics, Propulsion, UAV, Defence' },
  'Materials / Chemical':  { group: 'core',  badge: 'b-mat',   icon: '⚗️', sub: 'Polymers, Composites, Petrochemicals' },
  'Civil / Structural':    { group: 'core',  badge: 'b-civil', icon: '🏗️', sub: 'Structures, Geotechnical, GIS, Mining' },
  'Robotics & Automation': { group: 'core',  badge: 'b-robo',  icon: '🦾', sub: 'Control Systems, UAV, Mechatronics' },
  'Electronics / VLSI':    { group: 'core',  badge: 'b-vlsi',  icon: '⚡', sub: 'Chip Design, PCB, FPGA, Semiconductor' },
  'Energy & EV':           { group: 'core',  badge: 'b-ev',    icon: '🔋', sub: 'Battery, EV, Renewables, Power Systems' },
  'R&D / Research':        { group: 'core',  badge: 'b-rnd',   icon: '🔬', sub: 'Applied Research, Lab & Science Roles' },
  // ── Other ─────────────────────────────────────────────────────────────────
  'Teaching & Academia':      { group: 'other', badge: 'b-teach',  icon: '📚', sub: 'Faculty, Coaching, EdTech Content' },
  'Supply Chain & Logistics': { group: 'other', badge: 'b-sc',     icon: '🚚', sub: 'Procurement, Inventory, Transport' },
  'Healthcare & Bio':         { group: 'other', badge: 'b-health', icon: '🏥', sub: 'Pharma, Clinical Research, Biotech' },
  'Project Management':       { group: 'other', badge: 'b-projm',  icon: '📌', sub: 'PMO, Delivery, Program Management' },
  'Unknown / Not Listed':     { group: 'other', badge: 'b-unk',    icon: '❓', sub: 'Position title not specified in data' },
  'Other':                    { group: 'other', badge: 'b-other',  icon: '🔹', sub: 'Miscellaneous / Unclassified Roles' },
}

export const CATEGORY_GROUPS = {
  tech:  { label: '🖥️ Technology',          key: 'tech'  },
  biz:   { label: '💼 Business & Finance',   key: 'biz'   },
  core:  { label: '⚙️ Core Engineering',     key: 'core'  },
  other: { label: '📚 Research & Other',     key: 'other' },
}

export function getCatConfig(category: string) {
  return CAT_CFG[category] ?? CAT_CFG['Other']
}

export function formatCTC(ctc: number | null, currency: string): string {
  if (!ctc || ctc <= 0) return '–'
  if (currency === 'INR') return `${ctc.toFixed(1)} LPA`
  return `${ctc.toLocaleString()} ${currency}`
}
