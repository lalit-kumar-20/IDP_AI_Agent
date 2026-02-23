import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Search, FileText, Sparkles, Layers } from 'lucide-react';

const useCases = [
    'Invoices', 'Purchase Orders', 'Bills of Lading', 'Medical Records',
    'Salary Slips', 'Audit Reports', 'Pharma Labels', 'Inventory Sheets',
    'Tax Returns', 'Insurance Claims', 'Shipping Manifests', 'Lab Reports',
];

const Hero = ({ onStartDemo }) => {
    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 32px 80px' }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            >
                {/* Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 18px', borderRadius: 100,
                    background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                    color: '#60a5fa', fontSize: 13, fontWeight: 600,
                    marginBottom: 40, animation: 'float 5s ease-in-out infinite',
                }}>
                    <Sparkles size={14} />
                    Intelligent Document Processing
                </div>

                {/* Heading */}
                <h1 style={{
                    fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                    fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.05,
                    letterSpacing: '-0.03em', marginBottom: 24, color: '#fff',
                }}>
                    Turn Any Document Into<br />
                    <span style={{
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        Structured Data
                    </span>
                </h1>

                {/* Subheading */}
                <p style={{
                    fontSize: 18, lineHeight: 1.7, color: '#94a3b8',
                    maxWidth: 620, marginBottom: 48,
                }}>
                    A generic AI extraction agent that reads, understands, and structures
                    <strong style={{ color: '#e2e8f0' }}> any document type</strong> — invoices, medical records, salary slips,
                    audit reports, and more. Easily adaptable to your industry.
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button onClick={onStartDemo} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '16px 32px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}>
                        Try Interactive Demo <ArrowRight size={18} />
                    </button>
                    <button onClick={onStartDemo} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '16px 32px', borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.03)', color: '#e2e8f0',
                        fontSize: 16, fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}>
                        <FileText size={18} /> View Architecture
                    </button>
                </div>
            </motion.div>

            {/* Use-Case Banner */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ marginTop: 64, textAlign: 'center' }}
            >
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', marginBottom: 16 }}>
                    Works across industries & document types
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                    {useCases.map((uc, i) => (
                        <span key={i} style={{
                            padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e2e',
                            color: '#94a3b8', transition: 'all 0.2s',
                        }}>{uc}</span>
                    ))}
                </div>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 16, maxWidth: 500, margin: '16px auto 0', lineHeight: 1.6 }}>
                    The IDP Agent's architecture is <strong style={{ color: '#94a3b8' }}>domain-agnostic</strong>. Swap the parsing
                    prompt and output schema to handle any structured document — no code changes needed.
                </p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 24, marginTop: 64,
                }}
            >
                <FeatureCard
                    icon={<Zap size={28} />}
                    color="#3b82f6"
                    title="Multimodal Vision Engine"
                    desc="Layout-aware text extraction from PDFs, scanned images, photos, and handwritten notes using Google Gemini's multimodal AI."
                />
                <FeatureCard
                    icon={<Search size={28} />}
                    color="#8b5cf6"
                    title="Vector-DB Retrieval"
                    desc="ChromaDB-powered semantic search for contextual corrections. Only processes relevant chunks — 70-90% cost reduction."
                />
                <FeatureCard
                    icon={<Layers size={28} />}
                    color="#06b6d4"
                    title="Adaptable Schema"
                    desc="Output structured JSON for any domain — invoices, medical records, HR documents, logistics manifests. Just change the prompt."
                />
            </motion.div>
        </div>
    );
};

const FeatureCard = ({ icon, color, title, desc }) => (
    <div style={{
        padding: 36, borderRadius: 16,
        background: '#12121a', border: '1px solid #1e1e2e',
        transition: 'all 0.3s', cursor: 'default',
        position: 'relative', overflow: 'hidden',
    }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = color + '40'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
        <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: color, opacity: 0.06, filter: 'blur(40px)',
        }} />
        <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: color + '12', border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, marginBottom: 20,
        }}>
            {icon}
        </div>
        <h3 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700,
            marginBottom: 10, color: '#fff',
        }}>{title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#94a3b8' }}>{desc}</p>
    </div>
);

export default Hero;
