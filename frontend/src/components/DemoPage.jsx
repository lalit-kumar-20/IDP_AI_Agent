import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileText, CheckCircle, Send, AlertCircle, Loader2,
    Database, Table, Code, Sparkles, RefreshCw, ArrowRight,
    Download, Search, Users, TestTube, Image, ChevronLeft, ChevronRight
} from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const card = { background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 16 };

const DemoPage = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageResults, setPageResults] = useState([]);      // array of per-page results
    const [totalPages, setTotalPages] = useState(0);
    const [activePage, setActivePage] = useState(0);         // 0-indexed
    const [correction, setCorrection] = useState('');
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewType, setPreviewType] = useState('pdf');   // 'pdf' or 'image'
    const [vendors, setVendors] = useState([]);
    const [showVendors, setShowVendors] = useState(false);
    const [extractField, setExtractField] = useState('');
    const [extractResult, setExtractResult] = useState(null);
    const [showExtract, setShowExtract] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const valid = ['application/pdf', 'image/webp', 'image/png', 'image/jpeg'];
        if (valid.includes(f.type) || /\.(pdf|webp|png|jpe?g)$/i.test(f.name)) {
            setFile(f); setError(null);
        } else {
            setError('Supported: PDF, PNG, JPG, WebP');
        }
    };

    const handleResults = (data) => {
        setPageResults(data.pages || []);
        setTotalPages(data.total_pages || data.pages?.length || 0);
        setActivePage(0);
        // Set preview
        const url = `${API}/pdf?t=${Date.now()}`;
        setPreviewUrl(url);
        const firstPage = data.pages?.[0];
        if (firstPage?.document_id) {
            // Determine if image
            setPreviewType(file?.type?.startsWith('image/') ? 'image' : 'pdf');
        }
        loadVendors();
    };

    const processInvoice = async () => {
        if (!file) return;
        setIsProcessing(true); setError(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post(`${API}/process`, formData);
            setPreviewType(file.type?.startsWith('image/') ? 'image' : 'pdf');
            handleResults(res.data);
        } catch (err) { setError(err.response?.data?.detail || 'Backend not reachable.'); }
        finally { setIsProcessing(false); }
    };

    const processSample = async (name) => {
        setIsProcessing(true); setError(null); setFile(null);
        const formData = new FormData();
        formData.append('sample_name', name);
        try {
            const res = await axios.post(`${API}/process-sample`, formData);
            setPreviewType('pdf');
            handleResults(res.data);
            setPreviewUrl(`${API}/pdf?t=${Date.now()}`);
        } catch (err) { setError(err.response?.data?.detail || 'Failed.'); }
        finally { setIsProcessing(false); }
    };

    const applyCorrection = async () => {
        if (!correction.trim()) return;
        setIsProcessing(true); setError(null);
        try {
            const res = await axios.post(`${API}/correct`, { query: correction, page_index: activePage });
            // Update the active page's data
            const updated = [...pageResults];
            if (res.data.invoice_data) {
                updated[activePage] = { ...updated[activePage], invoice_data: res.data.invoice_data, vendor: res.data.vendor };
                setPageResults(updated);
            }
            setCorrection('');
        } catch (err) { setError(err.response?.data?.detail || 'Correction failed.'); }
        finally { setIsProcessing(false); }
    };

    const doExtractField = async () => {
        if (!extractField.trim()) return;
        setIsProcessing(true);
        try {
            const res = await axios.post(`${API}/extract`, {
                field_name: extractField,
                page_index: activePage
            });
            setExtractResult(res.data);
        } catch (err) { setError(err.response?.data?.detail || 'Extraction failed.'); }
        finally { setIsProcessing(false); }
    };

    const loadVendors = async () => { try { const r = await axios.get(`${API}/vendors`); setVendors(r.data); } catch { } };

    const downloadJSON = async () => {
        try {
            const res = await axios.get(`${API}/current`);
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'invoice_data.json'; a.click();
            URL.revokeObjectURL(url);
        } catch { setError('No data to download.'); }
    };

    const startOver = () => {
        setPageResults([]); setFile(null); setPreviewUrl(null); setTotalPages(0);
        setActivePage(0); setExtractResult(null); setShowExtract(false); setShowVendors(false); setError(null);
    };

    // active page data
    const pg = pageResults[activePage] || {};
    const invoiceData = pg.invoice_data;
    const vendorData = pg.vendor;

    // ──────── UPLOAD VIEW ────────
    if (pageResults.length === 0) {
        return (
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 32px 80px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    <h2 style={{ fontFamily: 'Outfit', fontSize: 36, fontWeight: 700, marginBottom: 8, color: '#fff', textAlign: 'center' }}>
                        Upload & Extract
                    </h2>
                    <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 40, textAlign: 'center', maxWidth: 520 }}>
                        Upload an invoice as <strong style={{ color: '#e2e8f0' }}>PDF, PNG, JPG, or WebP</strong>. Multi-page PDFs are processed page-by-page.
                    </p>

                    {/* Upload Dropzone */}
                    <div onClick={() => !isProcessing && fileInputRef.current?.click()}
                        style={{ ...card, width: '100%', padding: '56px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', borderStyle: 'dashed', borderWidth: 2, transition: 'border-color 0.3s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f680'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e2e'}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }}
                            accept="application/pdf,image/webp,image/png,image/jpeg" />

                        {isProcessing ? (
                            <div style={{ textAlign: 'center' }}>
                                <Loader2 size={48} color="#3b82f6" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                                <p style={{ fontSize: 18, fontWeight: 600, color: '#60a5fa', marginBottom: 6 }}>Processing with Gemini AI...</p>
                                <p style={{ fontSize: 13, color: '#64748b' }}>Extracting text, line items, and vendor data</p>
                            </div>
                        ) : file ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {file.type?.startsWith('image/') ? <Image size={28} color="#3b82f6" /> : <FileText size={28} color="#3b82f6" />}
                                </div>
                                <p style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{file.name}</p>
                                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{(file.size / 1024).toFixed(1)} KB • {file.type}</p>
                                <button onClick={e => { e.stopPropagation(); processInvoice(); }} style={{
                                    padding: '12px 28px', borderRadius: 10, border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
                                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(59,130,246,0.35)',
                                    display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
                                }}>Analyze Document <ArrowRight size={16} /></button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <Upload size={40} color="#64748b" style={{ marginBottom: 16 }} />
                                <p style={{ fontSize: 17, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Drop PDF or image here</p>
                                <p style={{ fontSize: 13, color: '#64748b' }}>PDF, PNG, JPG, WebP supported</p>
                            </div>
                        )}
                    </div>

                    {/* Sample Buttons */}
                    <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <p style={{ width: '100%', textAlign: 'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 4 }}>
                            Or try a test document
                        </p>
                        {['sample.pdf', 'test.pdf'].map(name => (
                            <button key={name} onClick={() => processSample(name)} disabled={isProcessing}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid #1e1e2e', background: '#12121a', color: '#94a3b8', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f650'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.color = '#94a3b8'; }}>
                                <TestTube size={16} /> {name}
                            </button>
                        ))}
                    </div>
                    {error && <ErrorToast message={error} />}
                </motion.div>
            </div>
        );
    }

    // ──────── RESULTS VIEW ────────
    return (
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '86px 20px 60px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                            <CheckCircle size={14} /> {totalPages} page{totalPages > 1 ? 's' : ''} processed
                        </div>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 700, color: '#fff' }}>Invoice Intelligence</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <ToolbarBtn icon={<Users size={15} />} label="Vendors" onClick={() => { setShowVendors(!showVendors); setShowExtract(false); loadVendors(); }} active={showVendors} />
                        <ToolbarBtn icon={<Search size={15} />} label="Extract" onClick={() => { setShowExtract(!showExtract); setShowVendors(false); }} active={showExtract} />
                        <ToolbarBtn icon={<Download size={15} />} label="JSON" onClick={downloadJSON} />
                        <div style={{ ...card, padding: 3, display: 'flex', borderRadius: 10 }}>
                            <TabBtn active={viewMode === 'table'} onClick={() => setViewMode('table')}><Table size={14} /> Table</TabBtn>
                            <TabBtn active={viewMode === 'json'} onClick={() => setViewMode('json')}><Code size={14} /> JSON</TabBtn>
                        </div>
                        <button onClick={startOver} title="New Document" style={{ ...card, padding: '6px 12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}><RefreshCw size={16} /></button>
                    </div>
                </div>

                {/* Page Tabs (multi-page) */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setActivePage(Math.max(0, activePage - 1))} disabled={activePage === 0}
                            style={{ ...card, padding: '6px 10px', cursor: 'pointer', color: activePage === 0 ? '#333' : '#94a3b8', display: 'flex', alignItems: 'center' }}><ChevronLeft size={16} /></button>
                        <div style={{ display: 'flex', gap: 4, overflow: 'auto', flex: 1 }}>
                            {pageResults.map((_, i) => (
                                <button key={i} onClick={() => setActivePage(i)}
                                    style={{
                                        padding: '6px 16px', borderRadius: 8, border: '1px solid ' + (activePage === i ? '#3b82f640' : '#1e1e2e'),
                                        background: activePage === i ? 'rgba(59,130,246,0.12)' : '#0e0e14',
                                        color: activePage === i ? '#60a5fa' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.2s', whiteSpace: 'nowrap',
                                    }}>
                                    Page {i + 1} {pageResults[i]?.error ? '⚠' : ''}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setActivePage(Math.min(totalPages - 1, activePage + 1))} disabled={activePage >= totalPages - 1}
                            style={{ ...card, padding: '6px 10px', cursor: 'pointer', color: activePage >= totalPages - 1 ? '#333' : '#94a3b8', display: 'flex', alignItems: 'center' }}><ChevronRight size={16} /></button>
                    </div>
                )}

                {/* Error for this page */}
                {pg.error && (
                    <div style={{ ...card, padding: 20, borderLeft: '3px solid #ef4444', background: 'rgba(239,68,68,0.05)' }}>
                        <p style={{ color: '#f87171', fontSize: 14 }}><strong>Page {pg.page_number} Error:</strong> {pg.error}</p>
                    </div>
                )}

                {/* Main Content: Preview + Data */}
                {invoiceData && (
                    <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr', gap: 20, minHeight: 560 }}>

                        {/* Document Preview */}
                        {previewUrl && (
                            <div style={{ ...card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)' }}>
                                    {previewType === 'image' ? <Image size={15} color="#3b82f6" /> : <FileText size={15} color="#3b82f6" />}
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Source Document</span>
                                    {totalPages > 1 && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>Showing full file • Page {activePage + 1} data →</span>}
                                </div>
                                {previewType === 'image' ? (
                                    <div style={{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
                                        <img src={previewUrl} alt="Invoice" style={{ maxWidth: '100%', maxHeight: 540, objectFit: 'contain', borderRadius: 8 }} />
                                    </div>
                                ) : (
                                    <iframe src={previewUrl} style={{ flex: 1, border: 'none', background: '#1a1a25', minHeight: 540 }} title="PDF Preview" />
                                )}
                            </div>
                        )}

                        {/* Data Panel */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Metadata + Vendor */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ ...card, padding: 20, borderTop: '3px solid #3b82f6' }}>
                                    <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 700, marginBottom: 14 }}>Metadata</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <MetaRow label="Invoice #" value={invoiceData.metadata?.invoice_number} />
                                        <MetaRow label="Date" value={invoiceData.metadata?.invoice_date} />
                                        <MetaRow label="Due" value={invoiceData.metadata?.due_date} />
                                        <MetaRow label="PO #" value={invoiceData.metadata?.po_number} />
                                        <MetaRow label="Terms" value={invoiceData.metadata?.payment_terms} />
                                        <div style={{ height: 1, background: '#1e1e2e', margin: '2px 0' }} />
                                        <MetaRow label="Subtotal" value={invoiceData.metadata?.subtotal} />
                                        <MetaRow label="Tax" value={invoiceData.metadata?.tax_total} />
                                        <MetaRow label="Total" value={`${invoiceData.metadata?.currency || ''} ${invoiceData.metadata?.total_amount || ''}`} highlight />
                                    </div>
                                </div>
                                <div style={{ ...card, padding: 20, borderTop: '3px solid #8b5cf6' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                        <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 700 }}>Vendor</h4>
                                        <Database size={13} color="#8b5cf6" />
                                    </div>
                                    {vendorData ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <p style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{vendorData.name}</p>
                                            <p style={{ fontSize: 9, color: '#8b5cf6', fontFamily: 'monospace' }}>{vendorData.vendor_id}</p>
                                            {vendorData.address && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>{vendorData.address}</p>}
                                            <span style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 100, border: '1px solid rgba(16,185,129,0.2)', alignSelf: 'flex-start' }}>
                                                <Sparkles size={9} /> Matched
                                            </span>
                                        </div>
                                    ) : <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: 12 }}>Not detected</p>}
                                </div>
                            </div>

                            {/* Line Items */}
                            <div style={{ ...card, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: 3, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)' }} />
                                {viewMode === 'table' ? (
                                    <div style={{ overflow: 'auto', flex: 1, maxHeight: 280 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0 }}>
                                                    {['Description', 'Qty', 'Unit Price', 'Tax', 'Amount'].map(h => (
                                                        <th key={h} style={{ padding: '12px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', textAlign: h === 'Description' ? 'left' : 'right', borderBottom: '1px solid #1e1e2e' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(invoiceData.line_items || []).map((item, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #1e1e2e' }}>
                                                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{item.description}</td>
                                                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#94a3b8', fontFamily: 'monospace' }}>{item.quantity}</td>
                                                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#94a3b8', fontFamily: 'monospace' }}>{item.unit_price}</td>
                                                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#94a3b8', fontFamily: 'monospace' }}>{item.tax_amount || '—'}</td>
                                                        <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#60a5fa', fontWeight: 700, fontFamily: 'monospace' }}>{item.amount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ padding: 16, overflow: 'auto', flex: 1, maxHeight: 280, background: 'rgba(0,0,0,0.2)' }}>
                                        <pre style={{ fontSize: 11, color: '#60a5fa', fontFamily: 'monospace', lineHeight: 1.5 }}>{JSON.stringify(invoiceData, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Vendors Panel */}
                <AnimatePresence>{showVendors && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ ...card, padding: 24, overflow: 'hidden' }}>
                        <h4 style={{ fontFamily: 'Outfit', fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Users size={17} color="#8b5cf6" /> Vendor Master ({vendors.length})
                        </h4>
                        {vendors.length === 0 ? <p style={{ color: '#64748b', fontSize: 13 }}>No vendors yet.</p> : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                                {vendors.map((v, i) => (
                                    <div key={i} style={{ background: '#0a0a0f', borderRadius: 10, padding: 14, border: '1px solid #1e1e2e' }}>
                                        <p style={{ fontWeight: 700, color: '#fff', marginBottom: 2, fontSize: 14 }}>{v.name}</p>
                                        <p style={{ fontSize: 9, color: '#8b5cf6', fontFamily: 'monospace', marginBottom: 6 }}>{v.vendor_id}</p>
                                        {v.address && <p style={{ fontSize: 11, color: '#94a3b8' }}>{v.address}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}</AnimatePresence>

                {/* Extract Field */}
                <AnimatePresence>{showExtract && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ ...card, padding: 24, overflow: 'hidden' }}>
                        <h4 style={{ fontFamily: 'Outfit', fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Search size={17} color="#06b6d4" /> Extract Field
                        </h4>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                            {['po_number', 'payment_terms', 'invoice_date', 'vendor_name', 'total_amount'].map(f => (
                                <button key={f} onClick={() => setExtractField(f)}
                                    style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #1e1e2e', background: extractField === f ? 'rgba(6,182,212,0.12)' : '#0a0a0f', color: extractField === f ? '#06b6d4' : '#94a3b8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{f}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input type="text" value={extractField} onChange={e => setExtractField(e.target.value)} placeholder="Or type field name..."
                                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #1e1e2e', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = '#06b6d4'} onBlur={e => e.target.style.borderColor = '#1e1e2e'} />
                            <button onClick={doExtractField} disabled={!extractField.trim() || isProcessing}
                                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: extractField.trim() ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : '#1e1e2e', color: '#fff', fontWeight: 600, cursor: extractField.trim() ? 'pointer' : 'default', fontSize: 13 }}>
                                {isProcessing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Extract'}
                            </button>
                        </div>
                        {extractResult && (
                            <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid #1e1e2e' }}>
                                <pre style={{ fontSize: 12, color: '#06b6d4', fontFamily: 'monospace', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{JSON.stringify(extractResult, null, 2)}</pre>
                            </div>
                        )}
                    </motion.div>
                )}</AnimatePresence>

                {/* Correction Bar */}
                {invoiceData && (
                    <div style={{ ...card, padding: 20, borderLeft: '3px solid #3b82f6', background: 'linear-gradient(90deg, rgba(59,130,246,0.04), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={12} color="#60a5fa" />
                            </div>
                            <h4 style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 700, color: '#fff' }}>Correct{totalPages > 1 ? ` (Page ${activePage + 1})` : ''}</h4>
                            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>Delta correction via vector retrieval</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input type="text" value={correction} onChange={e => setCorrection(e.target.value)}
                                placeholder="e.g. 'The PO number should be PO-12345'"
                                onKeyPress={e => e.key === 'Enter' && applyCorrection()} disabled={isProcessing}
                                style={{ width: '100%', padding: '14px 60px 14px 16px', borderRadius: 10, border: '1px solid #1e1e2e', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', fontSize: 14, fontWeight: 500, outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#1e1e2e'} />
                            <button onClick={applyCorrection} disabled={isProcessing || !correction.trim()}
                                style={{ position: 'absolute', right: 5, top: 5, bottom: 5, padding: '0 16px', borderRadius: 7, border: 'none', background: correction.trim() ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#1e1e2e', color: '#fff', cursor: correction.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}>
                                {isProcessing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                            </button>
                        </div>
                    </div>
                )}

                {error && <ErrorToast message={error} />}
            </motion.div>
        </div>
    );
};

const ToolbarBtn = ({ icon, label, onClick, active }) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
        border: '1px solid ' + (active ? '#3b82f640' : '#1e1e2e'), background: active ? 'rgba(59,130,246,0.1)' : '#12121a',
        color: active ? '#60a5fa' : '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    }}>{icon} {label}</button>
);

const TabBtn = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: 'none',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent', color: active ? '#fff' : '#64748b',
        fontSize: 11, fontWeight: 500, cursor: 'pointer',
    }}>{children}</button>
);

const MetaRow = ({ label, value, highlight }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontWeight: highlight ? 700 : 600, fontSize: highlight ? 15 : 12, color: highlight ? '#60a5fa' : value ? '#e2e8f0' : '#374151' }}>{value || '—'}</span>
    </div>
);

const ErrorToast = ({ message }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
        <AlertCircle size={16} /> <span style={{ fontSize: 13 }}>{message}</span>
    </motion.div>
);

export default DemoPage;
