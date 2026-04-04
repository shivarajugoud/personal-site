import { Download, Briefcase, GraduationCap, Award } from 'lucide-react'

const experience = [
  {
    role: 'Software Engineer',
    company: 'Your Company',
    period: 'Jan 2024 — Present',
    location: 'Hyderabad, India',
    bullets: [
      'Built and shipped feature X that improved Y by Z%.',
      'Led migration from legacy system to microservices architecture.',
      'Mentored 2 junior engineers; introduced code review standards.',
    ],
    stack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
  },
  {
    role: 'SDE Intern',
    company: 'Another Company',
    period: 'May 2023 — Aug 2023',
    location: 'Remote',
    bullets: [
      'Developed REST APIs serving 10k+ requests per day.',
      'Reduced build time by 30% by optimising CI pipeline.',
    ],
    stack: ['Python', 'FastAPI', 'Redis'],
  },
]

const education = [
  {
    degree: 'B.Tech Computer Science',
    school: 'Your University',
    period: '2020 — 2024',
    gpa: '8.9 / 10',
    notes: 'Relevant coursework: DSA, OS, DBMS, Networks, ML',
  },
]

const skills = {
  'Languages':      ['Python', 'JavaScript', 'TypeScript', 'C++', 'SQL'],
  'Frontend':       ['React', 'Vite', 'Tailwind CSS', 'Next.js'],
  'Backend':        ['Node.js', 'FastAPI', 'Express', 'GraphQL'],
  'Databases':      ['PostgreSQL', 'MySQL', 'Redis', 'MongoDB'],
  'DevOps / Cloud': ['Docker', 'GitHub Actions', 'AWS (EC2, S3)', 'Vercel'],
  'Tools':          ['Git', 'Postman', 'Figma', 'Linux'],
}

const badgeColors = [
  'badge-green', 'badge-blue', 'badge-purple', 'badge-yellow',
  'badge-green', 'badge-blue',
]

export default function Resume() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title mb-1">Resume</h1>
          <p className="text-gray-500 text-sm font-mono">Last updated April 2026</p>
        </div>
        <a
          href="/resume.pdf"
          download
          className="btn-ghost flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          PDF
        </a>
      </div>

      {/* Experience */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Briefcase className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg font-semibold text-white">Experience</h2>
        </div>
        <div className="space-y-5">
          {experience.map((exp, i) => (
            <div key={i} className="card relative">
              <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-accent/30 rounded-full -ml-px hidden md:block" style={{left: '-1.5rem'}} />
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-3">
                <div>
                  <h3 className="font-semibold text-white">{exp.role}</h3>
                  <p className="text-accent text-sm font-mono">{exp.company}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-gray-500">{exp.period}</p>
                  <p className="text-xs text-gray-600">{exp.location}</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-3">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="text-sm text-gray-400 flex gap-2">
                    <span className="text-accent mt-1.5 shrink-0">›</span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1.5">
                {exp.stack.map(t => <span key={t} className="badge-green">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <GraduationCap className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg font-semibold text-white">Education</h2>
        </div>
        {education.map((edu, i) => (
          <div key={i} className="card">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 mb-2">
              <div>
                <h3 className="font-semibold text-white">{edu.degree}</h3>
                <p className="text-accent text-sm font-mono">{edu.school}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-gray-500">{edu.period}</p>
                <p className="text-xs text-emerald-400">GPA: {edu.gpa}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{edu.notes}</p>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg font-semibold text-white">Skills</h2>
        </div>
        <div className="card space-y-4">
          {Object.entries(skills).map(([cat, items], i) => (
            <div key={cat} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-xs font-mono text-gray-600 w-32 shrink-0">{cat}</span>
              <div className="flex flex-wrap gap-1.5">
                {items.map(s => (
                  <span key={s} className={badgeColors[i % badgeColors.length]}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
