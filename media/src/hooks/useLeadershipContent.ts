import { useState, useEffect } from 'react';

interface LeadershipMetric {
  id: string;
  icon: string;
  label: string;
  value: string;
  description: string;
  order: number;
}

interface LeadershipPillar {
  id: string;
  title: string;
  subtitle: string;
  content: string[]; // Array of bullet points
  order: number;
}

interface LeadershipContent {
  mainTitle: string;
  mainDescription: string;
  letsTalkTitle: string;
  letsTalkDescription: string;
  letsTalkCTA: string;
  metrics: LeadershipMetric[];
  pillars: LeadershipPillar[];
}

const defaultContent: LeadershipContent = {
  mainTitle: "Building Teams That Ship",
  mainDescription: "I don't just manage designers - I build self-organizing teams that deliver. 20+ years of scaling design orgs from 0 to 25+, implementing ways of working that actually work, and bridging the gap between design dreams and agile reality.",
  letsTalkTitle: "Let's Talk Leadership",
  letsTalkDescription: "Whether you're building your first design team or scaling beyond 50, I've been there. Let's discuss how to create teams that not only deliver but thrive.",
  letsTalkCTA: "Schedule a Leadership Chat",
  metrics: [
    { id: '1', icon: 'users', label: 'Teams Built', value: '5', description: 'from scratch', order: 1 },
    { id: '2', icon: 'target', label: 'Designers Managed', value: '50+', description: 'total', order: 2 },
    { id: '3', icon: 'trending-up', label: 'Retention Rate', value: '87%', description: 'average', order: 3 },
    { id: '4', icon: 'award', label: 'Promotions Enabled', value: '30+', description: 'career growth', order: 4 },
    { id: '5', icon: 'heart', label: 'Still in Touch', value: '80%', description: 'former team members', order: 5 }
  ],
  pillars: [
    {
      id: '1',
      title: 'Team Scaling & Organization',
      subtitle: 'From Zero to Chapter',
      content: [
        'Built design teams at ING Bank: 0 → 25 designers in matrix organization',
        'Managing 20+ designers at Sportradar in tribe structure',
        'Created Poland\'s first UX team at Grey/Argonauts',
        'Developed "Hub & Spoke" and "Design Pairs" frameworks'
      ],
      order: 1
    },
    {
      id: '2',
      title: 'Ways of Working',
      subtitle: 'Design ↔ Agile Integration',
      content: [
        'Design Sprints ahead of dev sprints',
        'Dual-track agile with continuous discovery',
        'Design system as living organism',
        '3-amigos sessions that designers actually attend'
      ],
      order: 2
    },
    {
      id: '3',
      title: 'Leadership Philosophy',
      subtitle: 'Lead by Building',
      content: [
        'Still prototype (in React now)',
        'Still run user research',
        'Still code (AI tools currently)',
        'Teams that innovate, not just execute'
      ],
      order: 3
    }
  ]
};

export function useLeadershipContent() {
  const [content, setContent] = useState<LeadershipContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leadership content
  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content/leadership');
      if (!response.ok) throw new Error('Failed to fetch leadership content');
      
      const data = await response.json();
      if (data && data.length > 0 && data[0].data) {
        const fetchedContent = data[0].data;
        // Walidacja - upewnij się, że metrics i pillars są tablicami
        const validatedContent: LeadershipContent = {
          mainTitle: fetchedContent.mainTitle || defaultContent.mainTitle,
          mainDescription: fetchedContent.mainDescription || defaultContent.mainDescription,
          letsTalkTitle: fetchedContent.letsTalkTitle || defaultContent.letsTalkTitle,
          letsTalkDescription: fetchedContent.letsTalkDescription || defaultContent.letsTalkDescription,
          letsTalkCTA: fetchedContent.letsTalkCTA || defaultContent.letsTalkCTA,
          metrics: Array.isArray(fetchedContent.metrics) ? fetchedContent.metrics : defaultContent.metrics,
          pillars: Array.isArray(fetchedContent.pillars) ? fetchedContent.pillars : defaultContent.pillars
        };
        setContent(validatedContent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback to localStorage
      const localData = localStorage.getItem('leadership-content');
      if (localData) {
        setContent(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  };

  // Save content
  const saveContent = async (newContent: LeadershipContent) => {
    try {
      const response = await fetch('/api/content/leadership', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'leadership-main',
          type: 'leadership',
          title: 'Leadership Content',
          status: 'published',
          data: newContent
        })
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      setContent(newContent);
      // Also save to localStorage as backup
      localStorage.setItem('leadership-content', JSON.stringify(newContent));
      
      return true;
    } catch (err) {
      // Fallback to localStorage
      localStorage.setItem('leadership-content', JSON.stringify(newContent));
      setContent(newContent);
      return false;
    }
  };

  // Add metric
  const addMetric = async (metric: Omit<LeadershipMetric, 'id' | 'order'>) => {
    const newMetric: LeadershipMetric = {
      ...metric,
      id: Date.now().toString(),
      order: content.metrics.length + 1
    };
    
    const updatedContent = {
      ...content,
      metrics: [...content.metrics, newMetric]
    };
    
    await saveContent(updatedContent);
  };

  // Update metric
  const updateMetric = async (id: string, updates: Partial<LeadershipMetric>) => {
    const updatedContent = {
      ...content,
      metrics: content.metrics.map(m => m.id === id ? { ...m, ...updates } : m)
    };
    
    await saveContent(updatedContent);
  };

  // Delete metric
  const deleteMetric = async (id: string) => {
    const updatedContent = {
      ...content,
      metrics: content.metrics.filter(m => m.id !== id)
    };
    
    await saveContent(updatedContent);
  };

  // Add pillar
  const addPillar = async (pillar: Omit<LeadershipPillar, 'id' | 'order'>) => {
    const newPillar: LeadershipPillar = {
      ...pillar,
      id: Date.now().toString(),
      order: content.pillars.length + 1
    };
    
    const updatedContent = {
      ...content,
      pillars: [...content.pillars, newPillar]
    };
    
    await saveContent(updatedContent);
  };

  // Update pillar
  const updatePillar = async (id: string, updates: Partial<LeadershipPillar>) => {
    const updatedContent = {
      ...content,
      pillars: content.pillars.map(p => p.id === id ? { ...p, ...updates } : p)
    };
    
    await saveContent(updatedContent);
  };

  // Delete pillar
  const deletePillar = async (id: string) => {
    const updatedContent = {
      ...content,
      pillars: content.pillars.filter(p => p.id !== id)
    };
    
    await saveContent(updatedContent);
  };

  // Update text content
  const updateTextContent = async (updates: Partial<Omit<LeadershipContent, 'metrics' | 'pillars'>>) => {
    const updatedContent = {
      ...content,
      ...updates
    };
    
    await saveContent(updatedContent);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    loading,
    error,
    addMetric,
    updateMetric,
    deleteMetric,
    addPillar,
    updatePillar,
    deletePillar,
    updateTextContent,
    refetch: fetchContent
  };
}