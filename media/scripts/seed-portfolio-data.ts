import { createClient } from 'redis';
import type { ExtractedContent } from '../lib/content-extractor';

// Przykładowe dane portfolio z product design i AI agents
const portfolioProjects = [
  {
    id: 'hireverse-ai',
    companyTitle: 'Hireverse.app',
    position: 'Founder & Product Designer',
    date: '2024-present',
    description: `Hireverse to rewolucyjny AI recruiter, który odwraca tradycyjny proces rekrutacji. Zamiast kandydatów aplikujących do firm, to firmy aplikują do kandydatów. System wykorzystuje zaawansowane modele językowe do analizy profili kandydatów i automatycznego matchowania z odpowiednimi ofertami pracy. Jako founder i główny designer, odpowiadam za całą architekturę produktu, UX/UI design oraz strategię produktową.`,
    insights: [
      'Zaprojektowałem innowacyjny interfejs konwersacyjny, który pozwala kandydatom naturalnie opisać swoje oczekiwania wobec pracy',
      'Stworzyłem system wizualizacji dopasowania ofert wykorzystujący ML scoring',
      'Wdrożyłem design system oparty na komponentach, który skaluje się wraz z rozwojem produktu',
      'Przeprowadziłem ponad 50 wywiadów z użytkownikami, co doprowadziło do 3 pivotów produktowych'
    ],
    technologies: ['React', 'TypeScript', 'OpenAI API', 'Supabase', 'Tailwind CSS', 'Vercel'],
    featured: true
  },
  {
    id: 'vw-design-system',
    companyTitle: 'Volkswagen Digital',
    position: 'Design Lead',
    date: '2021-2023',
    description: `Jako Design Lead w Volkswagen Digital, prowadziłem zespół odpowiedzialny za tworzenie unified design system dla wszystkich cyfrowych produktów VW Group. System obsługiwał ponad 20 aplikacji i był używany przez ponad 100 developerów. Skalowałem zespół z 3 do 12 designerów, utrzymując zero turnover przez 2 lata.`,
    insights: [
      'Zbudowałem design system od podstaw, który zredukował czas developmentu nowych features o 40%',
      'Wprowadziłem procesy design review i critique sessions, które podniosły jakość outputu zespołu',
      'Stworzyłem framework do mierzenia ROI design system - oszczędności rzędu 2M EUR rocznie',
      'Mentorowałem junior designers, z których 3 awansowało na senior positions w ciągu 18 miesięcy'
    ],
    technologies: ['Figma', 'Storybook', 'React', 'Angular', 'Design Tokens', 'Zero Height'],
    featured: true
  },
  {
    id: 'polsat-box-go',
    companyTitle: 'Polsat Box Go',
    position: 'Senior Product Designer',
    date: '2018-2021',
    description: `Odpowiadałem za redesign platformy streamingowej Polsat Box Go, która obsługuje ponad 2 miliony aktywnych użytkowników. Projekt obejmował kompletny redesign aplikacji na Smart TV, mobile i web. Zwiększyliśmy retention o 45% i NPS z 32 do 67 punktów.`,
    insights: [
      'Zaprojektowałem nowy system rekomendacji content bazujący na ML, który zwiększył watch time o 60%',
      'Uprościłem user journey z 7 do 3 kroków dla key user flows',
      'Stworzyłem accessibility guidelines - pierwsza polska platforma VOD z pełnym wsparciem dla niepełnosprawnych',
      'Wdrożyłem A/B testing framework, który pozwolił na data-driven decision making'
    ],
    technologies: ['Sketch', 'Principle', 'Maze', 'Hotjar', 'Google Analytics', 'React Native'],
    featured: true
  },
  {
    id: 'ai-assistant-banking',
    companyTitle: 'mBank',
    position: 'Product Design Consultant',
    date: '2023',
    description: `Konsultowałem przy projekcie wdrożenia AI assistant dla klientów mBanku. Assistant wykorzystuje GPT-4 do odpowiadania na pytania klientów i pomocy w codziennych operacjach bankowych. Projekt objął ponad 3 miliony użytkowników aplikacji mobilnej.`,
    insights: [
      'Zaprojektowałem conversational UI, który redukuje cognitive load przy skomplikowanych operacjach finansowych',
      'Stworzyłem system safeguards i error handling dla krytycznych operacji finansowych',
      'Przeprowadziłem usability testing z 200+ użytkownikami, iterując design 5 razy',
      'Osiągnęliśmy 85% success rate w pierwszej interakcji z assistantem'
    ],
    technologies: ['Figma', 'OpenAI API', 'React', 'Node.js', 'Jest', 'Playwright'],
    featured: false
  },
  {
    id: 'tvp-vod-accessibility',
    companyTitle: 'TVP VOD',
    position: 'UX/UI Designer',
    date: '2017-2018',
    description: `Prowadziłem projekt wprowadzenia pełnej dostępności w TVP VOD - pierwszej polskiej platformie streamingowej z audio deskrypcją i napisami dla niesłyszących. Projekt wymagał ścisłej współpracy z organizacjami pozarządowymi i społecznością osób niepełnosprawnych.`,
    insights: [
      'Zaprojektowałem interfejs spełniający WCAG 2.1 na poziomie AAA',
      'Stworzyłem system audio navigation dla użytkowników niewidomych',
      'Wdrożyłem color blind mode i high contrast themes',
      'Projekt otrzymał nagrodę "Dostępna Strona Roku 2018"'
    ],
    technologies: ['Adobe XD', 'NVDA', 'JAWS', 'axe DevTools', 'HTML5', 'ARIA'],
    featured: false
  },
  {
    id: 'ai-code-reviewer',
    companyTitle: 'GitLab',
    position: 'Contract Product Designer',
    date: '2023',
    description: `Projektowałem interfejs dla AI-powered code review tool w GitLab. Narzędzie wykorzystuje LLM do automatycznej analizy merge requests i sugerowania ulepszeń kodu. System analizuje średnio 10,000 PR dziennie.`,
    insights: [
      'Zaprojektowałem non-intrusive UI, który nie przeszkadza w naturalnym flow code review',
      'Stworzyłem system priorytetyzacji sugestii AI bazując na severity i confidence score',
      'Zintegrowałem feedback loop pozwalający użytkownikom trenować model',
      'Osiągnęliśmy 72% acceptance rate dla sugestii AI'
    ],
    technologies: ['Figma', 'GitLab Design System', 'Vue.js', 'GraphQL', 'Python'],
    featured: false
  },
  {
    id: 'autonomous-agents-platform',
    companyTitle: 'Cognition Labs',
    position: 'Senior Product Designer',
    date: '2024',
    description: `Pracowałem nad platformą do tworzenia i zarządzania autonomous AI agents dla enterprise. Platforma pozwala non-technical users tworzyć złożone workflows wykorzystujące multiple AI models. System obsługuje ponad 500 enterprise clients.`,
    insights: [
      'Zaprojektowałem visual programming interface dla tworzenia agent workflows',
      'Stworzyłem system monitorowania i debugowania działania agentów w real-time',
      'Uprościłem onboarding z 2 godzin do 15 minut dla average user',
      'Zbudowałem library 50+ pre-built agent templates dla common use cases'
    ],
    technologies: ['React', 'D3.js', 'WebSockets', 'Docker', 'Kubernetes', 'LangChain'],
    featured: true
  },
  {
    id: 'design-tokens-automation',
    companyTitle: 'Spotify',
    position: 'Design Systems Consultant',
    date: '2022',
    description: `Konsultowałem przy projekcie automatyzacji design tokens w Spotify Design System. Stworzyłem narzędzia do automatycznej synchronizacji między Figma a code repositories, eliminując manual handoff między designers i developers.`,
    insights: [
      'Zautomatyzowałem 95% procesu update design tokens',
      'Zredukowałem inconsistencies między design i code o 88%',
      'Stworzyłem CI/CD pipeline dla design system updates',
      'Skróciłem czas wdrażania design changes z dni do minut'
    ],
    technologies: ['Figma API', 'Style Dictionary', 'GitHub Actions', 'TypeScript', 'Node.js'],
    featured: false
  },
  {
    id: 'ai-shopping-assistant',
    companyTitle: 'Allegro',
    position: 'Lead Product Designer',
    date: '2023-2024',
    description: `Prowadziłem design zespół pracujący nad AI shopping assistant dla Allegro. Assistant pomaga użytkownikom znaleźć idealne produkty poprzez naturalne konwersacje. System obsługuje 20M+ aktywnych użytkowników miesięcznie.`,
    insights: [
      'Zaprojektowałem multimodal interface łączący chat, voice i visual search',
      'Stworzyłem personalization engine bazujący na shopping behavior',
      'Zwiększyłem conversion rate o 34% dla users korzystających z assistanta',
      'Zbudowałem trust indicators dla AI-generated product recommendations'
    ],
    technologies: ['Figma', 'Framer', 'React', 'TensorFlow.js', 'Elasticsearch', 'Redis'],
    featured: true
  },
  {
    id: 'healthcare-ai-diagnostics',
    companyTitle: 'Infermedica',
    position: 'Product Design Lead',
    date: '2020-2021',
    description: `Prowadziłem redesign AI-powered symptom checker używanego przez 15M+ użytkowników globalnie. System wykorzystuje ML do wstępnej diagnozy i kierowania pacjentów do odpowiednich specjalistów.`,
    insights: [
      'Zaprojektowałem empathetic conversational flow dla sensitive health topics',
      'Stworzyłem visual representation złożonych medical conditions',
      'Zwiększyłem completion rate symptom assessment z 45% do 78%',
      'Wdrożyłem multilingual support dla 12 języków z cultural adaptations'
    ],
    technologies: ['Sketch', 'InVision', 'React', 'Python', 'TensorFlow', 'PostgreSQL'],
    featured: false
  },
  {
    id: 'fintech-robo-advisor',
    companyTitle: 'Revolut',
    position: 'Senior Product Designer',
    date: '2022',
    description: `Projektowałem interfejs dla AI-powered robo-advisor w Revolut. System automatycznie zarządza portfolio inwestycyjnym użytkowników bazując na ich risk profile i celach finansowych. Feature używany przez 2M+ użytkowników.`,
    insights: [
      'Zaprojektowałem educational onboarding redukujący investment anxiety',
      'Stworzyłem real-time portfolio visualization z predictive analytics',
      'Uprościłem complex financial concepts poprzez progressive disclosure',
      'Osiągnęliśmy 65% adoption rate wśród eligible users'
    ],
    technologies: ['Figma', 'Lottie', 'React Native', 'D3.js', 'Python', 'AWS'],
    featured: false
  },
  {
    id: 'ai-content-moderation',
    companyTitle: 'Meta',
    position: 'Contract UX Designer',
    date: '2023',
    description: `Pracowałem nad redesign content moderation tools wykorzystujących AI do automatycznej detekcji harmful content. System przetwarza miliardy posts dziennie across Facebook i Instagram.`,
    insights: [
      'Zaprojektowałem human-in-the-loop interface dla edge cases',
      'Stworzyłem explainable AI dashboard pokazujący reasoning behind decisions',
      'Zredukowałem moderator fatigue poprzez better information hierarchy',
      'Zwiększyłem accuracy human reviews o 23% poprzez better context presentation'
    ],
    technologies: ['Figma', 'React', 'PyTorch', 'GraphQL', 'Cassandra', 'Kafka'],
    featured: false
  },
  {
    id: 'smart-home-ai',
    companyTitle: 'Google Nest',
    position: 'Senior Interaction Designer',
    date: '2021-2022',
    description: `Projektowałem interactions dla next-gen Google Nest Hub z advanced AI capabilities. Device wykorzystuje on-device ML do uczenia się rutyn użytkowników i proaktywnego sugerowania akcji.`,
    insights: [
      'Zaprojektowałem ambient computing interface minimalizujący interruptions',
      'Stworzyłem gesture-based controls dla hands-free interactions',
      'Zbudowałem privacy-first design z clear data usage indicators',
      'Osiągnęliśmy 89% satisfaction score w user studies'
    ],
    technologies: ['Material Design', 'Flutter', 'TensorFlow Lite', 'Arduino', 'C++'],
    featured: false
  },
  {
    id: 'ai-learning-platform',
    companyTitle: 'Coursera',
    position: 'Lead Product Designer',
    date: '2022-2023',
    description: `Prowadziłem design AI-powered personalized learning platform na Coursera. System adaptuje content i pacing do individual learning styles, obsługując 100M+ learners globally.`,
    insights: [
      'Zaprojektowałem adaptive UI dostosowujący się do learning preferences',
      'Stworzyłem motivation system bazujący na behavioral psychology',
      'Zwiększyłem course completion rates o 42% poprzez personalization',
      'Zbudowałem peer learning features wzmacniane przez AI matching'
    ],
    technologies: ['Figma', 'React', 'Python', 'TensorFlow', 'Neo4j', 'Kubernetes'],
    featured: true
  },
  {
    id: 'enterprise-ai-search',
    companyTitle: 'Elastic',
    position: 'Principal Designer',
    date: '2024',
    description: `Zaprojektowałem next-generation enterprise search wykorzystujący semantic AI do understanding user intent. System integruje się z 200+ data sources i obsługuje natural language queries.`,
    insights: [
      'Stworzyłem unified search experience across structured i unstructured data',
      'Zaprojektowałem query builder dla non-technical users',
      'Wdrożyłem relevance tuning interface z real-time preview',
      'Osiągnęliśmy 3x improvement w search satisfaction scores'
    ],
    technologies: ['Figma', 'Elasticsearch', 'React', 'Python', 'BERT', 'Kubernetes'],
    featured: false
  }
];

// Dodatkowe dane leadership dla kontekstu
const leadershipPrinciples = [
  {
    id: 'servant-leadership',
    title: 'Servant Leadership',
    category: 'Leadership Philosophy',
    value: 'Lider istnieje po to, żeby zespół odniósł sukces',
    description: 'Wierzę, że rola lidera to przede wszystkim usuwanie przeszkód i tworzenie warunków do rozwoju zespołu. W VW Digital przez 2 lata utrzymywałem zero turnover, bo skupiałem się na rozwoju każdego członka zespołu.',
    examples: [
      'Wprowadzenie 1:1 sessions focused na karierze, nie tylko taskach',
      'Stworzenie design critique culture opartej na psychological safety',
      'Delegowanie high-visibility projektów do team members dla ich rozwoju',
      'Regular feedback sessions - both ways'
    ]
  },
  {
    id: 'data-driven-design',
    title: 'Data-Driven Design',
    category: 'Design Methodology',
    value: 'Intuicja podparta danymi',
    description: 'Design decisions powinny być oparte na danych, ale nie ograniczone przez nie. Używam mixed-methods research łącząc quantitative i qualitative insights.',
    examples: [
      'W Polsat Box Go: A/B testing każdego major feature',
      'Hireverse: 50+ user interviews przed pierwszym prototype',
      'VW Digital: Design metrics dashboard dla całego zespołu',
      'Regular usability testing z minimum 5 users per iteration'
    ]
  },
  {
    id: 'systems-thinking',
    title: 'Systems Thinking',
    category: 'Design Approach',
    value: 'Myślenie w skali systemu, nie pojedynczych features',
    description: 'Każdy design decision ma ripple effects. Projektując myślę o całym ekosystemie produktu i jak zmiany wpłyną na innych użytkowników i systemy.',
    examples: [
      'Design System w VW skalujący na 20+ aplikacji',
      'Component library z clear governance model',
      'Design tokens automatycznie synchronizowane z code',
      'Accessibility jako core principle, nie afterthought'
    ]
  }
];

// Timeline events dla kontekstu
const timelineEvents = [
  {
    id: 'design-beginning',
    date: '2004',
    title: 'Początek przygody z designem',
    label: 'Career Start',
    content: 'Zacząłem jako freelance web designer, ucząc się HTML/CSS w notepadzie. Pierwsze projekty to strony dla lokalnych firm.'
  },
  {
    id: 'first-startup',
    date: '2008',
    title: 'Pierwsza własna firma',
    label: 'Entrepreneurship',
    content: 'Założyłem agencję digital design. Nauczyłem się że bycie dobrym designerem to nie wszystko - trzeba umieć zarządzać biznesem i ludźmi.'
  },
  {
    id: 'pivot-to-product',
    date: '2015',
    title: 'Pivot do Product Design',
    label: 'Career Evolution',
    content: 'Przeszedłem z agency world do product companies. Zrozumiałem różnicę między "pretty pixels" a solving real user problems.'
  }
];

async function seedPortfolioData() {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl) {
    console.error('No Redis URL configured');
    return;
  }

  const client = createClient({ url: redisUrl });
  
  try {
    await client.connect();
    console.log('Connected to Redis');

    // Save work/portfolio data
    await client.set('content:work', JSON.stringify(portfolioProjects));
    console.log(`Saved ${portfolioProjects.length} portfolio projects`);

    // Save leadership data
    await client.set('content:leadership', JSON.stringify(leadershipPrinciples));
    console.log(`Saved ${leadershipPrinciples.length} leadership principles`);

    // Save timeline data
    await client.set('content:timeline', JSON.stringify(timelineEvents));
    console.log(`Saved ${timelineEvents.length} timeline events`);

    // Verify data was saved
    const savedWork = await client.get('content:work');
    const savedLeadership = await client.get('content:leadership');
    const savedTimeline = await client.get('content:timeline');

    console.log('\nVerification:');
    console.log('- Work data saved:', savedWork ? JSON.parse(savedWork).length + ' items' : 'ERROR');
    console.log('- Leadership data saved:', savedLeadership ? JSON.parse(savedLeadership).length + ' items' : 'ERROR');
    console.log('- Timeline data saved:', savedTimeline ? JSON.parse(savedTimeline).length + ' items' : 'ERROR');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.disconnect();
    console.log('\nDisconnected from Redis');
  }
}

// Run the seeding
seedPortfolioData().catch(console.error);