export interface IntentHierarchy {
  id: string;
  name: string;
  description: string;
  level: 1 | 2 | 3;
  parent?: string;
  children?: string[];
  keywords: string[];
  examples: string[];
  confidence_threshold: number;
}

export const INTENT_HIERARCHY: IntentHierarchy[] = [
  // Level 1 - Domains
  {
    id: 'professional',
    name: 'Professional Inquiry',
    description: 'Questions about professional experience, skills, and career',
    level: 1,
    children: ['experience', 'skills', 'projects'],
    keywords: ['work', 'experience', 'career', 'professional', 'job', 'employment'],
    examples: ['Tell me about your work experience', 'What are your skills?'],
    confidence_threshold: 0.7
  },
  {
    id: 'technical',
    name: 'Technical Discussion',
    description: 'Technical questions about programming, technologies, and tools',
    level: 1,
    children: ['programming', 'technologies', 'tools'],
    keywords: ['code', 'programming', 'technical', 'technology', 'development'],
    examples: ['What programming languages do you know?', 'Tell me about your technical stack'],
    confidence_threshold: 0.7
  },
  {
    id: 'personal',
    name: 'Personal Information',
    description: 'Questions about personal interests, background, and general information',
    level: 1,
    children: ['background', 'interests', 'contact'],
    keywords: ['personal', 'about', 'yourself', 'background', 'interests'],
    examples: ['Tell me about yourself', 'What are your hobbies?'],
    confidence_threshold: 0.7
  },
  {
    id: 'collaboration',
    name: 'Collaboration Inquiry',
    description: 'Questions about working together, projects, and business opportunities',
    level: 1,
    children: ['projects', 'business', 'contact'],
    keywords: ['collaboration', 'project', 'work together', 'business', 'opportunity'],
    examples: ['Can we work together?', 'I have a project idea'],
    confidence_threshold: 0.7
  },

  // Level 2 - Categories
  {
    id: 'experience',
    name: 'Work Experience',
    description: 'Questions about past work experience and career history',
    level: 2,
    parent: 'professional',
    children: ['current_role', 'past_roles', 'achievements'],
    keywords: ['experience', 'work', 'career', 'history', 'previous', 'current'],
    examples: ['What is your current role?', 'Tell me about your work history'],
    confidence_threshold: 0.75
  },
  {
    id: 'skills',
    name: 'Skills and Competencies',
    description: 'Questions about technical and soft skills',
    level: 2,
    parent: 'professional',
    children: ['technical_skills', 'soft_skills', 'certifications'],
    keywords: ['skills', 'competencies', 'abilities', 'expertise', 'qualifications'],
    examples: ['What are your main skills?', 'Do you have any certifications?'],
    confidence_threshold: 0.75
  },
  {
    id: 'projects',
    name: 'Project Portfolio',
    description: 'Questions about specific projects and work samples',
    level: 2,
    parent: 'professional',
    children: ['recent_projects', 'notable_projects', 'project_details'],
    keywords: ['projects', 'portfolio', 'work', 'examples', 'samples'],
    examples: ['Show me your projects', 'What projects have you worked on?'],
    confidence_threshold: 0.75
  },
  {
    id: 'programming',
    name: 'Programming Languages',
    description: 'Questions about programming languages and coding experience',
    level: 2,
    parent: 'technical',
    children: ['languages', 'frameworks', 'coding_style'],
    keywords: ['programming', 'languages', 'coding', 'development', 'syntax'],
    examples: ['What programming languages do you know?', 'How do you approach coding?'],
    confidence_threshold: 0.75
  },
  {
    id: 'technologies',
    name: 'Technologies and Frameworks',
    description: 'Questions about specific technologies, frameworks, and tools',
    level: 2,
    parent: 'technical',
    children: ['frontend', 'backend', 'databases'],
    keywords: ['technologies', 'frameworks', 'tools', 'stack', 'platform'],
    examples: ['What technologies do you use?', 'Tell me about your tech stack'],
    confidence_threshold: 0.75
  },
  {
    id: 'tools',
    name: 'Development Tools',
    description: 'Questions about development tools, IDEs, and workflow',
    level: 2,
    parent: 'technical',
    children: ['ides', 'version_control', 'deployment'],
    keywords: ['tools', 'IDE', 'editor', 'workflow', 'development'],
    examples: ['What tools do you use for development?', 'How do you manage your code?'],
    confidence_threshold: 0.75
  },
  {
    id: 'background',
    name: 'Personal Background',
    description: 'Questions about personal history, education, and background',
    level: 2,
    parent: 'personal',
    children: ['education', 'location', 'journey'],
    keywords: ['background', 'education', 'history', 'personal', 'journey'],
    examples: ['Tell me about your background', 'Where did you study?'],
    confidence_threshold: 0.75
  },
  {
    id: 'interests',
    name: 'Personal Interests',
    description: 'Questions about hobbies, interests, and personal preferences',
    level: 2,
    parent: 'personal',
    children: ['hobbies', 'preferences', 'lifestyle'],
    keywords: ['interests', 'hobbies', 'personal', 'preferences', 'lifestyle'],
    examples: ['What are your hobbies?', 'What do you like to do in your free time?'],
    confidence_threshold: 0.75
  },
  {
    id: 'contact',
    name: 'Contact Information',
    description: 'Questions about how to get in touch or contact information',
    level: 2,
    parent: 'personal',
    children: ['email', 'social', 'availability'],
    keywords: ['contact', 'email', 'reach', 'touch', 'communication'],
    examples: ['How can I contact you?', 'What is your email?'],
    confidence_threshold: 0.75
  },
  {
    id: 'business',
    name: 'Business Opportunities',
    description: 'Questions about business collaboration and opportunities',
    level: 2,
    parent: 'collaboration',
    children: ['consulting', 'partnerships', 'services'],
    keywords: ['business', 'opportunities', 'collaboration', 'consulting', 'services'],
    examples: ['Do you offer consulting services?', 'Can we partner on a project?'],
    confidence_threshold: 0.75
  },

  // Level 3 - Specific Intents
  {
    id: 'current_role',
    name: 'Current Role',
    description: 'Questions about current job position and responsibilities',
    level: 3,
    parent: 'experience',
    keywords: ['current', 'role', 'position', 'job', 'responsibilities', 'now'],
    examples: ['What is your current role?', 'What do you do now?', 'Tell me about your current position'],
    confidence_threshold: 0.8
  },
  {
    id: 'past_roles',
    name: 'Past Roles',
    description: 'Questions about previous work experience and career history',
    level: 3,
    parent: 'experience',
    keywords: ['past', 'previous', 'history', 'before', 'worked', 'experience'],
    examples: ['What did you do before?', 'Tell me about your work history', 'What was your previous role?'],
    confidence_threshold: 0.8
  },
  {
    id: 'achievements',
    name: 'Professional Achievements',
    description: 'Questions about accomplishments and notable achievements',
    level: 3,
    parent: 'experience',
    keywords: ['achievements', 'accomplishments', 'success', 'awards', 'recognition'],
    examples: ['What are your biggest achievements?', 'Tell me about your accomplishments'],
    confidence_threshold: 0.8
  },
  {
    id: 'technical_skills',
    name: 'Technical Skills',
    description: 'Questions about specific technical competencies',
    level: 3,
    parent: 'skills',
    keywords: ['technical', 'skills', 'programming', 'development', 'expertise'],
    examples: ['What are your technical skills?', 'What programming skills do you have?'],
    confidence_threshold: 0.8
  },
  {
    id: 'soft_skills',
    name: 'Soft Skills',
    description: 'Questions about interpersonal and communication skills',
    level: 3,
    parent: 'skills',
    keywords: ['soft', 'skills', 'communication', 'teamwork', 'leadership'],
    examples: ['What are your soft skills?', 'How do you work in a team?'],
    confidence_threshold: 0.8
  },
  {
    id: 'certifications',
    name: 'Certifications',
    description: 'Questions about professional certifications and qualifications',
    level: 3,
    parent: 'skills',
    keywords: ['certifications', 'qualifications', 'certificates', 'credentials'],
    examples: ['Do you have any certifications?', 'What qualifications do you have?'],
    confidence_threshold: 0.8
  },
  {
    id: 'recent_projects',
    name: 'Recent Projects',
    description: 'Questions about current or recent project work',
    level: 3,
    parent: 'projects',
    keywords: ['recent', 'current', 'projects', 'latest', 'working'],
    examples: ['What projects are you working on?', 'Tell me about your recent work'],
    confidence_threshold: 0.8
  },
  {
    id: 'notable_projects',
    name: 'Notable Projects',
    description: 'Questions about significant or impressive projects',
    level: 3,
    parent: 'projects',
    keywords: ['notable', 'impressive', 'significant', 'best', 'favorite'],
    examples: ['What is your most impressive project?', 'Tell me about your best work'],
    confidence_threshold: 0.8
  },
  {
    id: 'project_details',
    name: 'Project Details',
    description: 'Questions about specific project details and implementation',
    level: 3,
    parent: 'projects',
    keywords: ['details', 'implementation', 'how', 'built', 'developed'],
    examples: ['How did you build this project?', 'Tell me the details of this project'],
    confidence_threshold: 0.8
  }
];

export class IntentHierarchyManager {
  private hierarchy: Map<string, IntentHierarchy> = new Map();
  private levelMap: Map<number, IntentHierarchy[]> = new Map();
  
  constructor() {
    this.loadHierarchy();
  }
  
  private loadHierarchy(): void {
    // Load hierarchy into maps for efficient access
    INTENT_HIERARCHY.forEach(intent => {
      this.hierarchy.set(intent.id, intent);
      
      if (!this.levelMap.has(intent.level)) {
        this.levelMap.set(intent.level, []);
      }
      this.levelMap.get(intent.level)!.push(intent);
    });
  }
  
  getIntentById(id: string): IntentHierarchy | undefined {
    return this.hierarchy.get(id);
  }
  
  getIntentsByLevel(level: 1 | 2 | 3): IntentHierarchy[] {
    return this.levelMap.get(level) || [];
  }
  
  getChildrenOf(parentId: string): IntentHierarchy[] {
    const parent = this.hierarchy.get(parentId);
    if (!parent || !parent.children) return [];
    
    return parent.children
      .map(childId => this.hierarchy.get(childId))
      .filter(child => child !== undefined) as IntentHierarchy[];
  }
  
  getParentOf(childId: string): IntentHierarchy | undefined {
    const child = this.hierarchy.get(childId);
    if (!child || !child.parent) return undefined;
    
    return this.hierarchy.get(child.parent);
  }
  
  getHierarchyPath(intentId: string): IntentHierarchy[] {
    const path: IntentHierarchy[] = [];
    let current = this.hierarchy.get(intentId);
    
    while (current) {
      path.unshift(current);
      current = current.parent ? this.hierarchy.get(current.parent) : undefined;
    }
    
    return path;
  }
  
  getAllIntents(): IntentHierarchy[] {
    return Array.from(this.hierarchy.values());
  }
  
  searchIntentsByKeyword(keyword: string): IntentHierarchy[] {
    const results: IntentHierarchy[] = [];
    const lowerKeyword = keyword.toLowerCase();
    
    this.hierarchy.forEach(intent => {
      const matchesKeyword = intent.keywords.some(k => 
        k.toLowerCase().includes(lowerKeyword)
      );
      const matchesExample = intent.examples.some(e => 
        e.toLowerCase().includes(lowerKeyword)
      );
      
      if (matchesKeyword || matchesExample) {
        results.push(intent);
      }
    });
    
    return results;
  }
  
  validateHierarchy(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for orphaned children
    this.hierarchy.forEach(intent => {
      if (intent.parent && !this.hierarchy.has(intent.parent)) {
        errors.push(`Intent ${intent.id} has non-existent parent: ${intent.parent}`);
      }
      
      if (intent.children) {
        intent.children.forEach(childId => {
          if (!this.hierarchy.has(childId)) {
            errors.push(`Intent ${intent.id} has non-existent child: ${childId}`);
          }
        });
      }
    });
    
    // Check for circular references
    this.hierarchy.forEach(intent => {
      const visited = new Set<string>();
      let current = intent;
      
      while (current && current.parent) {
        if (visited.has(current.id)) {
          errors.push(`Circular reference detected involving intent: ${intent.id}`);
          break;
        }
        visited.add(current.id);
        current = this.hierarchy.get(current.parent) || undefined;
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}