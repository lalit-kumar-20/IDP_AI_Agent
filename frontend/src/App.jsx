import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import DemoPage from './components/DemoPage';
import ServicePage from './components/ServicePage';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'home' && <Hero onStartDemo={() => setActiveTab('demo')} />}
            {activeTab === 'demo' && <DemoPage />}
            {activeTab === 'service' && <ServicePage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer style={{
        padding: '48px 0',
        borderTop: '1px solid #1e1e2e',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14,
            }}>I</div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: '#fff' }}>IDP Agent</span>
          </div>
          <p style={{ fontSize: 13, color: '#4b5563' }}>
            © 2026 Intelligent Document Processing. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 32 }}>
            {['Privacy', 'Terms', 'Security'].map(link => (
              <a key={link} href="#" style={{ fontSize: 13, color: '#64748b', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#e2e8f0'}
                onMouseLeave={e => e.target.style.color = '#64748b'}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
