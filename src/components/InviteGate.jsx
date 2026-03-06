import React, { useState, useEffect } from 'react';
import { verifyInviteCode, isAuthenticated, logout } from '../lib/authUtils';

/**
 * InviteGate — 邀请码验证拦截组件
 * 包裹整个 App，只有验证通过才渲染子组件
 */
export default function InviteGate({ children }) {
    const [authed, setAuthed] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // 初始检查是否已验证
    useEffect(() => {
        setAuthed(isAuthenticated());
        setChecking(false);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('请输入邀请码');
            return;
        }

        setLoading(true);
        setError('');

        const result = await verifyInviteCode(code);
        if (result.valid) {
            setAuthed(true);
        } else {
            setError(result.error || '邀请码无效');
        }
        setLoading(false);
    };

    const handleLogout = () => {
        logout();
        setAuthed(false);
        setCode('');
    };

    // 初次加载检查中
    if (checking) return null;

    // 已验证 — 渲染应用
    if (authed) {
        return (
            <>
                {children}
            </>
        );
    }

    // 未验证 — 显示邀请码输入界面
    return (
        <div style={styles.overlay}>
            {/* 背景装饰 */}
            <div style={styles.bgOrb1} />
            <div style={styles.bgOrb2} />
            <div style={styles.bgOrb3} />

            <div style={styles.card}>
                {/* Logo / 标题区域 */}
                <div style={styles.logoArea}>
                    <div style={styles.logoIcon}>🌍</div>
                    <h1 style={styles.title}>ToWhere</h1>
                    <p style={styles.subtitle}>内测体验</p>
                </div>

                {/* 分割线 */}
                <div style={styles.divider} />

                {/* 表单区域 */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>请输入邀请码</label>
                    <input
                        type="password"
                        value={code}
                        onChange={(e) => { setCode(e.target.value); setError(''); }}
                        placeholder="Invitation Code"
                        style={{
                            ...styles.input,
                            ...(error ? styles.inputError : {}),
                        }}
                        autoFocus
                        autoComplete="off"
                    />
                    {error && <p style={styles.error}>{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.submitBtn,
                            ...(loading ? styles.submitBtnDisabled : {}),
                        }}
                    >
                        {loading ? (
                            <span style={styles.spinner}>⏳</span>
                        ) : (
                            '进入体验'
                        )}
                    </button>
                </form>

                <p style={styles.hint}>
                    没有邀请码？请联系项目作者获取 ✨
                </p>
            </div>
        </div>
    );
}

// ============ Styles ============

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1525 30%, #111d35 60%, #0a1628 100%)',
        overflow: 'hidden',
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    },

    // 背景装饰圆球
    bgOrb1: {
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        top: '-100px',
        right: '-100px',
        animation: 'float 8s ease-in-out infinite',
    },
    bgOrb2: {
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%)',
        bottom: '-50px',
        left: '-50px',
        animation: 'float 10s ease-in-out infinite reverse',
    },
    bgOrb3: {
        position: 'absolute',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)',
        top: '40%',
        left: '20%',
        animation: 'float 12s ease-in-out infinite',
    },

    card: {
        position: 'relative',
        width: '380px',
        maxWidth: '90vw',
        padding: '40px 36px',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1)',
    },

    logoArea: {
        textAlign: 'center',
        marginBottom: '20px',
    },
    logoIcon: {
        fontSize: '48px',
        marginBottom: '12px',
        filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.4))',
    },
    title: {
        margin: 0,
        fontSize: '28px',
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '2px',
    },
    subtitle: {
        margin: '6px 0 0',
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: '4px',
        textTransform: 'uppercase',
    },

    divider: {
        height: '1px',
        margin: '20px 0 24px',
        background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent)',
    },

    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    label: {
        fontSize: '13px',
        fontWeight: 500,
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: '1px',
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        fontSize: '16px',
        fontFamily: 'inherit',
        color: '#fff',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
    },
    inputError: {
        borderColor: 'rgba(239, 68, 68, 0.6)',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    },
    error: {
        margin: '0',
        fontSize: '13px',
        color: '#ef4444',
        textAlign: 'center',
    },
    submitBtn: {
        marginTop: '8px',
        padding: '14px',
        fontSize: '15px',
        fontWeight: 600,
        fontFamily: 'inherit',
        color: '#fff',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'opacity 0.2s, transform 0.1s',
        letterSpacing: '2px',
    },
    submitBtnDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
    spinner: {
        display: 'inline-block',
        animation: 'spin 1s linear infinite',
    },
    hint: {
        marginTop: '20px',
        marginBottom: 0,
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.3)',
        textAlign: 'center',
    },

    // 退出按钮（已登录时显示）
    logoutBtn: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99998,
        padding: '8px 16px',
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        color: 'rgba(255,255,255,0.5)',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'color 0.2s, background 0.2s',
    },
};
