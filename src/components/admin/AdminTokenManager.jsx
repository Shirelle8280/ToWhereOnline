import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getToken, setToken, clearToken, hasToken, validateToken } from '../../lib/githubApi';
import CityUploadPanel from './CityUploadPanel';

/**
 * Admin panel triggered by easter egg (5 consecutive clicks on 一路向哪？ title).
 * Manages GitHub Token and provides entry to city upload.
 */
export default function AdminTokenManager({ isOpen, onClose, onCityCreated }) {
    const [tokenInput, setTokenInput] = useState('');
    const [tokenStatus, setTokenStatus] = useState('unknown'); // 'unknown' | 'valid' | 'invalid' | 'checking'
    const [tokenUser, setTokenUser] = useState('');
    const [showUploadPanel, setShowUploadPanel] = useState(false);

    // Check token status on open
    useEffect(() => {
        if (!isOpen) return;
        const stored = getToken();
        if (stored) {
            setTokenInput(stored);
            checkToken();
        } else {
            setTokenStatus('unknown');
            setTokenUser('');
        }
    }, [isOpen]);

    const checkToken = async () => {
        setTokenStatus('checking');
        const result = await validateToken();
        if (result.valid) {
            setTokenStatus('valid');
            setTokenUser(result.username || '');
            // Auto-skip to upload panel if we just opened the manager with a stored token
            setShowUploadPanel(true);
        } else {
            setTokenStatus('invalid');
            setTokenUser('');
        }
    };

    const handleSaveToken = async () => {
        if (!tokenInput.trim()) return;
        setToken(tokenInput.trim());
        await checkToken();
    };

    const handleClearToken = () => {
        clearToken();
        setTokenInput('');
        setTokenStatus('unknown');
        setTokenUser('');
    };

    const handleCityCreated = () => {
        if (onCityCreated) onCityCreated();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {showUploadPanel ? (
                <CityUploadPanel
                    onBack={onClose}
                    onCityCreated={handleCityCreated}
                />
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        zIndex: 2000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(30, 30, 50, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            padding: '32px',
                            maxWidth: '480px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
                            color: 'white',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>🔒 管理员验证</h2>
                            <button onClick={onClose} style={{
                                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                                fontSize: '24px', cursor: 'pointer', padding: '4px',
                            }}>✕</button>
                        </div>

                        {/* Token Status */}
                        <div style={{
                            background: tokenStatus === 'valid' ? 'rgba(76, 175, 80, 0.15)' :
                                tokenStatus === 'invalid' ? 'rgba(244, 67, 54, 0.15)' :
                                    'rgba(255, 255, 255, 0.05)',
                            borderRadius: '10px', padding: '16px', marginBottom: '20px',
                            border: `1px solid ${tokenStatus === 'valid' ? 'rgba(76, 175, 80, 0.3)' :
                                tokenStatus === 'invalid' ? 'rgba(244, 67, 54, 0.3)' :
                                    'rgba(255, 255, 255, 0.1)'}`,
                        }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '6px' }}>GitHub Token 状态</div>
                            <div style={{ fontSize: '1rem', fontWeight: 500 }}>
                                {tokenStatus === 'checking' && '⏳ 验证中...'}
                                {tokenStatus === 'valid' && `✅ 已连接 (${tokenUser})`}
                                {tokenStatus === 'invalid' && '❌ Token 无效或已过期'}
                                {tokenStatus === 'unknown' && '⚪ 未配置'}
                            </div>
                        </div>

                        {/* Token Input */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '8px' }}>
                                GitHub Personal Access Token (需要 repo 权限)
                            </label>
                            <input
                                type="password"
                                value={tokenInput}
                                onChange={(e) => setTokenInput(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '8px', color: 'white', fontSize: '14px',
                                    outline: 'none', boxSizing: 'border-box',
                                    fontFamily: 'monospace',
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                            <button onClick={handleSaveToken} disabled={!tokenInput.trim() || tokenStatus === 'checking'}
                                style={{
                                    flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                    opacity: (!tokenInput.trim() || tokenStatus === 'checking') ? 0.5 : 1,
                                }}>
                                保存并验证
                            </button>
                            <button onClick={handleClearToken}
                                style={{
                                    padding: '10px 16px', borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'transparent', color: 'rgba(255,255,255,0.7)',
                                    fontSize: '14px', cursor: 'pointer',
                                }}>
                                清除
                            </button>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />

                        {/* City Upload Entry */}
                        <button
                            onClick={() => setShowUploadPanel(true)}
                            disabled={tokenStatus !== 'valid'}
                            style={{
                                width: '100%', padding: '14px 20px', borderRadius: '10px', border: 'none',
                                background: tokenStatus === 'valid'
                                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                color: tokenStatus === 'valid' ? 'white' : 'rgba(255,255,255,0.3)',
                                fontSize: '15px', fontWeight: 600, cursor: tokenStatus === 'valid' ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            🌍 地点管理
                        </button>

                        {tokenStatus !== 'valid' && (
                            <p style={{ fontSize: '0.8rem', opacity: 0.4, textAlign: 'center', marginTop: '8px' }}>
                                请先配置有效的 GitHub Token
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
