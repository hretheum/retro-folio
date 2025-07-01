import { useState, useEffect } from 'react';

interface ContentItem {
  id: string;
  type: 'work' | 'timeline' | 'experiment';
  title: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published';
  featured?: boolean;
  data: any;
}

export function useContent(type: 'work' | 'timeline' | 'experiment') {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content/${type}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback to localStorage for now
      const localData = localStorage.getItem(`admin-${type}-items`);
      if (localData) {
        setItems(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  };

  // Create item
  const createItem = async (item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`/api/content/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!response.ok) throw new Error('Failed to create');
      const newItem = await response.json();
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      // Fallback to localStorage
      const newItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updatedItems = [...items, newItem];
      localStorage.setItem(`admin-${type}-items`, JSON.stringify(updatedItems));
      setItems(updatedItems);
      return newItem;
    }
  };

  // Update item
  const updateItem = async (id: string, updates: Partial<ContentItem>) => {
    try {
      const response = await fetch(`/api/content/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, id })
      });
      if (!response.ok) throw new Error('Failed to update');
      const updatedItem = await response.json();
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      // Fallback to localStorage
      const updatedItems = items.map(item => 
        item.id === id 
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      );
      localStorage.setItem(`admin-${type}-items`, JSON.stringify(updatedItems));
      setItems(updatedItems);
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/content/${type}?id=${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete');
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      // Fallback to localStorage
      const updatedItems = items.filter(item => item.id !== id);
      localStorage.setItem(`admin-${type}-items`, JSON.stringify(updatedItems));
      setItems(updatedItems);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type]);

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refetch: fetchItems
  };
}