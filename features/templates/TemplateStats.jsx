import { h, useState, useEffect } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import "./TemplateStats.css";

export default function TemplateStats({ templates }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    calculateStats();
  }, [templates]);

  function calculateStats() {
    if (!templates || templates.length === 0) {
      return;
    }

    // ISSUE 9: Division by zero when templates array is empty
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    const avgUsage = totalUsage / templates.length;

    // ISSUE 10: Sorting mutates original array - should use slice() first
    const mostUsed = templates.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

    // ISSUE 11: lastUsedAt might be null, will cause error
    const recentlyUsed = templates
      .filter(t => t.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, 5);

    // ISSUE 12: Accessing property on potentially undefined object
    const leastUsed = templates.sort((a, b) => a.usageCount - b.usageCount)[0];

    setStats({
      totalTemplates: templates.length,
      totalUsage: totalUsage,
      avgUsage: avgUsage.toFixed(2),
      mostUsed: mostUsed,
      recentlyUsed: recentlyUsed,
      leastUsed: leastUsed,
    });
  }

  if (!stats) {
    return <div>Loading statistics...</div>;
  }

  return (
    <div className="template-stats">
      <h2>Template Statistics</h2>
      
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-value">{stats.totalTemplates}</div>
          <div className="stat-label">Total Templates</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalUsage}</div>
          <div className="stat-label">Total Usage</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgUsage}</div>
          <div className="stat-label">Average Usage</div>
        </div>
      </div>

      <div className="stats-section">
        <h3>Most Used Templates</h3>
        <div className="stats-list">
          {stats.mostUsed.map(template => (
            <div key={template.templateId} className="stats-list-item">
              <span className="stats-template-name">{template.name}</span>
              <span className="stats-usage-count">{template.usageCount} uses</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <h3>Recently Used</h3>
        <div className="stats-list">
          {stats.recentlyUsed.map(template => (
            <div key={template.templateId} className="stats-list-item">
              <span className="stats-template-name">{template.name}</span>
              <span className="stats-last-used">
                {new Date(template.lastUsedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <h3>Least Used Template</h3>
        <div className="stats-list">
          <div className="stats-list-item">
            <span className="stats-template-name">{stats.leastUsed.name}</span>
            <span className="stats-usage-count">{stats.leastUsed.usageCount} uses</span>
          </div>
        </div>
      </div>
    </div>
  );
}

