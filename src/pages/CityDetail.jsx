import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

export default function CityDetail({ cityName, goBack }) {
  const [scrollY, setScrollY] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentCity, setCurrentCity] = useState({ mainImage: '', description: '', gallery: [] });

  // 从 Supabase 加载城市数据
  useEffect(() => {
    const loadCityData = async () => {
      console.log(`[CityDetail] Loading data for city: "${cityName}"`);
      setLoading(true);
      try {
        console.log(`[CityDetail] Fetching city metadata for name: "${cityName.trim()}"`);
        const { data: cityData, error: cityError } = await supabase
          .from('cities')
          .select('*')
          .eq('name', cityName.trim())
          .single();

        if (cityError || !cityData) {
          console.error(`[CityDetail] Failed to load city "${cityName}":`, cityError);
          setLoading(false);
          return;
        }

        console.log(`[CityDetail] City found:`, cityData);

        const { data: imagesData, error: imagesError } = await supabase
          .from('city_images')
          .select('url, sort_order')
          .eq('city_id', cityData.id)
          .order('sort_order', { ascending: true });

        if (imagesError) {
          console.error(`[CityDetail] Failed to load images for city ID ${cityData.id}:`, imagesError);
        } else {
          console.log(`[CityDetail] Successfully fetched ${imagesData?.length || 0} images for city ID ${cityData.id}:`, imagesData);
        }

        setCurrentCity({
          id: cityData.id,
          mainImage: cityData.main_image,
          description: cityData.description || '',
          departure: cityData.departure || '',
          lng: cityData.lng,
          lat: cityData.lat,
          gallery: (imagesData || []).map(img => img.url),
        });
      } catch (e) {
        console.error(`[CityDetail] Unexpected error loading city "${cityName}":`, e);
      }
      setLoading(false);
    };

    if (cityName) {
      loadCityData();
    }
  }, [cityName]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsDarkMode(currentScrollY < window.innerHeight);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const openImageViewer = (image, index) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const showPreviousImage = () => {
    const allImages = currentCity.gallery.length > 0 ? currentCity.gallery : [currentCity.mainImage];
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : allImages.length - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(allImages[newIndex]);
  };

  const showNextImage = () => {
    const allImages = currentCity.gallery.length > 0 ? currentCity.gallery : [currentCity.mainImage];
    const newIndex = currentImageIndex < allImages.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setSelectedImage(allImages[newIndex]);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedImage) return;

      if (e.key === 'Escape') {
        closeImageViewer();
      } else if (e.key === 'ArrowLeft') {
        showPreviousImage();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedImage, currentImageIndex]);

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1525 40%, #111d35 100%)', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>加载中...</div>
          <div style={{ fontSize: '1rem', opacity: 0.6 }}>{cityName}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="city-detail">
      <button
        className={`back-button ${isDarkMode ? 'dark' : 'light'}`}
        onClick={goBack}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        返回
      </button>

      {/* 全屏主页面 */}
      <div className="hero-section">
        <div
          className="hero-background"
          style={{
            backgroundImage: `url("${currentCity.mainImage}")`,
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
          onClick={() => openImageViewer(currentCity.mainImage, 0)}
        />
        <div className="hero-overlay" />

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <h1 className="city-name">{cityName}</h1>
          <div className="location-meta" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {currentCity.description && (
              <div className="meta-item" style={{ fontSize: '1.4rem', opacity: 0.9, fontWeight: 300, letterSpacing: '1px' }}>
                {currentCity.description}
              </div>
            )}
          </div>
        </motion.div>

        <div className="scroll-indicator">
          <span>向下滑动查看更多</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* 图片流区域 */}
      <div className="gallery-section">
        <div className="gallery-container">
          <h2 className="gallery-title">精彩瞬间</h2>
          <div className="gallery-grid">
            {currentCity.gallery.length > 0 ? (
              currentCity.gallery.map((image, index) => {
                // 如果画廊里的第一张图和主图一样，可以选择性跳过或者保留。
                // 这里我们保留，但确保显示正常。
                return (
                  <motion.div
                    key={index}
                    className="gallery-item"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    onClick={() => openImageViewer(image, index)}
                  >
                    <img
                      src={image}
                      alt={`${cityName} 精彩记录 ${index + 1}`}
                      onError={handleImageError}
                    />
                  </motion.div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0', color: '#999', fontSize: '1.1rem', letterSpacing: '1px' }}>
                照片都被藏起来了哦，自己去上传试试吧～
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图片查看器模态框 */}
      {selectedImage && (
        <div className="image-viewer-overlay" onClick={closeImageViewer}>
          <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
            <button className="image-viewer-close" onClick={closeImageViewer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button className="image-viewer-nav prev" onClick={showPreviousImage}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button className="image-viewer-nav next" onClick={showNextImage}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <img
              src={selectedImage}
              alt="放大查看"
              className="image-viewer-img"
              onError={handleImageError}
            />

            <div className="image-viewer-counter">
              {currentImageIndex + 1} / {[currentCity.mainImage, ...currentCity.gallery].length}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .city-detail {
          width: 100%;
          height: 100%;
          overflow-y: auto;
        }

        .hero-section {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-background {
          position: absolute;
          top: -20%;
          left: -20%;
          width: 140%;
          height: 140%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-image: linear-gradient(45deg, #1e3c72, #2a5298);
          cursor: pointer;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
        }

        .back-button {
          position: fixed;
          top: 30px;
          left: 30px;
          padding: 12px 24px;
          border-radius: 30px;
          border: none;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          z-index: 100;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .back-button.dark {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          backdrop-filter: blur(10px);
        }

        .back-button.dark:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: translateY(-2px);
        }

        .back-button.light {
          background: rgba(255, 255, 255, 0.9);
          color: black;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .back-button.light:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .hero-content {
          position: relative;
          z-index: 5;
          text-align: center;
          color: white;
          max-width: 80%;
        }

        .city-name {
          font-size: clamp(3rem, 10vw, 6rem);
          font-weight: 800;
          margin: 0 0 20px 0;
          letter-spacing: -2px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.5);
        }

        .meta-item {
          display: flex;
          align-items: center;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          text-align: center;
          z-index: 10;
          animation: bounce 2s infinite;
        }

        .scroll-indicator span {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          opacity: 0.8;
        }

        .gallery-section {
          background: white;
          padding: 80px 0;
          min-height: 100vh;
        }

        .gallery-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
        }

        .gallery-title {
          font-size: 3rem;
          text-align: center;
          margin-bottom: 60px;
          color: #333;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 80px;
        }

        .gallery-item {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .gallery-item:hover {
          transform: translateY(-10px);
        }

        .gallery-item img {
          width: 100%;
          height: 250px;
          object-fit: cover;
          transition: transform 0.3s ease;
          display: block;
        }

        .gallery-item:hover img {
          transform: scale(1.05);
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-10px);
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
          }
        }

        /* 图片查看器样式 */
        .image-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.95);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }

        .image-viewer-container {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-viewer-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .image-viewer-close {
          position: absolute;
          top: -50px;
          right: -50px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          z-index: 1001;
          flex-shrink: 0;
        }

        .image-viewer-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .image-viewer-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          z-index: 1001;
        }

        .image-viewer-nav:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-50%) scale(1.1);
        }

        .image-viewer-nav.prev {
          left: -80px;
        }

        .image-viewer-nav.next {
          right: -80px;
        }

        .image-viewer-counter {
          position: absolute;
          bottom: -50px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          background: rgba(0, 0, 0, 0.5);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          backdrop-filter: blur(10px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .city-name {
            font-size: 4rem;
          }
          .city-description {
            font-size: 1.2rem;
          }
          .gallery-container {
            padding: 0 20px;
          }
          .gallery-grid {
            grid-template-columns: 1fr;
          }
          .back-button {
            top: 20px;
            left: 20px;
            padding: 8px 16px;
            font-size: 14px;
          }
          
          .image-viewer-close {
            top: 20px;
            right: 20px;
          }
          
          .image-viewer-nav.prev {
            left: 20px;
          }
          
          .image-viewer-nav.next {
            right: 20px;
          }
          
          .image-viewer-counter {
            bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
}