import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { uploadToSupabase } from '../../lib/supabaseStorage';
import CameraCapture from './CameraCapture';
import './FirstsTimeline.css';

// ─── Data: All "第一次" records are now managed via Supabase ───

// Key-Value mapping for smart emoji matching
const EMOJI_MAP = {
    '书': '📚', '图书馆': '📚',
    '山': '🏔️', '爬山': '🏔️',
    '车': '🚗', '驾照': '🚗', '开': '🚗', '坐': '🚗',
    '影院': '🎬', '电影': '🎬', '看': '🎬',
    '吃': '🍴', '餐厅': '🍴', '饭': '🍳', '菜': '🥘', '厨': '🍳', '宵夜': '🌃', '米其林': '🍴',
    '唱K': '🎤', '唱': '🎤', '音乐': '🎵', 'KTV': '🎤',
    '摩天轮': '🎡', '乐园': '🎡',
    '花': '💐', '玫瑰': '🌹',
    '表白': '💖', '爱': '❤️', '吻': '💋', '亲': '💋',
    '化妆': '💄', '面膜': '💄', '涂': '💄',
    '日出': '🌅', '日落': '🌇',
    '飞机': '✈️', '机场': '✈️', '飞行': '✈️',
    '家': '🏠', '住': '🏠', '寓': '🏠',
    '洗碗': '🥣',
    '剪': '✂️', '发': '✂️',
    '电动车': '🛵', '骑': '🛵',
    '雪': '❄️', '冰': '❄️',
    '温泉': '♨️', '泡': '♨️',
    '游戏': '🎮', '玩': '🎮', '双人': '🎮',
    '牙': '🪥', '刷': '🪥',
    '礼': '🎁', '送': '🎁',
    '红包': '🧧', '钱': '💰',
    '扑克': '🃏', '德州': '♠️',
    '套': '🩹', 'tt': '🩹',
    '睡觉': '🛌', '睡': '🛌',
    '表': '⌚',
    '猫': '🐱', '狗': '🐶', 'jellycat': '🧸',
    '路': '🛣️', '旅': '🗺️',
};

const DEFAULT_EMOJIS = ['💕', '✨', '🌟', '🎯', '🎈', '💫', '🌸', '🦋', '🎀', '💖', '🌙', '⭐', '🎊', '🍀', '🌈'];

function getEmoji(text) {
    if (!text) return '💕';

    // Check keywords (longer first to match more specific phrases)
    const keywords = Object.keys(EMOJI_MAP).sort((a, b) => b.length - a.length);
    for (const key of keywords) {
        if (text.includes(key)) {
            return EMOJI_MAP[key];
        }
    }

    // Fallback to consistent but limited selection
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    return DEFAULT_EMOJIS[Math.abs(hash) % DEFAULT_EMOJIS.length];
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}.${month}.${day}`;
}

export default function FirstsTimeline() {
    const [hasEntered, setHasEntered] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [records, setRecords] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newExtraText, setNewExtraText] = useState('');
    const [newImages, setNewImages] = useState([]);
    const [editingId, setEditingId] = useState(null); // tracking db id if editing
    const [saving, setSaving] = useState(false);
    const [showImageMenu, setShowImageMenu] = useState(false);
    const scrollRef = useRef(null);
    const extraTextRef = useRef(null);

    // Load records: merge seed data + Supabase data
    useEffect(() => {
        loadRecords();
    }, []);

    const parseDbDescription = (r) => {
        let desc = r.description;
        let images = [];
        let extraText = '';
        try {
            if (desc.startsWith('{') && desc.includes('"text"')) {
                const parsed = JSON.parse(desc);
                desc = parsed.text;
                extraText = parsed.extra_text || '';
                images = parsed.images || [];
            }
        } catch (e) {
            // It's just a normal string
        }
        return {
            date: r.date,
            description: desc,
            extraText,
            images,
            source: 'db',
            id: r.id
        };
    };

    const loadRecords = async () => {
        try {
            const { data, error } = await supabase
                .from('firsts')
                .select('*')
                .order('date', { ascending: true });

            if (!error && data) {
                const dbRecords = data.map(r => parseDbDescription(r));
                setRecords(dbRecords);
            } else {
                setRecords([]);
            }
        } catch (e) {
            console.error('Error fetching records:', e);
            setRecords([]);
        }
    };

    // Group records by date
    const groupedRecords = records.reduce((acc, record) => {
        if (!acc[record.date]) acc[record.date] = [];
        acc[record.date].push(record);
        return acc;
    }, {});

    // For better masonry rendering, split allImages into columns
    const allImages = useMemo(() => {
        const imgs = [];
        records.forEach(r => {
            if (r.images && r.images.length > 0) {
                r.images.forEach(url => {
                    imgs.push({ url, recordId: r.id, date: r.date, description: r.description });
                });
            }
        });
        return imgs;
    }, [records]);

    const sortedDates = Object.keys(groupedRecords).sort();

    const [useCamera, setUseCamera] = useState(false);
    const galleryScrollRef = useRef(null);
    const anchorsRef = useRef([]);

    // Smooth scrolling animation refs
    const targetScrollY = useRef(0);
    const currentScrollY = useRef(0);
    const rafId = useRef(null);

    const smoothScroll = useCallback(() => {
        if (!galleryScrollRef.current) return;

        const diff = targetScrollY.current - currentScrollY.current;
        // If we are close enough, snap and stop animation
        if (Math.abs(diff) < 0.5) {
            currentScrollY.current = targetScrollY.current;
            galleryScrollRef.current.scrollTop = currentScrollY.current;
            rafId.current = null;
            return;
        }

        // Lerp step: 5% of the distance per frame gives a smooth, delayed damping feel
        currentScrollY.current += diff * 0.05;
        galleryScrollRef.current.scrollTop = currentScrollY.current;
        rafId.current = requestAnimationFrame(smoothScroll);
    }, []);

    useEffect(() => {
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, []);

    // We recalculate the offsets for sync scrolling whenever UI shifts
    const computeAnchors = useCallback(() => {
        if (!scrollRef.current || !galleryScrollRef.current) return;

        const timelineEvents = Array.from(scrollRef.current.querySelectorAll('.timeline-event'));
        const galleryItems = Array.from(galleryScrollRef.current.querySelectorAll('.gallery-item'));

        const getRelativeTop = (element, container) => {
            return element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
        };

        const galleryMap = {};
        galleryItems.forEach(item => {
            const recId = item.getAttribute('data-gallery-record-id');
            if (recId && !galleryMap[recId]) {
                galleryMap[recId] = getRelativeTop(item, galleryScrollRef.current);
            }
        });

        const newAnchors = [];
        let rawTops = [];

        timelineEvents.forEach(ev => {
            const recId = ev.getAttribute('data-record-id');
            if (!recId) return;

            const tTop = getRelativeTop(ev, scrollRef.current);
            let gTop = galleryMap[recId];
            rawTops.push({ tTop, gTop, recId });
        });

        // 1. Fill undefined gaps with the last known valid top
        let lastValid = 0;
        for (let i = 0; i < rawTops.length; i++) {
            if (rawTops[i].gTop !== undefined) {
                lastValid = rawTops[i].gTop;
            } else {
                rawTops[i].gTop = lastValid;
            }
        }

        // 2. Smooth local fluctuations (lookahead 3)
        // This prevents skipping past the shorter column's image
        let smoothed = [];
        for (let i = 0; i < rawTops.length; i++) {
            let localMin = rawTops[i].gTop;
            // Look ahead to find if a sibling image is higher up
            for (let j = 1; j <= 3 && i + j < rawTops.length; j++) {
                if (rawTops[i + j].gTop < localMin) {
                    localMin = rawTops[i + j].gTop;
                }
            }
            smoothed.push(localMin);
        }

        // 3. Enforce strictly non-decreasing
        let maxSoFar = 0;
        for (let i = 0; i < rawTops.length; i++) {
            let finalGTop = smoothed[i];
            if (finalGTop < maxSoFar) {
                finalGTop = maxSoFar;
            } else {
                maxSoFar = finalGTop;
            }
            newAnchors.push({ tTop: rawTops[i].tTop, gTop: finalGTop });
        }

        // 4. Add a final boundary anchor so the timeline scroll continues to drive the gallery completely to the bottom.
        if (newAnchors.length > 0) {
            const lastTTop = newAnchors[newAnchors.length - 1].tTop + 1000;
            // Calculate maximum available scroll for the gallery
            const maxGalleryScroll = Math.max(0, galleryScrollRef.current.scrollHeight - galleryScrollRef.current.clientHeight);
            const lastGTop = Math.max(maxSoFar, maxGalleryScroll);
            newAnchors.push({ tTop: lastTTop, gTop: lastGTop });
        }

        anchorsRef.current = newAnchors;
    }, []);

    // Recompute anchors after data changes or resize
    useEffect(() => {
        const timer = setTimeout(computeAnchors, 500);
        return () => clearTimeout(timer);
    }, [records, computeAnchors]);

    useEffect(() => {
        window.addEventListener('resize', computeAnchors);
        return () => window.removeEventListener('resize', computeAnchors);
    }, [computeAnchors]);

    // Open Add/Edit Modal
    const openModal = (record = null) => {
        if (record) {
            setNewDate(record.date);
            setNewTitle(record.description || '');
            setNewExtraText(record.extraText || '');
            setNewImages(record.images || []);
            setEditingId(record.id);
        } else {
            const today = new Date().toISOString().split('T')[0];
            setNewDate(today);
            setNewTitle('');
            setNewExtraText('');
            setNewImages([]);
            setEditingId(null);
        }
        setShowModal(true);
        setShowImageMenu(false);
    };

    // Save record (Add or Edit)
    const handleSave = async () => {
        if (!newDate || !newTitle.trim()) return;
        setSaving(true);

        const recordPayload = {
            text: newTitle.trim(),
            extra_text: newExtraText.trim(),
            images: newImages,
        };

        const dbDescription = JSON.stringify(recordPayload);

        try {
            let error;
            if (editingId && typeof editingId === 'string' && !editingId.startsWith('seed')) { // It's an existing DB record
                const response = await supabase
                    .from('firsts')
                    .update({ date: newDate, description: dbDescription })
                    .eq('id', editingId);
                error = response.error;
            } else {
                const response = await supabase
                    .from('firsts')
                    .insert({ date: newDate, description: dbDescription });
                error = response.error;
            }

            if (error) {
                console.error('Supabase save failed:', error);
                alert(`保存失败: ${error.message || '未知错误'}\n请确保已按照 setup 指南配置数据库和 RLS。`);
                setSaving(false);
                return;
            }
        } catch (e) {
            console.error('Supabase save failed:', e);
            alert('保存失败，请检查网络连接或控制台报错。');
            setSaving(false);
            return;
        }

        // Optimistically reload records
        await loadRecords();

        setNewDate('');
        setNewTitle('');
        setNewExtraText('');
        setNewImages([]);
        setEditingId(null);
        setSaving(false);
        setShowModal(false);

        setTimeout(() => {
            if (scrollRef.current) {
                const target = scrollRef.current.querySelector(`[data-date="${newDate}"]`);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 300);
    };

    const handleDelete = async (record, e) => {
        e.stopPropagation(); // Don't trigger the edit modal
        if (!record.id) return;

        if (!confirm('确定要删除这条记录吗？此操作不可撤销。')) {
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('firsts')
                .delete()
                .eq('id', record.id);

            if (error) {
                throw error;
            }
            await loadRecords();
        } catch (error) {
            console.error('Error deleting record:', error);
            alert('删除失败，请检查网络或权限设置。');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setShowImageMenu(false);
        setSaving(true);
        try {
            const { publicUrl } = await uploadToSupabase(file, 'firsts-images');
            setNewImages([...newImages, publicUrl]);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert(`图片上传失败: ${error.message || '请检查 Supabase 存储配置'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleCameraCapture = async (dataUrl) => {
        setUseCamera(false);
        setSaving(true);
        try {
            // Convert base64 to blob
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            // Assign a dummy name for extension detection
            const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });

            const { publicUrl } = await uploadToSupabase(file, 'firsts-images');
            setNewImages([...newImages, publicUrl]);
        } catch (error) {
            console.error('Error saving taken photo:', error);
            alert(`拍照上传失败: ${error.message || '请检查 Supabase 存储配置'}`);
        } finally {
            setSaving(false);
        }
    };

    const totalCount = records.length;

    // Word Cloud Words Extraction
    const cloudWords = useMemo(() => {
        const words = records.map(r => r.description).sort(() => Math.random() - 0.5).slice(0, 60);
        return words.map((word, i) => ({
            id: i,
            text: word,
            left: (50 + (Math.random() * 20 - 10)) + '%', // Center clustered
            bottom: -20, // Start below viewport
            scale: Math.random() * 0.8 + 0.4,
            opacity: Math.random() * 0.5 + 0.3,
            duration: Math.random() * 2 + 2, // Rocket fast
            delay: Math.random() * 10,
            xOffset: Math.random() * 100 - 50,
        }));
    }, [records]);



    const scrollToRecord = (record) => {
        const targetId = record.recordId || `${record.date}-${record.description}`;
        const element = document.getElementById(`record-${targetId}`);
        const container = scrollRef.current;

        if (element && container) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            // Calculate relative offset
            const scrollOffset = (elementRect.top - containerRect.top) + container.scrollTop - (containerRect.height / 2) + (elementRect.height / 2);

            container.scrollTo({
                top: scrollOffset,
                behavior: 'smooth'
            });

            // Add a temporary highlight effect
            element.style.borderColor = 'rgba(246, 190, 200, 0.8)';
            element.style.boxShadow = '0 0 20px rgba(246, 190, 200, 0.3)';
            setTimeout(() => {
                element.style.borderColor = '';
                element.style.boxShadow = '';
            }, 2000);
        }
    };

    // Unique Years/Months for Filter (Optional enhancement)
    const [filterYear, setFilterYear] = useState('All');
    const availableYears = useMemo(() => {
        const years = new Set(records.map(r => r.date.split('-')[0]));
        return ['All', ...Array.from(years).sort().reverse()];
    }, [records]);

    const filteredDates = useMemo(() => {
        if (filterYear === 'All') return sortedDates;
        return sortedDates.filter(d => d.startsWith(filterYear));
    }, [sortedDates, filterYear]);

    const handleTimelineScroll = useCallback((e) => {
        const anchors = anchorsRef.current;
        if (anchors.length === 0 || !galleryScrollRef.current) return;

        const tScroll = e.target.scrollTop;
        const offset = 150; // visual center offset

        let i = 0;
        while (i < anchors.length - 1 && anchors[i + 1].tTop <= tScroll + offset) {
            i++;
        }

        const curr = anchors[i];
        const next = anchors[i + 1];

        let targetGScroll = curr.gTop;
        if (next) {
            const tRange = next.tTop - curr.tTop;
            const gRange = next.gTop - curr.gTop;
            if (tRange > 0) {
                const progress = (tScroll + offset - curr.tTop) / tRange;
                targetGScroll = curr.gTop + gRange * progress;
            }
        }

        // Apply visual mapped scroll to the gallery container with easing
        targetScrollY.current = Math.max(0, targetGScroll - offset);

        // If galleryScrollRef has initialized its scroll data and isn't animating, start the loop
        if (galleryScrollRef.current && !rafId.current) {
            // First time alignment or jumping from 0
            if (currentScrollY.current === 0 && targetScrollY.current > 0) {
                currentScrollY.current = galleryScrollRef.current.scrollTop;
            }
            rafId.current = requestAnimationFrame(smoothScroll);
        }
    }, [smoothScroll]);

    const handleEnterTimeline = () => {
        setIsLaunching(true);
        setTimeout(() => {
            setHasEntered(true);
        }, 1500); // 1.5s for the rocket animation to clear the screen
    };

    return (
        <motion.div
            className="firsts-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            style={!hasEntered ? { justifyContent: 'center', alignItems: 'center' } : {}}
        >
            {!hasEntered ? (
                <>
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                        {/* Word Cloud Background */}
                        <AnimatePresence>
                            {cloudWords.map(word => (
                                <motion.div
                                    key={word.id}
                                    initial={{ opacity: 0, scale: 0, y: 0 }}
                                    animate={
                                        isLaunching
                                            ? {
                                                y: -window.innerHeight * 1.5,
                                                opacity: 0,
                                                scale: word.scale * 0.5
                                            }
                                            : {
                                                opacity: [0, word.opacity, word.opacity, 0],
                                                y: [100, -window.innerHeight * 1.2],
                                                x: [0, word.xOffset],
                                                scale: [word.scale * 0.5, word.scale, word.scale * 1.2]
                                            }
                                    }
                                    transition={
                                        isLaunching
                                            ? { duration: 0.8 + Math.random() * 0.5, ease: 'easeIn' }
                                            : { duration: word.duration, repeat: Infinity, delay: word.delay, ease: 'easeIn' }
                                    }
                                    style={{
                                        position: 'absolute',
                                        left: word.left,
                                        bottom: word.bottom,
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: '1rem',
                                        whiteSpace: 'nowrap',
                                        pointerEvents: 'none',
                                        textShadow: '0 0 10px rgba(246, 190, 200, 0.4)'
                                    }}
                                >
                                    <div style={{ transform: 'translateX(-50%)' }}>
                                        {word.text}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                        <AnimatePresence>
                            {!isLaunching && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)', y: -100 }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                >
                                    <h1 style={{
                                        fontSize: '4rem', fontWeight: 900, letterSpacing: '8px', margin: 0,
                                        background: 'linear-gradient(135deg, #fff, #F6BEC8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                        textShadow: '0 0 40px rgba(246, 190, 200, 0.5)'
                                    }}>
                                        FIRSTS
                                    </h1>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {!isLaunching && (
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -50 }}
                                    transition={{ duration: 1, delay: 1 }}
                                    style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '4px', marginTop: '40px', fontWeight: 300 }}
                                >
                                    每一个第一次，都是我们的里程碑
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {!isLaunching && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -50, scale: 0.8 }}
                                    transition={{ duration: 1, delay: 2 }}
                                    style={{
                                        marginTop: '60px',
                                        display: 'flex',
                                        gap: '20px',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <motion.button
                                        onClick={handleEnterTimeline}
                                        whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(246, 190, 200, 0.4)' }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            padding: '16px 48px', background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(246, 190, 200, 0.3)', color: '#F6BEC8', fontSize: '14px',
                                            letterSpacing: '4px', cursor: 'pointer', backdropFilter: 'blur(10px)', borderRadius: '30px',
                                            textTransform: 'uppercase', transition: 'all 0.3s ease'
                                        }}
                                    >
                                        纵览时光
                                    </motion.button>
                                    <motion.button
                                        onClick={() => openModal(null)}
                                        whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(246, 190, 200, 0.4)' }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            padding: '16px 48px', background: 'rgba(246, 190, 200, 0.2)',
                                            border: '1px solid rgba(246, 190, 200, 0.5)', color: '#fff', fontSize: '14px',
                                            letterSpacing: '4px', cursor: 'pointer', backdropFilter: 'blur(10px)', borderRadius: '30px',
                                            textTransform: 'uppercase', transition: 'all 0.3s ease'
                                        }}
                                    >
                                        录入第一次
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            ) : (
                <>
                    {/* Header */}
                    <div className="firsts-header">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            FIRSTS
                        </motion.h1>
                        <motion.p
                            className="firsts-subtitle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            每一个第一次，都是我们的里程碑
                        </motion.p>
                        <motion.div
                            className="firsts-count"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            已记录 {totalCount} 个第一次
                        </motion.div>
                    </div>

                    {/* 3-Column Layout */}
                    <div className="layout-3-cols">
                        {/* Left Column: Filters */}
                        <div className="firsts-sidebar">
                            <div className="sidebar-section">
                                <h3>时光漫游</h3>
                                <div className="filter-list">
                                    {availableYears.map(year => (
                                        <button
                                            key={year}
                                            className={`filter-btn ${filterYear === year ? 'active' : ''}`}
                                            onClick={() => setFilterYear(year)}
                                        >
                                            {year === 'All' ? '所有记录' : `${year} 年`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Center Column: Scrollable Timeline */}
                        <div className="firsts-scroll" ref={scrollRef} onScroll={handleTimelineScroll}>
                            <div className="timeline-wrapper">
                                {filteredDates.map((date, dateIdx) => (
                                    <motion.div
                                        key={date}
                                        className="timeline-date-group"
                                        data-date={date}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: Math.min(dateIdx * 0.04, 2) }}
                                    >
                                        <div className="timeline-date">{formatDate(date)}</div>
                                        {groupedRecords[date].map((record, idx) => (
                                            <motion.div
                                                key={`${date}-${idx}`}
                                                id={`record-${record.id || `${date}-${record.description}`}`}
                                                className="timeline-event"
                                                data-record-id={record.id}
                                                onClick={() => openModal(record)}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: Math.min(dateIdx * 0.04 + idx * 0.06, 2.5) }}
                                            >
                                                <div className="timeline-event-content">
                                                    <span className="timeline-event-text">
                                                        <span className="timeline-event-emoji">{getEmoji(record.description)}</span>
                                                        {record.description}
                                                    </span>
                                                    {record.extraText && (
                                                        <blockquote className="timeline-event-extra">
                                                            {record.extraText}
                                                        </blockquote>
                                                    )}
                                                </div>
                                                <div
                                                    className="timeline-event-delete-icon"
                                                    onClick={(e) => handleDelete(record, e)}
                                                    title="删除记录"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Masonry Image Gallery */}
                        <div className="firsts-gallery" ref={galleryScrollRef}>
                            <h3 className="gallery-title">回忆画廊</h3>
                            <div className="gallery-masonry">
                                {allImages.length === 0 ? (
                                    <div className="gallery-empty">暂无图片</div>
                                ) : (
                                    <>
                                        <div className="gallery-column">
                                            {allImages.filter((_, i) => i % 2 === 0).map((imgObj, i) => (
                                                <div
                                                    key={`left-${i}`}
                                                    className="gallery-item"
                                                    data-gallery-record-id={imgObj.recordId}
                                                    onClick={() => scrollToRecord(imgObj)}
                                                >
                                                    <img src={imgObj.url} alt="memory" loading="lazy" onLoad={computeAnchors} />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="gallery-column">
                                            {allImages.filter((_, i) => i % 2 === 1).map((imgObj, i) => (
                                                <div
                                                    key={`right-${i}`}
                                                    className="gallery-item"
                                                    data-gallery-record-id={imgObj.recordId}
                                                    onClick={() => scrollToRecord(imgObj)}
                                                >
                                                    <img src={imgObj.url} alt="memory" loading="lazy" onLoad={computeAnchors} />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Floating Add Button - Only show after entering timeline/gallery */}
            {hasEntered && (
                <motion.button
                    className="firsts-add-btn"
                    onClick={() => openModal(null)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, type: 'spring', stiffness: 200 }}
                >
                    +
                </motion.button>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="firsts-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            className="firsts-modal"
                            initial={{ opacity: 0, scale: 0.85, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 30 }}
                            transition={{ type: 'spring', damping: 20 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowImageMenu(false);
                            }}
                        >
                            <div className="firsts-modal-header">
                                <h2>{editingId ? '编辑第一次' : '记录新的第一次'} ✨</h2>
                                <div className="camera-btn-wrapper" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        className="btn-header-camera"
                                        onClick={() => setShowImageMenu(!showImageMenu)}
                                        title="添加图片"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            <circle cx="12" cy="13" r="4"></circle>
                                        </svg>
                                    </button>
                                    <AnimatePresence>
                                        {showImageMenu && (
                                            <motion.div
                                                className="camera-dropdown-menu"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <button className="dropdown-item" onClick={() => { setUseCamera(true); setShowImageMenu(false); }}>
                                                    拍照
                                                </button>
                                                <label className="dropdown-item" style={{ cursor: 'pointer' }}>
                                                    从相册选择
                                                    <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                                                </label>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {useCamera ? (
                                <CameraCapture
                                    onCapture={handleCameraCapture}
                                    onCancel={() => setUseCamera(false)}
                                />
                            ) : (
                                <>
                                    <div className="firsts-modal-field">
                                        <label>日期</label>
                                        <input
                                            type="date"
                                            className="custom-date-picker"
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                        />
                                    </div>

                                    <div className="firsts-modal-field">
                                        <label>描述</label>
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="输入标题..."
                                            style={{ marginBottom: '12px' }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    extraTextRef.current?.focus();
                                                }
                                            }}
                                        />
                                        <div className="extra-text-container">
                                            <div className="extra-text-line"></div>
                                            <textarea
                                                ref={extraTextRef}
                                                value={newExtraText}
                                                onChange={(e) => setNewExtraText(e.target.value)}
                                                placeholder="输入补充描述..."
                                                className="extra-text-textarea"
                                            />
                                        </div>
                                    </div>

                                    {newImages.length > 0 && (
                                        <div className="firsts-modal-field">
                                            <label>预览图片 ({newImages.length})</label>
                                            <div className="image-preview-container">
                                                {newImages.map((url, i) => (
                                                    <div key={i} className="preview-box" style={{ marginBottom: '10px' }}>
                                                        <img src={url} alt="preview" />
                                                        <div className="remove-img-btn" onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))}>×</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="firsts-modal-actions">
                                        <button className="btn-cancel" onClick={() => setShowModal(false)}>取消</button>
                                        <button className="btn-submit" onClick={handleSave} disabled={saving || !newTitle.trim()}>
                                            {saving ? '保存中...' : '记录'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
