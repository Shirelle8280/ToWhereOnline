import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CesiumGlobe from '../components/CesiumGlobe';
import LoginModal from '../components/LoginModal';

export default function Home({ goTo, goToCity }) {
  const title = '一路向哪？'.split('');
  const subtitle = 'To Where?'.split('');
  const [scrollY, setScrollY] = useState(0);
  const [waterfallImages, setWaterfallImages] = useState([]);
  const containerRef = useRef(null);
  const isScrollingToGlobe = useRef(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoRef = useRef(null);

  // 身份验证相关状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [attemptedAction, setAttemptedAction] = useState(null);

  // 身份验证处理函数
  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);

    // 执行之前尝试的操作
    if (attemptedAction) {
      attemptedAction();
      setAttemptedAction(null);
    }
  };

  const requireAuth = (action) => {
    if (isAuthenticated) {
      action();
    } else {
      setAttemptedAction(() => action);
      setShowLoginModal(true);
    }
  };

  useEffect(() => {
    const handleScroll = (e) => {
      if (!containerRef.current) return;

      const newScrollY = containerRef.current.scrollTop;

      // 如果未认证且尝试滚动超过第一屏的30%，则阻止滚动并显示登录弹窗
      if (!isAuthenticated && newScrollY > window.innerHeight * 0.3) {
        e.preventDefault();
        containerRef.current.scrollTo({
          top: window.innerHeight * 0.3,
          behavior: 'smooth'
        });

        setAttemptedAction(() => () => {
          containerRef.current.scrollTo({
            top: newScrollY,
            behavior: 'smooth'
          });
        });
        setShowLoginModal(true);
        return;
      }

      setScrollY(newScrollY);

      // 当滚动到第二屏完全显示时，可以考虑跳转到地球页面
      // 暂时注释掉自动跳转，让用户可以体验完整的滚动动画
      /*
      if (newScrollY > window.innerHeight * 1.5 && !isScrollingToGlobe.current) {
        isScrollingToGlobe.current = true;
        setTimeout(() => {
          goTo('globe');
        }, 500);
      }
      */
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [goTo, isAuthenticated]);



  // 一次性生成瀑布流图片
  useEffect(() => {
    // 根据实际文件结构定义可用的图片
    const cityImages = {
      '台北': [
        'IMG_20250625_170257.jpg', 'IMG_20250625_170300.jpg', 'IMG_20250625_170309.jpg',
        'IMG_20250625_184612.jpg', 'IMG_20250625_194953.jpg', 'IMG_20250626_141614.jpg'
      ],
      '台南': [
        'IMG_20250627_160837.jpg', 'IMG_20250627_161727.jpg', 'IMG_20250627_180152.jpg',
        'IMG_20250627_194007.jpg', 'IMG_20250628_094048.jpg', 'IMG_20250628_111544.jpg'
      ],
      '成都': ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg', '11.jpg', '12.jpg', 'IMG_0814.jpeg', 'IMG_0891.jpeg', 'IMG_0892.jpeg', 'IMG_9578.JPG', 'IMG_9635.JPG', 'IMG_9652.JPG'],
      '高雄': ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg'],
      '河源': ['IMG_0796.jpeg', 'IMG_0797.jpeg', 'IMG_0798.jpeg', 'IMG_0799.jpeg', 'IMG_9531.JPG', 'IMG_9535.JPG', 'IMG_9536.JPG'],
      '桂林': ['IMG_0796.jpeg', 'IMG_0797.jpeg', 'IMG_0798.jpeg', 'IMG_0799.jpeg', 'IMG_9531.JPG', 'IMG_9535.JPG', 'IMG_9536.JPG'],
      '重庆': ['IMG_0807.jpeg', 'IMG_0808.jpeg'],
      '阿坝州': ['IMG_0823.jpeg', 'IMG_0824.jpeg', 'IMG_0825.jpeg', 'IMG_0826.jpeg', 'IMG_0830.jpeg', 'IMG_0851.jpeg', 'IMG_0852.jpeg', 'IMG_0870.jpeg', 'IMG_0871.jpeg', 'IMG_0872.jpeg', 'IMG_0959.PNG', 'IMG_0960.jpeg', 'IMG_9557.JPG', 'IMG_9559.JPG', 'IMG_9560.JPG'],
      '深圳': [
        'IMG_0029.jpg', 'IMG_0044.jpg', 'IMG_0048.jpg', 'IMG_0103.jpg', 'IMG_0098.jpg',
        'IMG_0288.jpeg', 'IMG_0302.jpeg', 'IMG_0345.jpeg', 'IMG_0404.jpeg', 'IMG_0416.jpeg',
        'IMG_0724.jpeg', 'IMG_0750.jpeg', 'IMG_0751.jpeg', 'IMG_0752.jpeg',
        'IMG_20250621_052601.jpg', 'IMG_20250706_172944.jpg', 'IMG_20250707_235656.jpg',
        'IMG_8749.JPG', 'IMG_8799.JPG', 'IMG_8823.JPG', 'IMG_9012.JPG', 'IMG_9071.JPG',
        'IMG_9131.JPG', 'IMG_9166.JPG', 'IMG_9195.JPG', 'IMG_9325.JPG', 'IMG_9488.JPG',
        'WechatIMG17803.jpg', 'WechatIMG17818.jpg', 'WechatIMG17817.jpg',
        'WechatIMG741.jpg', 'WechatIMG742.jpg', 'WechatIMG743.jpg', 'WechatIMG744.jpg',
        'WechatIMG9363.jpg', 'WechatIMG9364.jpg', 'WechatIMG9365.jpg', 'WechatIMG9366.jpg',
        'WechatIMG9367.jpg', 'WechatIMG9368.jpg', 'WechatIMG9369.jpg', 'WechatIMG9370.jpg'
      ],
      '马来西亚': [
        'IMG_20250106_083836.jpg', 'IMG_20250106_090114.jpg', 'IMG_20250106_205620.jpg',
        'IMG-20250106-WA0002.jpg', 'IMG-20250108-WA0005.jpg', 'IMG-20250109-WA0006.jpg'
      ],
      '外伶仃岛': ['1.jpg', '2.jpg', '3.jpg', '4.jpg'],
      '南澳岛': ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg'],
      '香港': [
        'IMG_20241202_065859.jpg', 'IMG_20250208_080930.jpg', 'IMG_20250214_212028.jpg',
        'IMG_20250313_145008.jpg', 'IMG_20250503_103617.jpg', 'IMG_20250510_155845.jpg'
      ],
      '广元': ['1.jpg', '2.jpg', 'IMG_0809.jpeg', 'IMG_0812.jpeg', 'IMG_20250120_150636.jpg', 'IMG_20250121_133018.jpg', 'IMG_20250121_170202.jpg', 'IMG_20250121_171148.jpg', 'IMG_20250121_193322.jpg', 'IMG_20250122_160030.jpg', 'IMG_9542.JPG'],
      '绵阳': ['1.jpg', '2.jpg', '3.jpg', '4.jpg', 'wx_camera_1737270310924.jpg'],
      '惠州': [
        'WechatIMG17788.jpg', 'WechatIMG17789.jpg', 'WechatIMG17790.jpg',
        'WechatIMG17791.jpg', 'WechatIMG17792.jpg', 'WechatIMG17793.jpg',
        'WechatIMG17794.jpg', 'WechatIMG17795.jpg', 'WechatIMG17796.jpg'
      ],
      '中山': ['WechatIMG17786.jpg', 'WechatIMG17787.jpg'],
      '东莞': ['IMG_9327.JPG', 'IMG_9328.JPG', 'WechatIMG17920.jpg']
    };

    const images = [];

    // 为每个城市生成图片数据
    Object.entries(cityImages).forEach(([city, imageFiles]) => {
      imageFiles.forEach((fileName, index) => {
        images.push({
          src: `${import.meta.env.BASE_URL}images/cities/${city}/${fileName}`,
          city,
          index: index + 1,
          height: Math.floor(Math.random() * 250) + 400, // 400-650px高度（大幅增加高度）
        });
      });
    });

    // 打乱图片顺序并取前28张（7张每列，四列布局，优化加载速度）
    const shuffledImages = images.sort(() => Math.random() - 0.5).slice(0, 28);
    setWaterfallImages(shuffledImages);
  }, []);

  // 页面加载时尝试播放视频
  useEffect(() => {
    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (video && scrollY < window.innerHeight * 0.5) {
        video.muted = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('视频自动播放成功');
              setShowPlayButton(false);
            })
            .catch(error => {
              console.log('视频自动播放失败，显示播放按钮:', error.message);
              setShowPlayButton(true);
            });
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [scrollY]);

  // 手动播放视频
  const handlePlayVideo = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play()
        .then(() => {
          console.log('手动播放成功');
          setShowPlayButton(false);
        })
        .catch(error => {
          console.error('手动播放失败:', error);
        });
    }
  };

  // 调试信息
  useEffect(() => {
    console.log('Home组件状态:', {
      scrollY,
      windowHeight: window.innerHeight,
      shouldShowVideo: scrollY < window.innerHeight * 0.5,
      videoOpacity: scrollY < window.innerHeight * 0.5 ? Math.max(0.3, 1 - (scrollY / (window.innerHeight * 0.5))) : 0,
      videoDisplay: scrollY < window.innerHeight * 0.5 ? 'block' : 'none',
      videoLoaded
    });
  }, [scrollY, videoLoaded]);

  // 计算滚动参数 - 现在有3屏
  const scrollProgress = Math.min(scrollY / (window.innerHeight * 2), 1); // 基于前2屏的滚动进度
  const globeScrollProgress = Math.max(0, Math.min((scrollY - window.innerHeight) / window.innerHeight, 1)); // 地球相关的滚动进度

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth'
      }}
    >
      {/* 第一屏：主页内容 */}
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: scrollY > window.innerHeight * 0.3 ? '#F6BEC8' : 'transparent' // 只在滚动后显示粉色背景
        }}
      >


        {/* 滚动时的固定标题页面 */}
        {scrollProgress > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: '70%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'auto',
              height: 'auto',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            {/* 主标题 - 一路向哪？ */}
            <div style={{ display: 'flex', marginBottom: '20px' }}>
              {title.map((char, index) => (
                <motion.span
                  key={`scroll-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: 'easeOut'
                  }}
                  style={{
                    fontSize: '5rem',
                    fontWeight: 'bold',
                    color: '#3D3B4F',
                    margin: '0 0.1rem',
                    display: 'inline-block'
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* 副标题 - To Where? */}
            <div style={{ display: 'flex' }}>
              {subtitle.map((char, index) => (
                <motion.span
                  key={`scroll-sub-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.5 + index * 0.05,
                    ease: 'easeOut'
                  }}
                  style={{
                    fontSize: '2rem',
                    fontWeight: '300',
                    color: '#3D3B4F',
                    margin: '0 0.05rem',
                    display: 'inline-block'
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}



        {/* 播放按钮 - 当自动播放失败时显示 */}
        {showPlayButton && scrollY < window.innerHeight * 0.5 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            onClick={handlePlayVideo}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#F6BEC8',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              zIndex: 10,
              transition: 'all 0.3s ease'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ▶
          </motion.button>
        )}

        {/* 背景视频 - 在第一屏显示 */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            display: scrollY < window.innerHeight * 0.5 ? 'block' : 'none',
            opacity: scrollY < window.innerHeight * 0.5 ? Math.max(0.3, 1 - (scrollY / (window.innerHeight * 0.5))) : 0
          }}
          onLoadedData={() => {
            console.log('视频加载成功，应该可见');
            setVideoLoaded(true);
          }}
          onError={(e) => {
            console.error('视频加载错误详情:', {
              error: e,
              target: e.target,
              networkState: e.target.networkState,
              readyState: e.target.readyState,
              errorCode: e.target.error?.code,
              errorMessage: e.target.error?.message
            });
            setVideoLoaded(false);
          }}
          onCanPlay={() => {
            console.log('视频可以播放');
          }}
          onLoadStart={() => {
            console.log('开始加载视频...');
          }}
        >
          {/* 提供多种格式作为备选 */}
          <source src={`${import.meta.env.BASE_URL}video/all.mp4`} type="video/mp4" />
          <source src={`${import.meta.env.BASE_URL}video/1.mp4`} type="video/mp4" />
          <source src={`${import.meta.env.BASE_URL}video/2.mp4`} type="video/mp4" />
          您的浏览器不支持视频播放。
        </video>

        {/* 向下滚动引导箭头 - 只在第一屏显示 */}
        {scrollY < window.innerHeight * 0.3 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: [0.4, 1, 0.4],
              y: [0, 10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              bottom: '5%',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 15
            }}
            onClick={() => {
              requireAuth(() => {
                if (containerRef.current) {
                  // 跳转到第一屏40%+第二屏60%的位置
                  const targetPosition = window.innerHeight * 0.6;
                  containerRef.current.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                  });
                }
              });
            }}
          >
            {/* 提示文字 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              style={{
                fontSize: '0.9rem',
                color: 'rgba(61, 59, 79, 0.8)',
                marginBottom: '8px',
                fontWeight: '500',
                letterSpacing: '1px'
              }}
            >
              探索更多
            </motion.div>

            {/* 箭头图标 */}
            <motion.div
              whileHover={{
                scale: 1.2,
                color: '#F6BEC8'
              }}
              whileTap={{ scale: 0.9 }}
              style={{
                fontSize: '2rem',
                color: '#3D3B4F',
                transition: 'color 0.3s ease'
              }}
            >
              ↓
            </motion.div>

            {/* 装饰性圆点 */}
            <motion.div
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: 0.5
              }}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#3D3B4F',
                marginTop: '8px'
              }}
            />
          </motion.div>
        )}

      </div>

      {/* 第二屏：过渡缓冲屏 */}
      <div
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
          background: 'linear-gradient(to bottom, #F6BEC8 0%, #000 100%)',
          overflow: 'hidden'
        }}
      >
        {/* 瀑布流图片展示 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '200vh', // 两倍高度，支持滚动
            overflow: 'hidden',
            display: 'flex',
            gap: '20px',
            padding: '60px 40px 20px 40px', // 增加左右padding从20px到40px
            transform: `translateY(${-scrollProgress * window.innerHeight}px)`, // 随滚动向上移动
            zIndex: 5
          }}
        >
          {/* 四列瀑布流布局 */}
          {[0, 1, 2, 3].map(columnIndex => (
            <div
              key={columnIndex}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}
            >
              {waterfallImages
                .filter((_, index) => index % 4 === columnIndex) // 按列分配图片（改为4列）
                .map((img, index) => (
                  <motion.div
                    key={`${img.city}-${img.index}-col${columnIndex}-${index}`}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{
                      opacity: scrollProgress > 0.1 ? 1 : 0,
                      y: scrollProgress > 0.1 ? 0 : 50
                    }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1 + columnIndex * 0.03,
                      ease: 'easeOut'
                    }}
                    style={{
                      width: '100%',
                      height: `${img.height}px`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <img
                      src={img.src}
                      alt={`${img.city} 照片`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </motion.div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* 第三屏：地球过渡页面 */}
      <div
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
          background: '#000', // 纯黑背景
          overflow: 'hidden'
        }}
      >


        {/* 3D地球组件 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100vw',
            height: '100vh',
            opacity: globeScrollProgress > 0 ? 1 : 0, // 地球立即出现
            transition: 'opacity 0.5s ease-out',
            pointerEvents: globeScrollProgress > 0.95 ? 'auto' : 'none' // 只有地球滚动到95%才启用交互
          }}
        >
          <CesiumGlobe
            goToCity={goToCity}
            transitionMode={true}
            scrollProgress={globeScrollProgress}
          />
        </div>

        {/* 滚动覆盖层：确保用户可以继续滚动而不被Cesium拦截 */}
        {globeScrollProgress < 0.95 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 100,
              pointerEvents: 'none', // 允许滚动穿透，但阻止其他交互
              cursor: 'default'
            }}
          />
        )}



        {/* 滚动进度提示 */}
        {globeScrollProgress > 0.8 && globeScrollProgress < 0.95 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              bottom: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              fontSize: '1.2rem',
              zIndex: 10
            }}
          >
            继续向下滑动解锁地球交互 ({Math.round(globeScrollProgress * 100)}%)
          </motion.div>
        )}

        {/* 进入地球页面按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: globeScrollProgress > 0.95 ? 1 : 0,
            y: globeScrollProgress > 0.95 ? 0 : 20
          }}
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '0',
            right: '0',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          <motion.button
            onClick={() => requireAuth(() => goTo('globe'))}
            style={{
              padding: '15px 30px',
              fontSize: '1.5rem',
              color: 'white',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              transition: 'all 0.3s ease'
            }}
            whileHover={{
              scale: 1.05,
              background: 'rgba(255, 255, 255, 0.3)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
              <div>点击此处</div>
              <div>开始探索旅程</div>
            </div>
          </motion.button>
        </motion.div>

        {/* 回到顶部按钮 */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: globeScrollProgress > 0.3 ? 1 : 0,
            scale: globeScrollProgress > 0.3 ? 1 : 0.8
          }}
          onClick={() => {
            if (containerRef.current) {
              containerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }
          }}
          style={{
            position: 'absolute',
            bottom: '5%',
            right: '5%',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(246, 190, 200, 0.95)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            color: '#3D3B4F',
            boxShadow: '0 0 0 5px rgba(255, 255, 255, 0.4), 0 4px 20px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(15px)',
            zIndex: 20,
            transition: 'all 0.3s ease'
          }}
          whileHover={{
            scale: 1.1,
            background: 'rgba(246, 190, 200, 1)',
            boxShadow: '0 0 0 6px rgba(255, 255, 255, 0.6), 0 6px 25px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-2px)'
          }}
          whileTap={{ scale: 0.95 }}
        >
          ↑
        </motion.button>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setAttemptedAction(null);
        }}
        onLogin={handleLogin}
      />
    </div>
  );
} 