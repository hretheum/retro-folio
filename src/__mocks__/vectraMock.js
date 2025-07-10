// Mock for vectra module
class LocalIndex {
  constructor(name) {
    this.name = name;
    this.items = new Map();
  }

  async isIndexCreated() {
    return true;
  }

  async createIndex() {
    // Mock implementation
  }

  async insertItem(item) {
    this.items.set(item.metadata.id, item);
  }

  async queryItems(vector, topK) {
    // Return mock results
    return Array.from(this.items.values()).slice(0, topK).map(item => ({
      item,
      score: 0.8
    }));
  }

  async listItems() {
    return Array.from(this.items.values());
  }

  async deleteItem(id) {
    this.items.delete(id);
  }
}

module.exports = {
  LocalIndex
};