import React from 'react';
import { Terminal, GitBranch, Layers, Box, Cpu, Server, CheckCircle2 } from 'lucide-react';

export const DevOpsInfoView = () => {
  const outcomes = [
    {
      co: 'CO1',
      title: 'Version Control with Git & GitHub',
      icon: GitBranch,
      color: '#3b82f6',
      items: [
        'Local Git initialization and branch hygiene (master, feature/complaint-form)',
        'Meaningful .gitignore excluding node_modules, target, data, .db, and IDE files',
        'Standard merge, commit history, and GitHub remote connection documentation',
      ],
    },
    {
      co: 'CO2',
      title: 'Continuous Integration & Delivery with Jenkins',
      icon: Layers,
      color: '#0d9488',
      items: [
        '3 Chained Freestyle Jobs: ComplaintPortal-Checkout -> Build-Test -> Package',
        'Declarative Pipeline (Jenkinsfile) with environment validation, automated tests, and Docker packaging',
        'Scripted Pipeline (jenkins/scripted-pipeline.groovy) with try-catch-finally and status notifications',
      ],
    },
    {
      co: 'CO3',
      title: 'Java 21, Spring Boot 3 & Maven',
      icon: Server,
      color: '#16a34a',
      items: [
        'Spring Boot 3.3.5 layered architecture: Controller, Service, Repository, DTO, Exception Handler',
        'H2 Database persistent file storage (./data/complaintsdb) with Web Console',
        'Automated JUnit 5 Jupiter, Mockito, and Spring MockMvc integration test suite (17 passed tests)',
        'Self-contained Maven Wrapper (mvnw.cmd) producing executable JAR',
      ],
    },
    {
      co: 'CO4',
      title: 'Containerization with Docker & Python Flask',
      icon: Box,
      color: '#8b5cf6',
      items: [
        'Multi-stage Dockerfile for Spring Boot (Eclipse Temurin 21 JRE Alpine)',
        'Multi-stage Dockerfile for React (Node build -> Nginx Alpine with /api reverse proxy)',
        'Python Flask microservice (flask-app/) with SQLite for syllabus requirement',
        'docker-compose.yml orchestrating Frontend, Spring Boot, Flask, and persistent volumes',
      ],
    },
    {
      co: 'CO5',
      title: 'Container Orchestration with Kubernetes',
      icon: Cpu,
      color: '#ea580c',
      items: [
        'Declarative YAML manifests in k8s/: Namespace, ConfigMap, PVC, Deployment, Service',
        'Single-replica deployment for embedded H2 data integrity with persistent storage',
        'Health and readiness probes mapped to /actuator/health',
        'Zero-downtime rolling update and rollback validation steps',
      ],
    },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          DevOps Lab Specification & Architecture Reference
        </h1>
        <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Course: <strong>Continuous Integration and Continuous Delivery Using DevOps</strong> (B.Tech CSE)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {outcomes.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.co} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                    padding: '0.6rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color, letterSpacing: '0.05em' }}>
                    {item.co}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                    {item.title}
                  </h3>
                </div>
              </div>

              <ul style={{ paddingLeft: '1.2rem', color: 'var(--slate-600)', fontSize: '0.85rem', lineHeight: '1.7' }}>
                {item.items.map((desc, idx) => (
                  <li key={idx} style={{ marginBottom: '0.35rem' }}>{desc}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* REST API Endpoints Quick Reference */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '1rem' }}>
          REST API Specification (Spring Boot Backend)
        </h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
                <th>Request / Parameters</th>
                <th>HTTP Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="category-tag" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>POST</span></td>
                <td><code>/api/complaints</code></td>
                <td>Submit new grievance & generate Complaint ID</td>
                <td>JSON: title, category, description, location, citizen details</td>
                <td><code>201 Created</code></td>
              </tr>
              <tr>
                <td><span className="category-tag" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>GET</span></td>
                <td><code>/api/complaints</code></td>
                <td>List all complaints with filtering & search</td>
                <td>Query params: <code>?category=&status=&search=</code></td>
                <td><code>200 OK</code></td>
              </tr>
              <tr>
                <td><span className="category-tag" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>GET</span></td>
                <td><code>/api/complaints/&#123;id&#125;</code></td>
                <td>Retrieve single complaint by ID or tracking string</td>
                <td>Path variable: e.g. <code>CMP-2026-10021</code></td>
                <td><code>200 OK / 404</code></td>
              </tr>
              <tr>
                <td><span className="category-tag" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>PUT</span></td>
                <td><code>/api/complaints/&#123;id&#125;/status</code></td>
                <td>Update resolution status and admin remark</td>
                <td>JSON: <code>status</code> (SUBMITTED, IN_PROGRESS, RESOLVED), <code>adminRemark</code></td>
                <td><code>200 OK</code></td>
              </tr>
              <tr>
                <td><span className="category-tag" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>DELETE</span></td>
                <td><code>/api/complaints/&#123;id&#125;</code></td>
                <td>Delete a complaint record after confirmation</td>
                <td>Path variable: ID or tracking string</td>
                <td><code>204 No Content</code></td>
              </tr>
              <tr>
                <td><span className="category-tag" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>GET</span></td>
                <td><code>/api/complaints/stats</code></td>
                <td>Aggregate counts for administrative dashboard</td>
                <td>None</td>
                <td><code>200 OK</code></td>
              </tr>
              <tr>
                <td><span className="category-tag" style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700 }}>GET</span></td>
                <td><code>/actuator/health</code></td>
                <td>Spring Boot Actuator health status for probes</td>
                <td>None</td>
                <td><code>200 OK</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DevOpsInfoView;
