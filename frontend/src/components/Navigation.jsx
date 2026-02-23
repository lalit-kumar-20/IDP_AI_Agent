import React from 'react';
import { Bot, Home, Sparkles, Briefcase } from 'lucide-react';

const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'rgba(10, 10, 15, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const innerStyle = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 32px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
};

const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
};

const logoIconStyle = {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
};

const logoTextStyle = {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: '-0.02em',
    color: '#fff',
};

const navBtnBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 18px',
    borderRadius: 10,
    border: 'none',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const contactBtnStyle = {
    padding: '8px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
    transition: 'all 0.2s',
};

const Navigation = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: <Home size={16} /> },
        { id: 'demo', label: 'Demo', icon: <Bot size={16} /> },
        { id: 'service', label: 'Service', icon: <Briefcase size={16} /> },
    ];

    return (
        <nav style={navStyle}>
            <div style={innerStyle}>
                <div style={logoStyle}>
                    <div style={logoIconStyle}>
                        <Sparkles size={18} color="#fff" />
                    </div>
                    <span style={logoTextStyle}>IDP Agent</span>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                ...navBtnBase,
                                background: activeTab === item.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                                color: activeTab === item.id ? '#60a5fa' : '#94a3b8',
                            }}
                            onMouseEnter={e => { if (activeTab !== item.id) { e.target.style.color = '#e2e8f0'; e.target.style.background = 'rgba(255,255,255,0.05)'; } }}
                            onMouseLeave={e => { if (activeTab !== item.id) { e.target.style.color = '#94a3b8'; e.target.style.background = 'transparent'; } }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                <button style={contactBtnStyle} onClick={() => setActiveTab('service')}>
                    Get in Touch
                </button>
            </div>
        </nav>
    );
};

export default Navigation;
