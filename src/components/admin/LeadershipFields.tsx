import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useLeadershipContent } from '../../hooks/useLeadershipContent';

export default function LeadershipFields() {
  const {
    content,
    updateTextContent,
    addMetric,
    updateMetric,
    deleteMetric,
    addPillar,
    updatePillar,
    deletePillar
  } = useLeadershipContent();

  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const [editingPillar, setEditingPillar] = useState<string | null>(null);
  const [editingText, setEditingText] = useState(false);
  
  // Temporary states for editing
  const [tempContent, setTempContent] = useState(content);
  const [tempMetric, setTempMetric] = useState<any>({});
  const [tempPillar, setTempPillar] = useState<any>({});

  // New metric/pillar forms
  const [showNewMetric, setShowNewMetric] = useState(false);
  const [showNewPillar, setShowNewPillar] = useState(false);
  const [newMetric, setNewMetric] = useState({
    icon: 'users',
    label: '',
    value: '',
    description: ''
  });
  const [newPillar, setNewPillar] = useState({
    title: '',
    subtitle: '',
    content: ['']
  });

  const iconOptions = [
    { value: 'users', label: 'Users' },
    { value: 'target', label: 'Target' },
    { value: 'trending-up', label: 'Trending Up' },
    { value: 'award', label: 'Award' },
    { value: 'heart', label: 'Heart' },
    { value: 'zap', label: 'Zap' },
    { value: 'message-circle', label: 'Message Circle' },
    { value: 'calendar', label: 'Calendar' }
  ];

  // Text content handlers
  const handleSaveTextContent = async () => {
    await updateTextContent({
      mainTitle: tempContent.mainTitle,
      mainDescription: tempContent.mainDescription,
      scalingTitle: tempContent.scalingTitle,
      scalingDescription: tempContent.scalingDescription,
      letsTalkTitle: tempContent.letsTalkTitle,
      letsTalkDescription: tempContent.letsTalkDescription,
      letsTalkCTA: tempContent.letsTalkCTA
    });
    setEditingText(false);
  };

  // Metric handlers
  const handleAddMetric = async () => {
    if (newMetric.label && newMetric.value) {
      await addMetric(newMetric);
      setNewMetric({ icon: 'users', label: '', value: '', description: '' });
      setShowNewMetric(false);
    }
  };

  const handleUpdateMetric = async (id: string) => {
    await updateMetric(id, tempMetric);
    setEditingMetric(null);
  };

  const handleReorderMetric = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = content.metrics.findIndex(m => m.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === content.metrics.length - 1)
    ) return;

    const newOrder = [...content.metrics];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
    
    // Update order values
    for (let i = 0; i < newOrder.length; i++) {
      await updateMetric(newOrder[i].id, { order: i + 1 });
    }
  };

  // Pillar handlers
  const handleAddPillar = async () => {
    if (newPillar.title) {
      await addPillar({
        ...newPillar,
        content: newPillar.content.filter(c => c.trim())
      });
      setNewPillar({ title: '', subtitle: '', content: [''] });
      setShowNewPillar(false);
    }
  };

  const handleUpdatePillar = async (id: string) => {
    await updatePillar(id, {
      ...tempPillar,
      content: tempPillar.content.filter((c: string) => c.trim())
    });
    setEditingPillar(null);
  };

  const handleAddPillarContent = (pillarContent: string[], index: number) => {
    const newContent = [...pillarContent];
    newContent.splice(index + 1, 0, '');
    return newContent;
  };

  const handleRemovePillarContent = (pillarContent: string[], index: number) => {
    return pillarContent.filter((_, i) => i !== index);
  };

  return (
    <div className="space-y-8">
      {/* Text Content Section */}
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Text Content</h3>
          {!editingText ? (
            <button
              onClick={() => {
                setTempContent(content);
                setEditingText(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveTextContent}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingText(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {editingText ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Main Title</label>
              <input
                type="text"
                value={tempContent.mainTitle}
                onChange={(e) => setTempContent({ ...tempContent, mainTitle: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Main Description</label>
              <textarea
                value={tempContent.mainDescription}
                onChange={(e) => setTempContent({ ...tempContent, mainDescription: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white h-24"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Scaling Title</label>
              <input
                type="text"
                value={tempContent.scalingTitle}
                onChange={(e) => setTempContent({ ...tempContent, scalingTitle: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Scaling Description</label>
              <input
                type="text"
                value={tempContent.scalingDescription}
                onChange={(e) => setTempContent({ ...tempContent, scalingDescription: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Let's Talk Title</label>
              <input
                type="text"
                value={tempContent.letsTalkTitle}
                onChange={(e) => setTempContent({ ...tempContent, letsTalkTitle: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Let's Talk Description</label>
              <textarea
                value={tempContent.letsTalkDescription}
                onChange={(e) => setTempContent({ ...tempContent, letsTalkDescription: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white h-20"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Let's Talk CTA</label>
              <input
                type="text"
                value={tempContent.letsTalkCTA}
                onChange={(e) => setTempContent({ ...tempContent, letsTalkCTA: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-gray-300">
            <p><strong>Main Title:</strong> {content.mainTitle}</p>
            <p><strong>Main Description:</strong> {content.mainDescription.substring(0, 100)}...</p>
            <p><strong>Let's Talk Title:</strong> {content.letsTalkTitle}</p>
          </div>
        )}
      </div>

      {/* Metrics Section */}
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Impact Metrics</h3>
          <button
            onClick={() => setShowNewMetric(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Metric
          </button>
        </div>

        {/* New Metric Form */}
        {showNewMetric && (
          <div className="mb-4 p-4 bg-black/50 rounded border border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Icon</label>
                <select
                  value={newMetric.icon}
                  onChange={(e) => setNewMetric({ ...newMetric, icon: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                >
                  {iconOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Label</label>
                <input
                  type="text"
                  value={newMetric.label}
                  onChange={(e) => setNewMetric({ ...newMetric, label: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                  placeholder="e.g., Teams Built"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Value</label>
                <input
                  type="text"
                  value={newMetric.value}
                  onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                  placeholder="e.g., 50+"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <input
                  type="text"
                  value={newMetric.description}
                  onChange={(e) => setNewMetric({ ...newMetric, description: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                  placeholder="e.g., from scratch"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddMetric}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowNewMetric(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Metrics List */}
        <div className="space-y-2">
          {[...content.metrics].sort((a, b) => a.order - b.order).map((metric, index) => (
            <div key={metric.id} className="p-4 bg-black/30 rounded border border-gray-700">
              {editingMetric === metric.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Icon</label>
                      <select
                        value={tempMetric.icon}
                        onChange={(e) => setTempMetric({ ...tempMetric, icon: e.target.value })}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                      >
                        {iconOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Label</label>
                      <input
                        type="text"
                        value={tempMetric.label}
                        onChange={(e) => setTempMetric({ ...tempMetric, label: e.target.value })}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Value</label>
                      <input
                        type="text"
                        value={tempMetric.value}
                        onChange={(e) => setTempMetric({ ...tempMetric, value: e.target.value })}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Description</label>
                      <input
                        type="text"
                        value={tempMetric.description}
                        onChange={(e) => setTempMetric({ ...tempMetric, description: e.target.value })}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateMetric(metric.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMetric(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorderMetric(metric.id, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${index === 0 ? 'text-gray-600' : 'text-gray-400 hover:text-white'}`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorderMetric(metric.id, 'down')}
                        disabled={index === content.metrics.length - 1}
                        className={`p-1 rounded ${index === content.metrics.length - 1 ? 'text-gray-600' : 'text-gray-400 hover:text-white'}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-white">
                        <span className="text-gray-400">{metric.icon}</span>
                        <strong>{metric.label}:</strong>
                        <span>{metric.value}</span>
                        <span className="text-gray-400">({metric.description})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTempMetric(metric);
                        setEditingMetric(metric.id);
                      }}
                      className="p-2 text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMetric(metric.id)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pillars Section */}
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Leadership Pillars</h3>
          <button
            onClick={() => setShowNewPillar(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Pillar
          </button>
        </div>

        {/* New Pillar Form */}
        {showNewPillar && (
          <div className="mb-4 p-4 bg-black/50 rounded border border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  value={newPillar.title}
                  onChange={(e) => setNewPillar({ ...newPillar, title: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                  placeholder="e.g., Team Scaling & Organization"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={newPillar.subtitle}
                  onChange={(e) => setNewPillar({ ...newPillar, subtitle: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                  placeholder="e.g., From Zero to Chapter"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Content (bullet points)</label>
                {newPillar.content.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newContent = [...newPillar.content];
                        newContent[idx] = e.target.value;
                        setNewPillar({ ...newPillar, content: newContent });
                      }}
                      className="flex-1 px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                      placeholder="Enter bullet point"
                    />
                    <button
                      onClick={() => {
                        const newContent = handleAddPillarContent(newPillar.content, idx);
                        setNewPillar({ ...newPillar, content: newContent });
                      }}
                      className="p-2 text-green-400 hover:text-green-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {newPillar.content.length > 1 && (
                      <button
                        onClick={() => {
                          const newContent = handleRemovePillarContent(newPillar.content, idx);
                          setNewPillar({ ...newPillar, content: newContent });
                        }}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddPillar}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowNewPillar(false);
                  setNewPillar({ title: '', subtitle: '', content: [''] });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Pillars List */}
        <div className="space-y-4">
          {[...content.pillars].sort((a, b) => a.order - b.order).map((pillar) => (
            <div key={pillar.id} className="p-4 bg-black/30 rounded border border-gray-700">
              {editingPillar === pillar.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Title</label>
                    <input
                      type="text"
                      value={tempPillar.title}
                      onChange={(e) => setTempPillar({ ...tempPillar, title: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Subtitle</label>
                    <input
                      type="text"
                      value={tempPillar.subtitle}
                      onChange={(e) => setTempPillar({ ...tempPillar, subtitle: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Content</label>
                    {tempPillar.content.map((item: string, idx: number) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newContent = [...tempPillar.content];
                            newContent[idx] = e.target.value;
                            setTempPillar({ ...tempPillar, content: newContent });
                          }}
                          className="flex-1 px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                        />
                        <button
                          onClick={() => {
                            const newContent = handleAddPillarContent(tempPillar.content, idx);
                            setTempPillar({ ...tempPillar, content: newContent });
                          }}
                          className="p-2 text-green-400 hover:text-green-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {tempPillar.content.length > 1 && (
                          <button
                            onClick={() => {
                              const newContent = handleRemovePillarContent(tempPillar.content, idx);
                              setTempPillar({ ...tempPillar, content: newContent });
                            }}
                            className="p-2 text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdatePillar(pillar.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPillar(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white font-bold">{pillar.title}</h4>
                      <p className="text-blue-400 text-sm">{pillar.subtitle}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setTempPillar(pillar);
                          setEditingPillar(pillar.id);
                        }}
                        className="p-2 text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePillar(pillar.id)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-400">
                    {pillar.content.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}