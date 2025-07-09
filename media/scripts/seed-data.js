// Script to seed initial data for AI integration testing

const sampleData = {
  work: [
    {
      type: 'work',
      title: 'Hireverse - AI Recruitment Platform',
      status: 'published',
      featured: true,
      data: {
        companyTitle: 'Hireverse',
        position: 'Founder & CTO',
        description: 'Building an AI-powered recruitment platform that revolutionizes how companies hire talent. Implemented advanced matching algorithms and natural language processing for resume analysis.',
        insights: [
          'Reduced time-to-hire by 60% through AI automation',
          'Processed over 10,000 applications with 95% accuracy',
          'Built scalable architecture handling 1M+ requests daily'
        ],
        date: '2023-01-01',
        technologies: ['React', 'Node.js', 'Python', 'TensorFlow', 'AWS'],
        link: 'https://hireverse.com'
      }
    },
    {
      type: 'work',
      title: 'Neural Networks Research Lab',
      status: 'published',
      data: {
        companyTitle: 'AI Research Institute',
        position: 'Lead AI Engineer',
        description: 'Led a team developing cutting-edge neural network architectures for computer vision and NLP tasks. Published 3 papers on transformer optimization.',
        insights: [
          'Improved model efficiency by 40% through novel architecture',
          'Mentored 5 junior researchers',
          'Open-sourced key research implementations'
        ],
        date: '2022-06-01',
        technologies: ['PyTorch', 'CUDA', 'C++', 'Python'],
      }
    }
  ],
  timeline: [
    {
      type: 'timeline',
      title: 'Founded Hireverse',
      status: 'published',
      data: {
        label: 'Entrepreneurship',
        content: 'Started Hireverse to solve recruitment challenges using AI',
        date: '2023-01-15'
      }
    },
    {
      type: 'timeline',
      title: 'Joined AI Research Institute',
      status: 'published',
      data: {
        label: 'Career Move',
        content: 'Joined as Lead AI Engineer to work on cutting-edge ML research',
        date: '2022-06-01'
      }
    }
  ],
  experiment: [
    {
      type: 'experiment',
      title: 'GPT-4 Fine-tuning for Code Generation',
      status: 'published',
      featured: true,
      data: {
        description: 'Experimented with fine-tuning GPT-4 for domain-specific code generation. Achieved 85% accuracy in generating valid React components from natural language descriptions.',
        learnings: [
          'Prompt engineering is crucial for consistent outputs',
          'Few-shot learning dramatically improves results',
          'Domain-specific tokens improve generation quality'
        ],
        status: 'completed',
        technologies: ['OpenAI API', 'Python', 'React'],
        date: '2024-01-01'
      }
    }
  ],
  leadership: [
    {
      type: 'leadership',
      title: 'Innovation Through Experimentation',
      status: 'published',
      data: {
        value: 'Continuous Learning',
        description: 'I believe in constantly pushing boundaries and learning from failures. Every experiment teaches valuable lessons.',
        examples: [
          'Implemented weekly hackathons at Hireverse',
          'Maintained a public learning log with 200+ entries',
          'Failed fast with 10+ prototypes before finding product-market fit'
        ],
        category: 'innovation'
      }
    }
  ]
};

async function seedData() {
  const baseUrl = 'https://hretheum.com';
  
  for (const [contentType, items] of Object.entries(sampleData)) {
    console.log(`\nSeeding ${contentType}...`);
    
    for (const item of items) {
      try {
        const response = await fetch(`${baseUrl}/api/content/${contentType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        
        if (response.ok) {
          console.log(`✓ Created: ${item.title}`);
        } else {
          console.error(`✗ Failed to create ${item.title}: ${response.status}`);
        }
      } catch (error) {
        console.error(`✗ Error creating ${item.title}:`, error.message);
      }
    }
  }
  
  console.log('\nSeeding complete!');
}

seedData();