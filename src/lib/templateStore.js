// Care Templates Store — persists to localStorage
// Shape: { id, name, description, activities: [{ activityType, measure, code, nameAr, nameEn, plannedTarget }] }

const KEY = "drke_care_templates";

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export const templateStore = {
  list: () => read(),
  get: (id) => read().find((t) => t.id === id) || null,
  create: (data) => {
    const list = read();
    const template = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write([...list, template]);
    return template;
  },
  update: (id, data) => {
    const list = read().map((t) => (t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
    write(list);
    return list.find((t) => t.id === id);
  },
  delete: (id) => {
    write(read().filter((t) => t.id !== id));
  },
};
