import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { uploadFileToGitHub, listFilesInDir, deleteFileFromGitHub, getJsDelivrUrl } from '../../lib/githubApi';
import { supabase } from '../../lib/supabaseClient';

export default function CityUploadPanel({ onBack, onCityCreated }) {
    const [cityName, setCityName] = useState('');
    const [visitDate, setVisitDate] = useState('');
    const [departure, setDeparture] = useState('');
    const [lng, setLng] = useState('');
    const [lat, setLat] = useState('');
    const [images, setImages] = useState([]); // { id, file, preview, status, progress, cdnUrl }

    const [cityList, setCityList] = useState([]);
    const [editingCityId, setEditingCityId] = useState(null);
    const [loadingList, setLoadingList] = useState(false);

    const [geocoding, setGeocoding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // 0-100
    const [submitResult, setSubmitResult] = useState({ status: '', message: '' });

    const fileInputRef = useRef(null);
    const dragItem = useRef();
    const dragOverItem = useRef();

    // ========= Fetch Locations =========
    const fetchCities = useCallback(async () => {
        setLoadingList(true);
        const { data, error } = await supabase
            .from('cities')
            .select('*')
            .order('sort_order', { ascending: true });
        if (!error && data) setCityList(data);
        setLoadingList(false);
    }, []);

    useEffect(() => {
        fetchCities();
    }, [fetchCities]);

    // ========= Auto Geocoding =========
    useEffect(() => {
        const timer = setTimeout(() => {
            if (cityName.trim() && !editingCityId) {
                handleGeocode();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [cityName]);

    const handleGeocode = async () => {
        if (!cityName.trim()) return;
        setGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`,
                { headers: { 'Accept-Language': 'zh-CN,zh' } }
            );
            const data = await res.json();
            if (data && data.length > 0) {
                setLng(parseFloat(data[0].lon).toFixed(4));
                setLat(parseFloat(data[0].lat).toFixed(4));
            }
        } catch (err) {
            console.error('Geocode failed:', err);
        }
        setGeocoding(false);
    };

    // ========= Image Management =========
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            id: 'new-' + Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            status: 'pending',
            progress: '',
            cdnUrl: null
        }));
        setImages(prev => [...prev, ...newImages]);
        e.target.value = '';
    };

    const removeImage = (id) => {
        setImages(prev => {
            const img = prev.find(i => i.id === id);
            if (img?.preview?.startsWith('blob:')) URL.revokeObjectURL(img.preview);
            return prev.filter(i => i.id !== id);
        });
    };

    const handleDragStart = (e, index) => { dragItem.current = index; };
    const handleDragEnter = (e, index) => { dragOverItem.current = index; };
    const handleDragEnd = () => {
        const newList = [...images];
        const draggedItemContent = newList[dragItem.current];
        newList.splice(dragItem.current, 1);
        newList.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setImages(newList);
    };

    // ========= Edit mode =========
    const handleEditCity = async (city) => {
        setSubmitResult({ status: '', message: '' }); // Clear message immediately
        setEditingCityId(city.id);
        setCityName(city.name);
        setVisitDate(city.description || '');
        setLng(city.lng || '');
        setLat(city.lat || '');
        setDeparture(city.departure || '');

        const { data: imgData } = await supabase
            .from('city_images')
            .select('*')
            .eq('city_id', city.id)
            .order('sort_order', { ascending: true });

        if (imgData) {
            setImages(imgData.map(img => ({
                id: img.id,
                preview: img.url,
                cdnUrl: img.url,
                status: 'done'
            })));
        }
    };

    const resetForm = () => {
        setEditingCityId(null);
        setCityName('');
        setVisitDate('');
        setDeparture('');
        setLng('');
        setLat('');
        setImages([]);
        setSubmitResult({ status: '', message: '' });
    };

    // ========= Form Submission & Cleanup =========
    const handleSubmit = async () => {
        if (!cityName.trim() || !lng || !lat || isSubmitting) return;
        setIsSubmitting(true);
        setSubmitResult({ status: '', message: '' });

        try {
            setUploadProgress(10);
            const folderPath = `public/images/cities/${cityName.trim()}`;

            // 1. Audit GitHub directory
            const auditRes = await listFilesInDir(folderPath);
            const existingFilesOnGitHub = auditRes.success ? auditRes.files : [];

            const finalUrls = [];

            // 2. Process images
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                setUploadProgress(Math.floor(10 + (i / images.length) * 70));

                if (img.status === 'done' && img.cdnUrl) {
                    finalUrls.push(img.cdnUrl);
                    continue;
                }

                const compressed = await imageCompression(img.file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                const base64 = await new Promise(r => {
                    const reader = new FileReader();
                    reader.onload = () => r(reader.result.split(',')[1]);
                    reader.readAsDataURL(compressed);
                });

                const fileName = `${Date.now()}_${i}_${img.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                const path = `${folderPath}/${fileName}`;

                const res = await uploadFileToGitHub(path, base64, `Upload: ${cityName}/${fileName}`);
                if (res.success) {
                    finalUrls.push(res.url);
                }
            }

            // 3. Update Supabase
            const mainImage = finalUrls[0] || '';
            const cityPayload = {
                name: cityName.trim(),
                description: visitDate.trim() || null,
                main_image: mainImage,
                lng: parseFloat(lng),
                lat: parseFloat(lat),
                departure: departure.trim() || null,
            };

            let currentCityId = editingCityId;
            if (editingCityId) {
                const { error } = await supabase.from('cities').update(cityPayload).eq('id', editingCityId);
                if (error) throw error;
                await supabase.from('city_images').delete().eq('city_id', editingCityId);
            } else {
                const { data: maxOrder } = await supabase.from('cities').select('sort_order').order('sort_order', { ascending: false }).limit(1);
                cityPayload.sort_order = (maxOrder?.[0]?.sort_order || 0) + 1;
                const { data, error } = await supabase.from('cities').insert(cityPayload).select().single();
                if (error) throw error;
                currentCityId = data.id;
            }

            if (finalUrls.length > 0) {
                const imgRecords = finalUrls.map((url, idx) => ({ city_id: currentCityId, url, sort_order: idx }));
                await supabase.from('city_images').insert(imgRecords);
            }

            // 4. Cleanup Orphans on GitHub
            for (const file of existingFilesOnGitHub) {
                // Use filename-based check instead of full URL to avoid encoding/format issues
                const isStillNeeded = finalUrls.some(url => url.includes(encodeURIComponent(file.name)));

                if (!isStillNeeded) {
                    await deleteFileFromGitHub(file.path, file.sha, `Cleanup: Remove old image for ${cityName}`);
                }
            }

            setUploadProgress(100);
            setSubmitResult({ status: 'success', message: editingCityId ? '更新成功' : '创建成功' });

            // Auto-hide success message after 2s
            setTimeout(() => {
                setSubmitResult(prev => prev.status === 'success' ? { status: '', message: '' } : prev);
            }, 2000);

            if (!editingCityId) resetForm();
            fetchCities();
            if (onCityCreated) onCityCreated();
        } catch (err) {
            setSubmitResult({ status: 'error', message: err.message });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const handleDeleteCity = async () => {
        if (!editingCityId) return;
        if (!window.confirm(`确定要删除地点「${cityName}」吗？（这也会清除 GitHub 上的照片）`)) return;
        setIsSubmitting(true);

        try {
            const folderPath = `public/images/cities/${cityName.trim()}`;
            const auditRes = await listFilesInDir(folderPath);
            if (auditRes.success) {
                for (const file of auditRes.files) {
                    await deleteFileFromGitHub(file.path, file.sha, `Cleanup: Delete city ${cityName}`);
                }
            }

            const { error } = await supabase.from('cities').delete().eq('id', editingCityId);
            if (!error) {
                setSubmitResult({ status: 'success', message: '地点及其照片已彻底删除' });
                resetForm();
                fetchCities();
                if (onCityCreated) onCityCreated();
            } else {
                setSubmitResult({ status: 'error', message: '数据库删除失败: ' + error.message });
            }
        } catch (err) {
            console.error('Delete flow failed:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={panelWrapperStyle}
        >
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>

            {/* Header Area */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={onBack} style={backButtonStyle}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 style={titleStyle}>{editingCityId ? '✏️ 编辑地点' : '✨ 新地点'}</h1>
                </div>
                {editingCityId && (
                    <button onClick={handleDeleteCity} style={dangerHeaderButtonStyle}>🗑️ 删除整个地点</button>
                )}
            </div>

            <div style={contentGridStyle}>
                {/* Left Section: Information & Media */}
                <div style={leftColumnStyle}>
                    <div style={sectionCardStyle}>
                        <h3 style={sectionTitleStyle}>基础信息</h3>
                        <div style={formGridStyle}>
                            <div style={{ flex: 1.5 }}>
                                <label style={labelStyle}>地点名称</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        value={cityName}
                                        onChange={e => setCityName(e.target.value)}
                                        style={inputStyle}
                                        placeholder="例如: 杭州"
                                    />
                                    {geocoding && <div style={loaderSmallStyle} />}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>经纬度 (Lng, Lat)</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input value={lng} onChange={e => setLng(e.target.value)} style={inputStyle} placeholder="经度" />
                                    <input value={lat} onChange={e => setLat(e.target.value)} style={inputStyle} placeholder="纬度" />
                                </div>
                            </div>
                        </div>

                        <div style={{ ...formGridStyle, marginTop: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>日期范围</label>
                                <input value={visitDate} onChange={e => setVisitDate(e.target.value)} style={inputStyle} placeholder="2025.1.1～2026.1.1" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>出发地</label>
                                <input value={departure} onChange={e => setDeparture(e.target.value)} style={inputStyle} placeholder="深圳" />
                            </div>
                        </div>
                    </div>

                    <div style={galleryCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>地点图库</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    id="image-upload"
                                    ref={fileInputRef}
                                />
                                <label htmlFor="image-upload" style={addImageButtonStyle}>
                                    ＋ 添加照片
                                </label>
                            </div>
                        </div>

                        {images.length === 0 ? (
                            <div style={emptyGalleryStyle}>
                                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📸</div>
                                <div style={{ opacity: 0.5 }}>暂无照片，支持拖拽上传</div>
                            </div>
                        ) : (
                            <div style={imageScrollAreaStyle}>
                                <div
                                    onDragOver={e => e.preventDefault()}
                                    style={imageGridStyle}
                                >
                                    <AnimatePresence>
                                        {images.map((img, idx) => (
                                            <motion.div
                                                layout
                                                key={img.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, idx)}
                                                onDragEnter={(e) => handleDragEnter(e, idx)}
                                                onDragEnd={handleDragEnd}
                                                onDragOver={(e) => e.preventDefault()}
                                                style={imageCardStyle}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                            >
                                                <img src={img.preview} style={imgStyle} alt="" />
                                                {idx === 0 && <span style={mainBadgeStyle}>封面</span>}
                                                <button onClick={() => removeImage(img.id)} style={deleteImgButtonStyle}>×</button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={footerActionStyle}>
                        {submitResult.message && (
                            <div style={{
                                ...messageBoxStyle,
                                color: submitResult.status === 'success' ? '#81c784' : '#e57373',
                                background: submitResult.status === 'success' ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)'
                            }}>
                                {submitResult.message}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button
                                onClick={handleSubmit}
                                disabled={!cityName || !lng || !lat || isSubmitting}
                                style={{
                                    ...primaryButtonStyle,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    background: isSubmitting ? 'rgba(255,255,255,0.08)' : primaryButtonStyle.background,
                                    boxShadow: isSubmitting ? 'none' : primaryButtonStyle.boxShadow,
                                    transition: 'all 0.3s'
                                }}
                            >
                                {isSubmitting && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            height: '100%',
                                            width: `${uploadProgress}%`,
                                            background: primaryButtonStyle.background,
                                            transition: 'width 0.3s ease-out',
                                            zIndex: 0
                                        }}
                                    />
                                )}
                                <span style={{ position: 'relative', zIndex: 1 }}>
                                    {isSubmitting ? `正在同步 (${uploadProgress}%)` : editingCityId ? '💾 保存更新' : '🚀 发布新地点'}
                                </span>
                            </button>
                            {editingCityId && (
                                <button onClick={resetForm} style={cancelButtonStyle}>放弃修改</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Section: Location Library */}
                <div style={rightColumnStyle}>
                    <h3 style={{ ...sectionTitleStyle, padding: '0 10px 15px' }}>地点清单 ({cityList.length})</h3>
                    <div style={listScrollAreaStyle}>
                        {loadingList ? (
                            <div style={loaderCenterStyle}>加载中...</div>
                        ) : cityList.map(city => (
                            <motion.div
                                key={city.id}
                                onClick={() => handleEditCity(city)}
                                whileHover={{ x: 5, background: 'rgba(255,255,255,0.08)' }}
                                style={{
                                    ...listItemStyle,
                                    borderColor: editingCityId === city.id ? '#667eea' : 'rgba(255,255,255,0.05)',
                                    background: editingCityId === city.id ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.03)'
                                }}
                            >
                                <img src={city.main_image} style={listImgStyle} alt="" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{city.name}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '2px' }}>{city.description || '待定日期'}</div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/city/${city.name}`, '_blank');
                                    }}
                                    style={jumpButtonStyle}
                                    title="查看详情"
                                >
                                    ↗
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ========= Premium CSS Layout =========
const panelWrapperStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(10, 10, 12, 0.98)',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backdropFilter: 'blur(20px)'
};
const headerStyle = {
    padding: '30px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0
};
const titleStyle = { margin: 0, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' };
const backButtonStyle = { background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' };
const contentGridStyle = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    padding: '0 40px 40px',
    gap: '20px'
};

const leftColumnStyle = {
    flex: '2.5 1 0%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '0',
    overflow: 'hidden', // 防止整体列滚动，转而让内部区域滚动
    minWidth: 0,
    height: '100%',
};

const rightColumnStyle = {
    flex: '1 1 0%',
    padding: '20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '24px',
    margin: '0', // 移除 margin 以适应全屏
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: '300px'
};

const sectionCardStyle = {
    background: 'rgba(255,255,255,0.03)',
    padding: '24px',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0 // 基础信息片紧凑不占额外空间
};

const sectionTitleStyle = { margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 700, opacity: 0.9, letterSpacing: '0.5px', textTransform: 'uppercase' };
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', marginLeft: '4px' };
const inputStyle = { width: '100%', padding: '14px 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s', boxSizing: 'border-box' };
const formGridStyle = { display: 'flex', gap: '20px' };
const addImageButtonStyle = { padding: '8px 16px', borderRadius: '12px', border: 'none', background: '#667eea', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };

const galleryCardStyle = {
    ...sectionCardStyle,
    flex: 1, // 图库卡片占据剩余空间
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 1
};

const imageScrollAreaStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
    margin: '0 -10px', // 抵消内边距以铺满
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '16px',
    minHeight: '150px'
};

const imageGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' };
const imageCardStyle = { position: 'relative', height: '110px', borderRadius: '16px', overflow: 'hidden', cursor: 'move', border: '1px solid rgba(255,255,255,0.05)' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const mainBadgeStyle = { position: 'absolute', top: '10px', left: '10px', background: '#ffd700', color: 'black', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 };
const deleteImgButtonStyle = { position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', background: 'rgba(255,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const emptyGalleryStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '150px', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '20px' };
const footerActionStyle = { marginTop: '10px', padding: '10px 0', flexShrink: 0 };
const primaryButtonStyle = { flex: 2, padding: '18px', borderRadius: '18px', border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)' };
const dangerButtonStyle = { padding: '18px 30px', borderRadius: '18px', border: '1px solid rgba(244,67,54,0.3)', background: 'transparent', color: '#e57373', cursor: 'pointer', fontWeight: 600 };
const dangerHeaderButtonStyle = { padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(244,67,54,0.5)', background: 'rgba(244,67,54,0.1)', color: '#ff8a80', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' };
const cancelButtonStyle = { flex: 1, padding: '18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' };
const listScrollAreaStyle = { flex: 1, overflowY: 'auto', paddingRight: '10px' };
const listItemStyle = { display: 'flex', gap: '15px', padding: '12px', borderRadius: '18px', border: '1px solid transparent', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.2s', alignItems: 'center' };
const listImgStyle = { width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 };
const jumpButtonStyle = { width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.2s' };
const loaderCenterStyle = { textAlign: 'center', padding: '40px', opacity: 0.5 };
const messageBoxStyle = { padding: '15px', borderRadius: '14px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 500 };
const loaderSmallStyle = { position: 'absolute', right: '15px', top: '15px', width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' };
