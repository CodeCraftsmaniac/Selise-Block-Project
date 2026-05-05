import { describe, it, expect } from 'vitest';

const SECTION_TYPES = ['Experience', 'Project', 'Skill', 'Education', 'Custom'];

const SECTION_TEMPLATES: Record<string, { title: string; content: string }[]> = {
  Experience: [
    { title: 'Software Engineer at Company', content: '• Developed and maintained web applications\n• Collaborated with cross-functional teams\n• Improved application performance by 30%' },
    { title: 'Product Designer', content: '• Designed user interfaces for mobile and web\n• Conducted user research and usability testing\n• Created design systems and component libraries' },
  ],
  Project: [
    { title: 'E-commerce Platform', content: '• Built a full-stack e-commerce solution\n• Integrated payment gateways and inventory management\n• Achieved 99.9% uptime' },
    { title: 'Mobile App', content: '• Developed cross-platform mobile application\n• Implemented real-time notifications\n• 10,000+ downloads on app stores' },
  ],
  Skill: [
    { title: 'Technical Skills', content: '• JavaScript / TypeScript\n• React / Next.js\n• Node.js / Express\n• GraphQL / REST APIs' },
    { title: 'Design Skills', content: '• UI/UX Design\n• Figma / Sketch\n• Design Systems\n• Prototyping' },
  ],
  Education: [
    { title: 'Computer Science Degree', content: '• Bachelor of Science in Computer Science\n• GPA: 3.8/4.0\n• Relevant coursework: Algorithms, Data Structures, Software Engineering' },
    { title: 'Certifications', content: '• AWS Certified Solutions Architect\n• Google Cloud Professional\n• Scrum Master Certified' },
  ],
  Custom: [
    { title: 'About Me', content: 'Write a brief description about yourself...' },
    { title: 'Hobbies', content: '• Photography\n• Hiking\n• Reading\n• Cooking' },
  ],
};

describe('Sections Page Constants & Templates', () => {
  it('SECTION_TYPES contains all 5 types', () => {
    expect(SECTION_TYPES).toHaveLength(5);
    expect(SECTION_TYPES).toContain('Experience');
    expect(SECTION_TYPES).toContain('Project');
    expect(SECTION_TYPES).toContain('Skill');
    expect(SECTION_TYPES).toContain('Education');
    expect(SECTION_TYPES).toContain('Custom');
  });

  it('SECTION_TEMPLATES has templates for every SECTION_TYPE', () => {
    SECTION_TYPES.forEach((type) => {
      expect(SECTION_TEMPLATES[type]).toBeDefined();
      expect(SECTION_TEMPLATES[type].length).toBeGreaterThan(0);
    });
  });

  it('each template has title and content', () => {
    Object.values(SECTION_TEMPLATES).forEach((templates) => {
      templates.forEach((template) => {
        expect(template.title).toBeTruthy();
        expect(template.content).toBeTruthy();
      });
    });
  });

  it('Experience templates contain work-related content', () => {
    const experienceTemplates = SECTION_TEMPLATES['Experience'];
    expect(experienceTemplates.length).toBeGreaterThanOrEqual(2);
    experienceTemplates.forEach((t) => {
      expect(t.content).toContain('•');
    });
  });
});
