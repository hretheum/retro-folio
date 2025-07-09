import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useContactContent } from '../../hooks/useContactContent';

export default function ContactFields() {
  const {
    content,
    updateTextContent,
    addContactLink,
    updateContactLink,
    deleteContactLink,
    addPreference,
    updatePreference,
    deletePreference
  } = useContactContent();

  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [editingPref, setEditingPref] = useState<string | null>(null);
  const [editingText, setEditingText] = useState(false);
  
  // Temporary states for editing
  const [tempContent, setTempContent] = useState(content);
  const [tempLink, setTempLink] = useState<any>({});
  const [tempPref, setTempPref] = useState<any>({});

  // New item forms
  const [showNewLink, setShowNewLink] = useState(false);
  const [showNewPref, setShowNewPref] = useState(false);
  const [newLink, setNewLink] = useState({
    icon: 'mail',
    label: '',
    value: '',
    href: ''
  });
  const [newPref, setNewPref] = useState({
    text: '',
    type: 'open' as 'open' | 'not_interested'
  });

  const iconOptions = [
    { value: 'mail', label: 'Mail' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'github', label: 'GitHub' },
    { value: 'external-link', label: 'External Link' },
    { value: 'globe', label: 'Globe' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'message-square', label: 'Message Square' }
  ];

  // Text content handlers
  const handleSaveTextContent = async () => {
    await updateTextContent({
      mainTitle: tempContent.mainTitle,
      mainDescription: tempContent.mainDescription,
      statusTitle: tempContent.statusTitle,
      openToTitle: tempContent.openToTitle,
      notInterestedTitle: tempContent.notInterestedTitle,
      aiTitle: tempContent.aiTitle,
      aiDescription: tempContent.aiDescription,
      aiButtonText: tempContent.aiButtonText,
      aiModalTitle: tempContent.aiModalTitle,
      aiModalDescription: tempContent.aiModalDescription,
      aiModalButtonText: tempContent.aiModalButtonText,
      traditionalTitle: tempContent.traditionalTitle,
      finalQuote: tempContent.finalQuote
    });
    setEditingText(false);
  };

  // Contact link handlers
  const handleAddLink = async () => {
    if (newLink.label && newLink.value && newLink.href) {
      await addContactLink(newLink);
      setNewLink({ icon: 'mail', label: '', value: '', href: '' });
      setShowNewLink(false);
    }
  };

  const handleUpdateLink = async (id: string) => {
    await updateContactLink(id, tempLink);
    setEditingLink(null);
  };

  const handleReorderLink = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = content.contactLinks.findIndex(l => l.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === content.contactLinks.length - 1)
    ) return;

    const newOrder = [...content.contactLinks];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
    
    // Update order values
    for (let i = 0; i < newOrder.length; i++) {
      await updateContactLink(newOrder[i].id, { order: i + 1 });
    }
  };

  // Preference handlers
  const handleAddPref = async () => {
    if (newPref.text) {
      await addPreference(newPref);
      setNewPref({ text: '', type: 'open' });
      setShowNewPref(false);
    }
  };

  const handleUpdatePref = async (id: string) => {
    await updatePreference(id, tempPref);
    setEditingPref(null);
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
            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm text-gray-400 mb-2">Traditional Contact Title</label>
                <input
                  type="text"
                  value={tempContent.traditionalTitle}
                  onChange={(e) => setTempContent({ ...tempContent, traditionalTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Main Description</label>
              <textarea
                value={tempContent.mainDescription}
                onChange={(e) => setTempContent({ ...tempContent, mainDescription: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white h-24"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Open To Title</label>
                <input
                  type="text"
                  value={tempContent.openToTitle}
                  onChange={(e) => setTempContent({ ...tempContent, openToTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Not Interested Title</label>
                <input
                  type="text"
                  value={tempContent.notInterestedTitle}
                  onChange={(e) => setTempContent({ ...tempContent, notInterestedTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                />
              </div>
            </div>
            <hr className="border-gray-700" />
            <h4 className="text-lg font-semibold text-white">AI Section</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">AI Section Title</label>
                <input
                  type="text"
                  value={tempContent.aiTitle}
                  onChange={(e) => setTempContent({ ...tempContent, aiTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">AI Button Text</label>
                <input
                  type="text"
                  value={tempContent.aiButtonText}
                  onChange={(e) => setTempContent({ ...tempContent, aiButtonText: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">AI Description</label>
              <textarea
                value={tempContent.aiDescription}
                onChange={(e) => setTempContent({ ...tempContent, aiDescription: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">AI Modal Title</label>
                <input
                  type="text"
                  value={tempContent.aiModalTitle}
                  onChange={(e) => setTempContent({ ...tempContent, aiModalTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">AI Modal Button</label>
                <input
                  type="text"
                  value={tempContent.aiModalButtonText}
                  onChange={(e) => setTempContent({ ...tempContent, aiModalButtonText: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">AI Modal Description</label>
              <textarea
                value={tempContent.aiModalDescription}
                onChange={(e) => setTempContent({ ...tempContent, aiModalDescription: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white h-20"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Final Quote</label>
              <textarea
                value={tempContent.finalQuote}
                onChange={(e) => setTempContent({ ...tempContent, finalQuote: e.target.value })}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white h-16"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-gray-300">
            <p><strong>Main Title:</strong> {content.mainTitle}</p>
            <p><strong>Main Description:</strong> {content.mainDescription.substring(0, 100)}...</p>
            <p><strong>AI Title:</strong> {content.aiTitle}</p>
            <p><strong>Final Quote:</strong> {content.finalQuote.substring(0, 60)}...</p>
          </div>
        )}
      </div>

      {/* Contact Links Section */}
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Contact Links</h3>
          <button
            onClick={() => setShowNewLink(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </div>

        {/* New Link Form */}
        {showNewLink && (
          <div className="mb-4 p-4 bg-black/50 rounded border border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Icon</label>
                <select
                  value={newLink.icon}
                  onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
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
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                  placeholder="e.g., Email"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Display Value</label>
                <input
                  type="text"
                  value={newLink.value}
                  onChange={(e) => setNewLink({ ...newLink, value: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                  placeholder="e.g., eof@offline.pl"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Link URL</label>
                <input
                  type="text"
                  value={newLink.href}
                  onChange={(e) => setNewLink({ ...newLink, href: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                  placeholder="e.g., mailto:eof@offline.pl"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddLink}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowNewLink(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Links List */}
        <div className="space-y-2">
          {[...content.contactLinks].sort((a, b) => a.order - b.order).map((link, index) => (
            <div key={link.id} className="p-4 bg-black/30 rounded border border-gray-700">
              {editingLink === link.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Icon</label>
                      <select
                        value={tempLink.icon}
                        onChange={(e) => setTempLink({ ...tempLink, icon: e.target.value })}
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
                        value={tempLink.label}
                        onChange={(e) => setTempLink({ ...tempLink, label: e.target.value })}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Display Value</label>
                      <input
                        type="text"
                        value={tempLink.value}
                        onChange={(e) => setTempLink({ ...tempLink, value: e.target.value })}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Link URL</label>
                      <input
                        type="text"
                        value={tempLink.href}
                        onChange={(e) => setTempLink({ ...tempLink, href: e.target.value })}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateLink(link.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingLink(null)}
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
                        onClick={() => handleReorderLink(link.id, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${index === 0 ? 'text-gray-600' : 'text-gray-400 hover:text-white'}`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorderLink(link.id, 'down')}
                        disabled={index === content.contactLinks.length - 1}
                        className={`p-1 rounded ${index === content.contactLinks.length - 1 ? 'text-gray-600' : 'text-gray-400 hover:text-white'}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-white">
                        <span className="text-gray-400">[{link.icon}]</span>
                        <strong>{link.label}:</strong>
                        <span>{link.value}</span>
                        <span className="text-gray-400">→ {link.href}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTempLink(link);
                        setEditingLink(link.id);
                      }}
                      className="p-2 text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteContactLink(link.id)}
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

      {/* Preferences Section */}
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Preferences</h3>
          <button
            onClick={() => setShowNewPref(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Preference
          </button>
        </div>

        {/* New Preference Form */}
        {showNewPref && (
          <div className="mb-4 p-4 bg-black/50 rounded border border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Type</label>
                <select
                  value={newPref.type}
                  onChange={(e) => setNewPref({ ...newPref, type: e.target.value as 'open' | 'not_interested' })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                >
                  <option value="open">Open To</option>
                  <option value="not_interested">Not Interested</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Text</label>
                <input
                  type="text"
                  value={newPref.text}
                  onChange={(e) => setNewPref({ ...newPref, text: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded text-white"
                  placeholder="Enter preference text"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddPref}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowNewPref(false);
                  setNewPref({ text: '', type: 'open' });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Preferences Lists */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Open To</h4>
            <div className="space-y-2">
              {content.preferences
                .filter(p => p.type === 'open')
                .sort((a, b) => a.order - b.order)
                .map((pref) => (
                  <div key={pref.id} className="p-3 bg-black/30 rounded border border-gray-700">
                    {editingPref === pref.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={tempPref.text}
                          onChange={(e) => setTempPref({ ...tempPref, text: e.target.value })}
                          className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePref(pref.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPref(null)}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                          {pref.text}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setTempPref(pref);
                              setEditingPref(pref.id);
                            }}
                            className="p-1 text-blue-400 hover:text-blue-300"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deletePreference(pref.id)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Not Interested</h4>
            <div className="space-y-2">
              {content.preferences
                .filter(p => p.type === 'not_interested')
                .sort((a, b) => a.order - b.order)
                .map((pref) => (
                  <div key={pref.id} className="p-3 bg-black/30 rounded border border-gray-700">
                    {editingPref === pref.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={tempPref.text}
                          onChange={(e) => setTempPref({ ...tempPref, text: e.target.value })}
                          className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePref(pref.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPref(null)}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2" />
                          {pref.text}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setTempPref(pref);
                              setEditingPref(pref.id);
                            }}
                            className="p-1 text-blue-400 hover:text-blue-300"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deletePreference(pref.id)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}