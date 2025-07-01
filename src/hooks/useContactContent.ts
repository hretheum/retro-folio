import { useState, useEffect } from 'react';

interface ContactLink {
  id: string;
  icon: string;
  label: string;
  value: string;
  href: string;
  order: number;
}

interface ContactPreference {
  id: string;
  text: string;
  type: 'open' | 'not_interested';
  order: number;
}

interface ContactContent {
  mainTitle: string;
  mainDescription: string;
  statusTitle: string;
  openToTitle: string;
  notInterestedTitle: string;
  aiTitle: string;
  aiDescription: string;
  aiButtonText: string;
  aiModalTitle: string;
  aiModalDescription: string;
  aiModalButtonText: string;
  traditionalTitle: string;
  finalQuote: string;
  contactLinks: ContactLink[];
  preferences: ContactPreference[];
}

const defaultContent: ContactContent = {
  mainTitle: "Let's Talk",
  mainDescription: "Currently leading design at Sportradar while building AI tools. Looking for my next challenge where leadership meets innovation.",
  statusTitle: "Current Status",
  openToTitle: "Open to:",
  notInterestedTitle: "Not interested in:",
  aiTitle: "Try Something Different",
  aiDescription: "Instead of the usual \"let's chat\" email, why not let my AI interview you first? It's like hireverse.app, but for potential collaborators.",
  aiButtonText: "Start AI Conversation",
  aiModalTitle: "AI Interview Coming Soon",
  aiModalDescription: "This feature is being built as part of my 30-day hireverse.app challenge. For now, let's stick to traditional contact methods!",
  aiModalButtonText: "Close",
  traditionalTitle: "Or reach out the traditional way:",
  finalQuote: "\"The future belongs to those who can bridge human creativity with AI capability. Let's build it together.\"",
  contactLinks: [
    {
      id: '1',
      icon: 'mail',
      label: 'Email',
      value: 'eof@offline.pl',
      href: 'mailto:eof@offline.pl',
      order: 1
    },
    {
      id: '2',
      icon: 'linkedin',
      label: 'LinkedIn',
      value: '/in/eofek',
      href: 'https://linkedin.com/in/eofek',
      order: 2
    },
    {
      id: '3',
      icon: 'github',
      label: 'GitLab',
      value: 'gitlab.com/eof3',
      href: 'https://gitlab.com/eof3',
      order: 3
    },
    {
      id: '4',
      icon: 'external-link',
      label: 'Live Build',
      value: 'hireverse.app',
      href: 'https://hireverse.app',
      order: 4
    }
  ],
  preferences: [
    {
      id: '1',
      text: 'Roles where design leadership meets technical innovation',
      type: 'open',
      order: 1
    },
    {
      id: '2',
      text: 'Companies pushing boundaries of human-AI collaboration',
      type: 'open',
      order: 2
    },
    {
      id: '3',
      text: 'Teams that ship, not just strategize',
      type: 'open',
      order: 3
    },
    {
      id: '4',
      text: 'Roles where designers just push pixels',
      type: 'not_interested',
      order: 1
    },
    {
      id: '5',
      text: '"AI strategy" without building',
      type: 'not_interested',
      order: 2
    },
    {
      id: '6',
      text: 'Politics over products',
      type: 'not_interested',
      order: 3
    }
  ]
};

export function useContactContent() {
  const [content, setContent] = useState<ContactContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contact content
  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content/contact');
      if (!response.ok) throw new Error('Failed to fetch contact content');
      
      const data = await response.json();
      if (data && data.length > 0 && data[0].data) {
        setContent(data[0].data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback to localStorage
      const localData = localStorage.getItem('contact-content');
      if (localData) {
        setContent(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  };

  // Save content
  const saveContent = async (newContent: ContactContent) => {
    try {
      const response = await fetch('/api/content/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'contact-main',
          type: 'contact',
          title: 'Contact Content',
          status: 'published',
          data: newContent
        })
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      setContent(newContent);
      // Also save to localStorage as backup
      localStorage.setItem('contact-content', JSON.stringify(newContent));
      
      return true;
    } catch (err) {
      // Fallback to localStorage
      localStorage.setItem('contact-content', JSON.stringify(newContent));
      setContent(newContent);
      return false;
    }
  };

  // Add contact link
  const addContactLink = async (link: Omit<ContactLink, 'id' | 'order'>) => {
    const newLink: ContactLink = {
      ...link,
      id: Date.now().toString(),
      order: content.contactLinks.length + 1
    };
    
    const updatedContent = {
      ...content,
      contactLinks: [...content.contactLinks, newLink]
    };
    
    await saveContent(updatedContent);
  };

  // Update contact link
  const updateContactLink = async (id: string, updates: Partial<ContactLink>) => {
    const updatedContent = {
      ...content,
      contactLinks: content.contactLinks.map(link => 
        link.id === id ? { ...link, ...updates } : link
      )
    };
    
    await saveContent(updatedContent);
  };

  // Delete contact link
  const deleteContactLink = async (id: string) => {
    const updatedContent = {
      ...content,
      contactLinks: content.contactLinks.filter(link => link.id !== id)
    };
    
    await saveContent(updatedContent);
  };

  // Add preference
  const addPreference = async (preference: Omit<ContactPreference, 'id' | 'order'>) => {
    const sameTypePrefs = content.preferences.filter(p => p.type === preference.type);
    const newPreference: ContactPreference = {
      ...preference,
      id: Date.now().toString(),
      order: sameTypePrefs.length + 1
    };
    
    const updatedContent = {
      ...content,
      preferences: [...content.preferences, newPreference]
    };
    
    await saveContent(updatedContent);
  };

  // Update preference
  const updatePreference = async (id: string, updates: Partial<ContactPreference>) => {
    const updatedContent = {
      ...content,
      preferences: content.preferences.map(pref => 
        pref.id === id ? { ...pref, ...updates } : pref
      )
    };
    
    await saveContent(updatedContent);
  };

  // Delete preference
  const deletePreference = async (id: string) => {
    const updatedContent = {
      ...content,
      preferences: content.preferences.filter(pref => pref.id !== id)
    };
    
    await saveContent(updatedContent);
  };

  // Update text content
  const updateTextContent = async (updates: Partial<Omit<ContactContent, 'contactLinks' | 'preferences'>>) => {
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
    addContactLink,
    updateContactLink,
    deleteContactLink,
    addPreference,
    updatePreference,
    deletePreference,
    updateTextContent,
    refetch: fetchContent
  };
}