import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_DIR = path.resolve('apps/frontend');
const CONTENT_DOCS_DIR = path.join(FRONTEND_DIR, 'content/docs');
const STATIC_PAGES_DIR = path.join(FRONTEND_DIR, 'data/static-pages');

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Convert EditorJS blocks to clean Markdown
function editorJsToMarkdown(blocks) {
  let md = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'header': {
        const level = Math.min(Math.max(block.data.level || 2, 1), 6);
        const text = String(block.data.text || '').replace(/<[^>]*>/g, '').trim();
        md.push(`${'#'.repeat(level)} ${text}\n`);
        break;
      }
      case 'paragraph': {
        let text = String(block.data.text || '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<b>(.*?)<\/b>/gi, '**$1**')
          .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
          .replace(/<i>(.*?)<\/i>/gi, '*$1*')
          .replace(/<em>(.*?)<\/em>/gi, '*$1*')
          .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim();
        if (text) md.push(`${text}\n`);
        break;
      }
      case 'list': {
        const style = block.data.style;
        (block.data.items || []).forEach((item, idx) => {
          const itemText = typeof item === 'string' ? item : (item.content || '');
          const cleanItem = String(itemText)
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<b>(.*?)<\/b>/gi, '**$1**')
            .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<i>(.*?)<\/i>/gi, '*$1*')
            .replace(/<em>(.*?)<\/em>/gi, '*$1*')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .trim();
          if (style === 'ordered') {
            md.push(`${idx + 1}. ${cleanItem}`);
          } else {
            md.push(`- ${cleanItem}`);
          }
        });
        md.push('');
        break;
      }
      case 'table': {
        const rows = block.data.content || [];
        if (rows.length > 0) {
          const cleanCell = (c) => {
            if (typeof c === 'object' && c !== null) {
              if (c.url) {
                return `[${c.label || 'View Document'}](${c.url})`;
              }
              return JSON.stringify(c);
            }
            return String(c ?? '')
              .replace(/<br\s*\/?>/gi, ' ')
              .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
              .replace(/<[^>]*>/g, '')
              .replace(/\|/g, '\\|')
              .replace(/&nbsp;/g, ' ')
              .trim();
          };
          const header = rows[0];
          md.push('| ' + header.map(cleanCell).join(' | ') + ' |');
          md.push('| ' + header.map(() => '---').join(' | ') + ' |');
          for (let i = 1; i < rows.length; i++) {
            md.push('| ' + rows[i].map(cleanCell).join(' | ') + ' |');
          }
          md.push('');
        }
        break;
      }
      case 'alert': {
        const title = block.data.title || 'Note';
        const msg = String(block.data.message || '').replace(/<[^>]*>/g, '').trim();
        md.push(`> [!NOTE]\n> **${title}**\n> ${msg}\n`);
        break;
      }
      case 'quote': {
        const text = String(block.data.text || '').replace(/<[^>]*>/g, '').trim();
        const caption = block.data.caption ? ` — *${block.data.caption}*` : '';
        md.push(`> ${text}${caption}\n`);
        break;
      }
      case 'delimiter': {
        md.push('---\n');
        break;
      }
      case 'card': {
        const title = block.data.title || '';
        const desc = block.data.description || '';
        md.push(`### ${title}\n${desc}\n`);
        break;
      }
      case 'stats': {
        const stat = block.data.value || '';
        const label = block.data.label || '';
        md.push(`**${stat}** — *${label}*\n`);
        break;
      }
      case 'button': {
        const text = block.data.text || 'View Link';
        const url = block.data.url || '#';
        md.push(`[${text}](${url})\n`);
        break;
      }
      case 'pdf': {
        const name = block.data.name || block.data.title || 'Document';
        const url = block.data.url || '';
        md.push(`📄 **[${name}](${url})**\n`);
        break;
      }
      default:
        break;
    }
  }
  return md.join('\n');
}

// Convert Article to MDX
function articleToMdx(a) {
  let desc = (a.description || '').replace(/<->/g, '↔');
  let lines = [
    '---',
    `title: "${(a.title || '').replace(/"/g, '\\"')}"`,
    `description: "${desc.replace(/"/g, '\\"')}"`,
    '---',
    '',
    desc,
    ''
  ];

  if (a.steps && a.steps.length > 0) {
    lines.push('## Steps');
    lines.push('');
    for (const s of a.steps) {
      lines.push(`### Step ${s.step}: ${s.title}`);
      lines.push(s.desc.replace(/<->/g, '↔'));
      lines.push('');
    }
  }

  if (a.tips && a.tips.length > 0) {
    lines.push('## Tips');
    lines.push('');
    for (const tip of a.tips) {
      lines.push(`- ${tip.replace(/<->/g, '↔')}`);
    }
    lines.push('');
  }

  if (a.warnings && a.warnings.length > 0) {
    lines.push('## Important Warnings');
    lines.push('');
    for (const w of a.warnings) {
      lines.push(`> [!WARNING]`);
      lines.push(`> ${w.replace(/<->/g, '↔')}`);
      lines.push('');
    }
  }

  if (a.details && a.details.length > 0) {
    for (const d of a.details) {
      lines.push(`## ${d.title}`);
      lines.push('');
      lines.push(d.body.replace(/<->/g, '↔'));
      lines.push('');
    }
  }

  if (a.faqs && a.faqs.length > 0) {
    lines.push('## Frequently Asked Questions');
    lines.push('');
    for (const f of a.faqs) {
      lines.push(`### ${f.q}`);
      lines.push(f.a.replace(/<->/g, '↔'));
      lines.push('');
    }
  }

  return lines.join('\n');
}

// Extract JSX TSX policy pages into MDX
function tsxPolicyToMdx(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  
  // Extract title
  let titleMatch = code.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  let title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : path.basename(path.dirname(filePath));
  
  // Clean JSX into Markdown
  let content = code;
  // Remove imports & export function header
  content = content.replace(/^import[\s\S]*?return \(/m, '');
  content = content.replace(/\)\s*\}\s*$/m, '');
  content = content.replace(/<\/?DocsPage[^>]*>/g, '');
  content = content.replace(/<\/?DocsBody[^>]*>/g, '');
  
  // Replace headings
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '# $1\n');
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '## $1\n');
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '### $1\n');
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, '#### $1\n');
  
  // Replace links
  content = content.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');
  
  // Replace list items
  content = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '- $1');
  content = content.replace(/<\/?ul[^>]*>/g, '\n');
  content = content.replace(/<\/?ol[^>]*>/g, '\n');
  
  // Replace paragraphs and sections
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '$1\n\n');
  content = content.replace(/<\/?section[^>]*>/g, '\n');
  content = content.replace(/<\/?div[^>]*>/g, '\n');
  
  // Replace strong & em
  content = content.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**');
  content = content.replace(/<b[^>]*>([\s\S]*?)<\/b>/g, '**$1**');
  content = content.replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '*$1*');
  content = content.replace(/<i[^>]*>([\s\S]*?)<\/i>/g, '*$1*');
  
  // Replace entities
  content = content.replace(/&quot;/g, '"');
  content = content.replace(/&amp;/g, '&');
  content = content.replace(/&nbsp;/g, ' ');
  content = content.replace(/&apos;/g, "'");
  content = content.replace(/&gt;/g, '>');
  content = content.replace(/&lt;/g, '<');
  content = content.replace(/\{['"](\s+)['"]\}/g, '$1');
  content = content.replace(/\{['"](.*?)['"]\}/g, '$1');
  
  // Strip any remaining React/HTML tags
  content = content.replace(/<[^>]+>/g, '');
  
  // Normalize whitespace
  content = content.replace(/\n{3,}/g, '\n\n').trim();

  return `---
title: "${title.replace(/"/g, '\\"')}"
description: "${title} for VIDYA SCHOOL platform and services."
---

${content}
`;
}

async function main() {
  console.log('--- Starting Docs Import ---');

  // 1. Read ARTICLES from [role]/[section]/page.tsx
  const pageFile = fs.readFileSync(path.join(FRONTEND_DIR, 'app/docs/[role]/[section]/page.tsx'), 'utf8');
  const start = pageFile.indexOf('const ARTICLES: Record<string, Record<string, GuideArticle>> = {');
  const end = pageFile.indexOf('export async function generateMetadata');
  const objStr = pageFile.substring(start + 'const ARTICLES: Record<string, Record<string, GuideArticle>> = '.length, end).trim();
  const ARTICLES = eval('(' + objStr + ')');

  const roleTitles = {
    'getting-started': 'Getting Started',
    'auth': 'Account & Authentication',
    'student': 'Student Guide',
    'teacher': 'Teacher Guide',
    'admissions': 'Admissions',
    'co-curriculars': 'Co-Curricular Activities',
    'developers': 'Developers Guide'
  };

  for (const [role, articles] of Object.entries(ARTICLES)) {
    const roleDir = path.join(CONTENT_DOCS_DIR, role);
    ensureDir(roleDir);

    const sections = Object.keys(articles);
    for (const [section, article] of Object.entries(articles)) {
      const mdx = articleToMdx(article);
      fs.writeFileSync(path.join(roleDir, `${section}.mdx`), mdx, 'utf8');
      console.log(`Generated: ${role}/${section}.mdx`);
    }

    // Write meta.json for the category
    const metaJson = {
      title: roleTitles[role] || role,
      pages: sections
    };
    fs.writeFileSync(path.join(roleDir, 'meta.json'), JSON.stringify(metaJson, null, 2), 'utf8');
  }

  // 2. Compliance from static-pages
  const complianceDir = path.join(CONTENT_DOCS_DIR, 'compliance');
  ensureDir(complianceDir);
  const compliancePages = [
    { slug: 'mandatory-disclosure', file: 'mandatory-public-disclosure.json', title: 'Mandatory Public Disclosure' },
    { slug: 'affiliation', file: 'affiliation.json', title: 'CBSE Affiliation Status' },
    { slug: 'annual-report', file: 'annual-report.json', title: 'Annual Report & Audit' },
    { slug: 'smc', file: 'school-management-committee.json', title: 'School Management Committee (SMC)' },
    { slug: 'pta', file: 'pta.json', title: 'Parents Teachers Association (PTA)' },
    { slug: 'certificates', file: 'certificates.json', title: 'Statutory Certificates' },
  ];
  for (const p of compliancePages) {
    const jsonPath = path.join(STATIC_PAGES_DIR, p.file);
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const blocks = data.widgets?.blocks || (Array.isArray(data.widgets) ? data.widgets : []);
      const md = editorJsToMarkdown(blocks);
      const mdx = `---
title: "${p.title.replace(/"/g, '\\"')}"
description: "${(data.description || p.title).replace(/"/g, '\\"')}"
---

${md}
`;
      fs.writeFileSync(path.join(complianceDir, `${p.slug}.mdx`), mdx, 'utf8');
      console.log(`Generated: compliance/${p.slug}.mdx`);
    }
  }
  fs.writeFileSync(
    path.join(complianceDir, 'meta.json'),
    JSON.stringify({ title: 'Institutional Compliance', pages: compliancePages.map(p => p.slug) }, null, 2),
    'utf8'
  );

  // 3. Academics from static-pages
  const academicsDir = path.join(CONTENT_DOCS_DIR, 'academics');
  ensureDir(academicsDir);
  const academicPages = [
    { slug: 'fee-structure', file: 'fee-structure.json', title: 'Fee Structure & Payment' },
    { slug: 'academic-calendar', file: 'academic-calendar.json', title: 'Academic Calendar 2026–27' },
    { slug: 'curriculum', file: 'curriculum.json', title: 'Curriculum Overview' },
    { slug: 'syllabus', file: 'syllabus.json', title: 'Class Syllabus (I–XII)' },
    { slug: 'textbooks', file: 'textbooks.json', title: 'Prescribed Textbooks' },
    { slug: 'examinations', file: 'examinations.json', title: 'Examinations & Assessments' },
    { slug: 'results', file: 'results.json', title: 'Board Exam Results (3-Yr)' },
  ];
  for (const p of academicPages) {
    const jsonPath = path.join(STATIC_PAGES_DIR, p.file);
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const blocks = data.widgets?.blocks || (Array.isArray(data.widgets) ? data.widgets : []);
      const md = editorJsToMarkdown(blocks);
      const mdx = `---
title: "${p.title.replace(/"/g, '\\"')}"
description: "${(data.description || p.title).replace(/"/g, '\\"')}"
---

${md}
`;
      fs.writeFileSync(path.join(academicsDir, `${p.slug}.mdx`), mdx, 'utf8');
      console.log(`Generated: academics/${p.slug}.mdx`);
    }
  }
  fs.writeFileSync(
    path.join(academicsDir, 'meta.json'),
    JSON.stringify({ title: 'Academics & Rules', pages: academicPages.map(p => p.slug) }, null, 2),
    'utf8'
  );

  // 4. Admissions additional pages
  const admissionsDir = path.join(CONTENT_DOCS_DIR, 'admissions');
  ensureDir(admissionsDir);
  const admissionStatic = [
    { slug: 'process', file: 'admission-process.json', title: 'Admission Process & Stages' },
    { slug: 'eligibility', file: 'eligibility.json', title: 'Eligibility Criteria' },
  ];
  for (const p of admissionStatic) {
    const jsonPath = path.join(STATIC_PAGES_DIR, p.file);
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const blocks = data.widgets?.blocks || (Array.isArray(data.widgets) ? data.widgets : []);
      const md = editorJsToMarkdown(blocks);
      const mdx = `---
title: "${p.title.replace(/"/g, '\\"')}"
description: "${(data.description || p.title).replace(/"/g, '\\"')}"
---

${md}
`;
      fs.writeFileSync(path.join(admissionsDir, `${p.slug}.mdx`), mdx, 'utf8');
      console.log(`Generated: admissions/${p.slug}.mdx`);
    }
  }
  const currentAdmissionsMeta = JSON.parse(fs.readFileSync(path.join(admissionsDir, 'meta.json'), 'utf8'));
  const admissionsPagesList = ['overview', 'process', 'eligibility', ...currentAdmissionsMeta.pages.filter(p => !['overview', 'process', 'eligibility'].includes(p))];
  fs.writeFileSync(
    path.join(admissionsDir, 'meta.json'),
    JSON.stringify({ title: 'Admissions', pages: admissionsPagesList }, null, 2),
    'utf8'
  );

  // 5. Legal Policies
  const legalDir = path.join(CONTENT_DOCS_DIR, 'legal');
  ensureDir(legalDir);
  const legalPolicies = [
    { slug: 'terms-of-service', file: 'terms-of-service/page.tsx', title: 'Terms of Service' },
    { slug: 'privacy-policy', file: 'privacy-policy/page.tsx', title: 'Privacy Policy' },
    { slug: 'refund-policy', file: 'refund-policy/page.tsx', title: 'Refund & Cancellation Policy' },
    { slug: 'cookie-policy', file: 'cookie-policy/page.tsx', title: 'Cookie Policy' },
    { slug: 'acceptable-use', file: 'acceptable-use/page.tsx', title: 'Acceptable Use Policy' },
    { slug: 'ai-disclaimer', file: 'ai-disclaimer/page.tsx', title: 'AI & Academic Disclaimer' },
    { slug: 'dmca-policy', file: 'dmca-policy/page.tsx', title: 'DMCA & Copyright Policy' },
    { slug: 'security-policy', file: 'security-policy/page.tsx', title: 'Security & Vulnerability Policy' },
  ];
  for (const pol of legalPolicies) {
    const tsxPath = path.join(FRONTEND_DIR, 'app/docs', pol.file);
    if (fs.existsSync(tsxPath)) {
      const mdx = tsxPolicyToMdx(tsxPath);
      fs.writeFileSync(path.join(legalDir, `${pol.slug}.mdx`), mdx, 'utf8');
      console.log(`Generated: legal/${pol.slug}.mdx`);
    }
  }
  fs.writeFileSync(
    path.join(legalDir, 'meta.json'),
    JSON.stringify({ title: 'Legal Policies', pages: legalPolicies.map(p => p.slug) }, null, 2),
    'utf8'
  );

  // 6. FAQs
  const faqsJsonPath = path.join(STATIC_PAGES_DIR, 'faqs.json');
  if (fs.existsSync(faqsJsonPath)) {
    const data = JSON.parse(fs.readFileSync(faqsJsonPath, 'utf8'));
    const blocks = data.widgets?.blocks || (Array.isArray(data.widgets) ? data.widgets : []);
    const md = editorJsToMarkdown(blocks);
    const mdx = `---
title: "Frequently Asked Questions"
description: "Comprehensive Guidance for Parents, Students & Community Partners"
---

${md}
`;
    fs.writeFileSync(path.join(CONTENT_DOCS_DIR, 'faqs.mdx'), mdx, 'utf8');
    console.log('Generated: faqs.mdx');
  }

  // 7. Root index.mdx
  const indexMdx = `---
title: VIDYA SCHOOL Documentation
description: Welcome to VIDYA SCHOOL official platform documentation, user guides, compliance materials, and developer manuals.
---

# VIDYA SCHOOL Documentation

Welcome to the central documentation hub for **VIDYA SCHOOL**. Explore comprehensive guides, role-based onboarding instructions, CBSE statutory disclosures, academic regulations, developer references, and institutional policies.

---

## Documentation Categories

<Cards>
  <Card title="Getting Started" href="/docs/getting-started/overview" description="Platform overview, quick start guides by role, and permission models." />
  <Card title="Account & Authentication" href="/docs/auth/signup" description="Registration, portal login streams, QR authentication, and account approvals." />
  <Card title="Student Guide" href="/docs/student/onboarding" description="Student onboarding, online fee payments, marks, library, and circulars." />
  <Card title="Teacher Guide" href="/docs/teacher/roster" description="Classroom rosters, grade entry, notice publishing, and leave requests." />
  <Card title="Institutional Compliance" href="/docs/compliance/mandatory-disclosure" description="CBSE Appendix IX Mandatory Public Disclosure, affiliation, and audit reports." />
  <Card title="Academics & Rules" href="/docs/academics/fee-structure" description="Fee structure, academic calendars, syllabi, textbooks, and examination rules." />
  <Card title="Admissions" href="/docs/admissions/overview" description="Admission stages, application steps, and eligibility requirements." />
  <Card title="Co-Curricular Activities" href="/docs/co-curriculars/overview" description="Performing arts, STEM robotics, and athletics programs." />
  <Card title="Developers Guide" href="/docs/developers/architecture" description="Full-stack architecture, Next.js frontend, FastAPI engine, and database schema." />
  <Card title="Legal Policies" href="/docs/legal/terms-of-service" description="Terms of service, privacy policy, refund policy, and student safety rules." />
  <Card title="Frequently Asked Questions" href="/docs/faqs" description="Common queries regarding academics, fee collection, admissions, and transport." />
</Cards>
`;
  fs.writeFileSync(path.join(CONTENT_DOCS_DIR, 'index.mdx'), indexMdx, 'utf8');
  console.log('Generated: index.mdx');

  // Remove test.mdx if present
  const testMdxPath = path.join(CONTENT_DOCS_DIR, 'test.mdx');
  if (fs.existsSync(testMdxPath)) {
    fs.unlinkSync(testMdxPath);
    console.log('Removed template: test.mdx');
  }

  // 8. Root meta.json
  const rootMeta = {
    pages: [
      'index',
      'getting-started',
      'auth',
      'student',
      'teacher',
      'compliance',
      'academics',
      'admissions',
      'faqs',
      'co-curriculars',
      'developers',
      'legal'
    ]
  };
  fs.writeFileSync(path.join(CONTENT_DOCS_DIR, 'meta.json'), JSON.stringify(rootMeta, null, 2), 'utf8');
  console.log('Generated: root meta.json');

  console.log('--- Docs Import Completed Successfully ---');
}

main().catch(err => {
  console.error('Error importing docs:', err);
  process.exit(1);
});
