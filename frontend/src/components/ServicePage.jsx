import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, CheckCircle2, ArrowRight, Loader2, Globe } from 'lucide-react';

const card = { background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 16 };

const ServicePage = () => {
    const [formState, setFormState] = useState('idle');

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormState('loading');
        setTimeout(() => setFormState('success'), 1500);
    };

    const services = [
        { title: 'Document Extraction', desc: 'Extract structured data from invoices, medical records, salary slips, purchase orders, or any document using Gemini multimodal AI.', features: ['Multi-format', 'Layout-aware', 'Schema-flexible'] },
        { title: 'Industry Adapters', desc: 'Pre-built adapters for Finance, Healthcare, Pharma, HR, Logistics, and Audit — or define your own custom schema in minutes.', features: ['Medical', 'Pharma', 'Inventory', 'HR'] },
        { title: 'Enterprise Integration', desc: 'REST API with vector retrieval, delta corrections, and vendor management. Plugs into any ERP, HRIS, or workflow system.', features: ['API endpoints', 'Vector search', 'Delta corrections'] },
    ];

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 32px 80px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}
            >
                {/* Left — Services */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                        <Globe size={14} /> Universal IDP Solutions
                    </div>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: 40, fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
                        Automate{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Any Document</span> Flow
                    </h2>
                    <p style={{ fontSize: 16, lineHeight: 1.7, color: '#94a3b8', marginBottom: 20, maxWidth: 460 }}>
                        Our IDP Agent is <strong style={{ color: '#e2e8f0' }}>not limited to financial documents</strong>. The same architecture
                        parses medical records, pharmacy labels, HR documents, audit reports, and more — just swap the prompt.
                    </p>
                    <div style={{
                        padding: '12px 18px', borderRadius: 12, marginBottom: 40,
                        background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)',
                        color: '#67e8f9', fontSize: 13, lineHeight: 1.6,
                    }}>
                        💡 <strong>Domain-agnostic by design:</strong> Invoices, Bills, POs, Salary Slips, Medical Records, Pharma Labels,
                        Inventory Sheets, Audit Reports, Insurance Claims — all processed with the same pipeline.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {services.map((svc, i) => (
                            <div key={i} style={{ display: 'flex', gap: 16 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4,
                                }}>
                                    <CheckCircle2 size={20} color="#3b82f6" />
                                </div>
                                <div>
                                    <h4 style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{svc.title}</h4>
                                    <p style={{ fontSize: 14, lineHeight: 1.6, color: '#94a3b8', marginBottom: 12 }}>{svc.desc}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {svc.features.map((f, j) => (
                                            <span key={j} style={{
                                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                                                color: '#60a5fa', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                                                padding: '4px 10px', borderRadius: 100,
                                            }}>{f}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <ContactRow icon={<Mail size={16} />} label="Email" value="support@gmail.com" />
                        <ContactRow icon={<Phone size={16} />} label="Phone" value="+91 1122334455" />
                        <ContactRow icon={<MapPin size={16} />} label="Location" value="Noida, UP" />
                    </div>
                </div>

                {/* Right — Inquiry Form */}
                <div>
                    <div style={{ ...card, padding: 40, borderTop: '3px solid #3b82f6', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: '#3b82f6', opacity: 0.03, filter: 'blur(60px)' }} />

                        {formState === 'success' ? (
                            <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 24px',
                                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <CheckCircle2 size={32} color="#10b981" />
                                </div>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Request Sent!</h3>
                                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>We'll reach you within 24 hours.</p>
                                <button onClick={() => setFormState('idle')} style={{
                                    background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto',
                                }}>
                                    Send another <ArrowRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                                        Request a Demo
                                    </h3>
                                    <p style={{ fontSize: 14, color: '#64748b' }}>See how IDP Agent fits your workflow.</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <FormField label="Full Name" placeholder="Jane Cooper" />
                                    <FormField label="Work Email" placeholder="jane@company.com" type="email" />
                                </div>

                                <FormField label="Company Industry" type="select" options={['Financial Services', 'Logistics', 'Healthcare', 'Retail / E-commerce', 'Other']} />
                                <FormField label="How can we help?" type="textarea" placeholder="Tell us about your document processing needs..." />

                                <button type="submit" disabled={formState === 'loading'} style={{
                                    padding: '16px 24px', borderRadius: 12, border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                    color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(59,130,246,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    opacity: formState === 'loading' ? 0.7 : 1,
                                }}>
                                    {formState === 'loading' ? (
                                        <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                                    ) : (
                                        <>Submit Inquiry <ArrowRight size={18} /></>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 10,
    border: '1px solid #1e1e2e', background: 'rgba(255,255,255,0.03)',
    color: '#e2e8f0', fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s',
};

const FormField = ({ label, placeholder, type = 'text', options }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>{label}</label>
        {type === 'select' ? (
            <select style={{ ...inputStyle, appearance: 'none' }} required>
                {options.map((o, i) => <option key={i} style={{ background: '#12121a' }}>{o}</option>)}
            </select>
        ) : type === 'textarea' ? (
            <textarea rows={4} required placeholder={placeholder} style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#1e1e2e'} />
        ) : (
            <input type={type} required placeholder={placeholder} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#1e1e2e'} />
        )}
    </div>
);

const ContactRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#3b82f6' }}>{icon}</span>
        <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>{label}: </span>
            <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{value}</span>
        </div>
    </div>
);

export default ServicePage;
