/**
 * Helper functions for getting element bounding boxes dynamically
 */

/**
 * Get element bounding box via JavaScript evaluation
 */
export async function getElementBox(agentBrowser, selector) {
  const result = await agentBrowser('eval', [
    `(() => {
      const el = document.querySelector('${selector}');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return JSON.stringify({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    })()`
  ]);
  return result && result !== 'null' ? JSON.parse(result) : null;
}

/**
 * Get checkbox bounding box by index
 */
export async function getCheckboxBox(agentBrowser, index = 0) {
  const result = await agentBrowser('eval', [
    `(() => {
      const el = document.querySelectorAll('input[type="checkbox"]')[${index}];
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return JSON.stringify({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    })()`
  ]);
  return result && result !== 'null' ? JSON.parse(result) : null;
}

/**
 * Get task item button box (edit/delete)
 */
export async function getTaskButtonBox(agentBrowser, taskIndex = 0, buttonType = 'edit') {
  const btnIndex = buttonType === 'edit' ? 0 : 1;
  const result = await agentBrowser('eval', [
    `(() => {
      const taskItems = document.querySelectorAll('[class*="task-item"], [class*="TaskItem"], li, [class*="todo"]');
      const tasks = Array.from(taskItems).filter(el => el.querySelector('button'));
      const task = tasks[${taskIndex}];
      if (!task) return null;
      const buttons = task.querySelectorAll('button');
      const btn = buttons[${btnIndex}];
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return JSON.stringify({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    })()`
  ]);
  return result && result !== 'null' ? JSON.parse(result) : null;
}

/**
 * Get modal bounding box
 */
export async function getModalBox(agentBrowser) {
  const result = await agentBrowser('eval', [
    `(() => {
      const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="dialog"]');
      if (!modal) return null;
      const rect = modal.getBoundingClientRect();
      return JSON.stringify({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    })()`
  ]);
  return result && result !== 'null' ? JSON.parse(result) : null;
}

/**
 * Get button box by text content
 */
export async function getButtonBoxByText(agentBrowser, text) {
  const result = await agentBrowser('eval', [
    `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('${text}'));
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return JSON.stringify({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    })()`
  ]);
  return result && result !== 'null' ? JSON.parse(result) : null;
}

/**
 * Get filter buttons container box
 */
export async function getFilterButtonsBox(agentBrowser) {
  const result = await agentBrowser('eval', [
    `(() => {
      // Find container with filter buttons (すべて, 未完了, 完了)
      const buttons = document.querySelectorAll('button');
      let container = null;
      for (const btn of buttons) {
        if (btn.textContent.includes('すべて') || btn.textContent.includes('未完了')) {
          container = btn.parentElement;
          break;
        }
      }
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      return JSON.stringify({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    })()`
  ]);
  return result && result !== 'null' ? JSON.parse(result) : null;
}

/**
 * Get search box bounding box
 */
export async function getSearchBox(agentBrowser) {
  const result = await agentBrowser('eval', [
    `(() => {
      const el = document.querySelector('input[type="search"], input[placeholder*="検索"], input[placeholder*="search"]');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return JSON.stringify({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    })()`
  ]);
  return result && result !== 'null' ? JSON.parse(result) : null;
}

/**
 * Get task list container box
 */
export async function getTaskListBox(agentBrowser) {
  const result = await agentBrowser('eval', [
    `(() => {
      const taskItems = document.querySelectorAll('[class*="task-item"], [class*="TaskItem"], li, [class*="todo"]');
      const tasks = Array.from(taskItems).filter(el => el.querySelector('input[type="checkbox"]') || el.querySelector('button'));
      if (tasks.length === 0) return null;

      // Get bounding box that contains all tasks
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const task of tasks) {
        const rect = task.getBoundingClientRect();
        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.max(maxX, rect.x + rect.width);
        maxY = Math.max(maxY, rect.y + rect.height);
      }
      return JSON.stringify({ x: minX, y: minY, width: maxX - minX, height: maxY - minY });
    })()`
  ]);
  return result && result !== 'null' ? JSON.parse(result) : null;
}
