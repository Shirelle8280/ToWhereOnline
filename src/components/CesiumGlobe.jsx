import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as Cesium from 'cesium';
import { motion, AnimatePresence, useMotionValueEvent, useMotionValue } from 'framer-motion';


export default function CesiumGlobe({ goTo, goToCity, transitionMode = false, scrollProgress = 0, scrollY: scrollYProp, activeStage = -1, stageAnimating = true, onUserInteract, cityPoints: cityPointsProp = [] }) {
  const fallbackScrollY = useMotionValue(0);
  const scrollY = scrollYProp || fallbackScrollY;
  const stageAnimationRef = useRef(null); // Tracks the current stage animation cleanup
  const stageAnimatingRef = useRef(stageAnimating); // Keep a mutable ref for rAF loops
  const moonPosRef = useRef(null); // Ref for tracking moon pos safely
  const cesiumContainer = useRef(null);
  const viewer = useRef(null);
  const starsRef = useRef(null); // Ref for tracking star primitive
  const cityEntitiesRef = useRef([]); // Ref for tracking dynamically added city entities
  const masterAngleRef = useRef(0); // Persistent global rotation phase
  const lastTickTimeRef = useRef(performance.now());

  // 地图风格状态
  const [mapStyle, setMapStyle] = useState('satellite'); // 默认卫星图
  const [showMapStyleMenu, setShowMapStyleMenu] = useState(false); // 控制菜单显示
  const currentImageryLayerRef = useRef(null);

  // 地图风格配置（使用瓦片地图服务，支持缩放更新）
  const mapStyles = {
    satellite: {
      name: '卫星图',
      provider: () => new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        credit: 'Esri'
      })
    },
    street: {
      name: '街道图',
      provider: () => new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        credit: 'OpenStreetMap contributors'
      })
    }
  };

  // 相机状态保存
  const savedCameraState = useRef(null);

  const [showMoonPhotos, setShowMoonPhotos] = useState(false);
  const [currentMoonPhoto, setCurrentMoonPhoto] = useState(0);

  // 月球异地照片
  const moonPhotos = [
    '/images/cities/月球/Screenshot_20250716_230917_com.tencent.mm.jpg',
    '/images/cities/月球/Screenshot_20250716_230920_com.tencent.mm.jpg',
    '/images/cities/月球/Screenshot_20250717_235058_com.tencent.mm.jpg',
    '/images/cities/月球/Screenshot_20250717_235102_com.tencent.mm.jpg',
    '/images/cities/月球/Screenshot_20250717_235423_com.tencent.mm.jpg',
    '/images/cities/月球/WechatIMG739.jpg',
    '/images/cities/月球/WechatIMG740.jpg',
  ];

  // 切换地图风格函数（使用瓦片地图服务）
  const switchMapStyle = (styleKey) => {
    if (!viewer.current) {
      return;
    }

    const styleConfig = mapStyles[styleKey];
    if (!styleConfig) {
      return;
    }

    try {
      // 清空所有影像层
      viewer.current.imageryLayers.removeAll();

      // 创建瓦片地图提供者
      const provider = styleConfig.provider();

      // 添加影像层
      const newLayer = viewer.current.imageryLayers.addImageryProvider(provider);
      currentImageryLayerRef.current = newLayer;

      console.log(`已切换到: ${styleConfig.name}`);
    } catch (error) {
      console.error(`切换地图失败:`, error);
    }
  };

  useEffect(() => {
    if (!cesiumContainer.current || viewer.current) return;

    console.log('开始初始化 Cesium...');
    console.log('当前地图风格:', mapStyle);

    try {
      // 设置 Cesium 静态资源路径
      window.CESIUM_BASE_URL = '/cesium/';

      // 设置 Cesium Token (可选，如果你有的话)
      // Cesium.Ion.defaultAccessToken = 'your-token-here';

      // 创建最简单的 Viewer 配置
      viewer.current = new Cesium.Viewer(cesiumContainer.current, {
        contextOptions: { webgl: { alpha: true } },
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        navigationHelpButton: false,
        homeButton: false,
        geocoder: false,
        sceneModePicker: false,
        infoBox: false,
        selectionIndicator: false,
        fullscreenButton: false,
        vrButton: false,
        creditContainer: document.createElement('div'),
      });

      viewer.current.clock.shouldAnimate = true;

      console.log('Cesium Viewer 创建成功');

      // 隐藏左下角的控制器
      viewer.current.cesiumWidget.creditContainer.style.display = 'none';

      // 设置地球基础样式
      viewer.current.scene.globe.enableLighting = false;
      viewer.current.scene.globe.show = true;

      // Performance: preload ancestor & sibling tiles for faster city close-ups
      viewer.current.scene.globe.preloadAncestors = true;
      viewer.current.scene.globe.preloadSiblings = true;
      viewer.current.scene.globe.maximumScreenSpaceError = 1.5;
      viewer.current.scene.globe.tileCacheSize = 1000; // Cache more tiles in memory

      // Replace blurry default skybox with custom star particles
      viewer.current.scene.skyBox = undefined;
      viewer.current.scene.backgroundColor = new Cesium.Color(0, 0, 0, 0); // Transparent to show CSS gradient
      const starPoints = viewer.current.scene.primitives.add(new Cesium.PointPrimitiveCollection());
      starsRef.current = starPoints; // Store for rotation stabilization
      for (let i = 0; i < 3000; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1e9;
        starPoints.add({
          position: new Cesium.Cartesian3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          ),
          pixelSize: 0.8 + Math.random() * 1.8,
          color: Cesium.Color.fromAlpha(Cesium.Color.WHITE, 0.5 + Math.random() * 0.5)
        });
      } // Higher quality tiles

      // User interaction detection: when user touches the globe, notify parent
      const handleUserTouch = () => {
        if (onUserInteract) onUserInteract();
      };
      const canvas = viewer.current.cesiumWidget.canvas;
      canvas.addEventListener('pointerdown', handleUserTouch);
      canvas.addEventListener('wheel', handleUserTouch);

      // 移除默认的Ion影像层（需要token），改用本地地图资源
      viewer.current.imageryLayers.removeAll();
      console.log('已移除默认影像层');

      // 使用初始地图风格
      switchMapStyle(mapStyle);

      // 根据模式设置初始相机位置和目标
      if (transitionMode) {
        // 过渡模式：逐渐从远处拉近到深圳
        const distance = 50000000 - (scrollProgress * 45000000); // 从5000万米到500万米
        const shenzhenLng = 114.0579;
        const shenzhenLat = 22.5431;

        const cameraPosition = Cesium.Cartesian3.fromDegrees(
          shenzhenLng + (1 - scrollProgress) * 20, // 逐渐接近深圳经度
          shenzhenLat + (1 - scrollProgress) * 10,  // 逐渐接近深圳纬度
          distance
        );

        viewer.current.camera.setView({
          destination: cameraPosition,
          orientation: {
            heading: 0,
            pitch: -Math.PI / 3 - (scrollProgress * Math.PI / 6), // 逐渐向下倾斜
            roll: 0
          }
        });

        console.log(`过渡模式相机设置: 滚动进度${scrollProgress}, 距离${distance}米`);
      } else {
        // 正常模式：如果有保存的相机状态，则恢复；否则设置默认视角
        if (savedCameraState.current) {
          console.log('恢复保存的相机状态');
          viewer.current.camera.setView({
            destination: savedCameraState.current.destination,
            orientation: savedCameraState.current.orientation
          });
          // 恢复后清除保存的状态，避免重复使用
          savedCameraState.current = null;
        } else {
          // 默认视角：飞到能同时看到地球和月球的最佳视角
          viewer.current.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(114 + 10, 23, 25000000), // 调整到能看到地球和月球的距离
          });
        }
      }

      console.log('相机位置设置完成');

      // 城市点位由独立的 useEffect 根据 cityPointsProp 动态管理
      console.log('Cesium 初始化完成，等待城市数据加载...');

      // 添加月球 - 保持位置持久性
      if (!moonPosRef.current) {
        moonPosRef.current = Cesium.Cartesian3.fromDegrees(114 + 20, 23, 15000000);
      }

      const moonEntity = viewer.current.entities.add({
        name: '月球',
        position: new Cesium.CallbackProperty(() => moonPosRef.current, false),
        ellipsoid: {
          radii: new Cesium.Cartesian3(500000, 500000, 500000), // 放大月球半径，更容易看到
          material: new Cesium.ImageMaterialProperty({
            image: '/cesium/Assets/Textures/moonSmall.jpg',
            color: Cesium.Color.WHITE,
            transparent: false
          }),
          outline: false, // 移除边框线
        },
        description: '月球 - 异地时光',
        isMoon: true,
      });

      // 添加月球光晕效果 - 内层
      const moonGlowEntity = viewer.current.entities.add({
        name: '月球光晕',
        position: new Cesium.CallbackProperty(() => moonPosRef.current, false),
        ellipsoid: {
          radii: new Cesium.Cartesian3(550000, 550000, 550000), // 内层光晕
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty((time) => {
              // 月亮的真实黄色光晕，增强呼吸动画
              const phase = Cesium.JulianDate.secondsDifference(time, viewer.current.clock.currentTime) * 2 * Math.PI / 4; // 4秒周期，更明显
              const alpha = 0.25 + Math.sin(phase) * 0.2; // 0.05-0.45 大幅度变化，更明显的呼吸
              // 真实月亮的暖黄色
              return new Cesium.Color(1.0, 0.85, 0.4, alpha); // 月亮的暖黄色
            }, false)
          ),
          outline: false,
        },
        description: '月球光晕',
      });

      // 添加羽化外层光晕
      const moonFeatherGlowEntity = viewer.current.entities.add({
        name: '月球羽化光晕',
        position: new Cesium.CallbackProperty(() => moonPosRef.current, false),
        ellipsoid: {
          radii: new Cesium.Cartesian3(600000, 600000, 600000), // 羽化外层
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty((time) => {
              // 羽化边缘，更柔和的渐变
              const phase = Cesium.JulianDate.secondsDifference(time, viewer.current.clock.currentTime) * 2 * Math.PI / 4; // 与内层同步
              const alpha = 0.12 + Math.sin(phase) * 0.1; // 0.02-0.22 羽化效果
              // 稍浅的月黄色用于羽化
              return new Cesium.Color(1.0, 0.9, 0.6, alpha); // 羽化层的浅黄色
            }, false)
          ),
          outline: false,
        },
        description: '月球羽化光晕',
      });

      // 添加最外层羽化
      const moonSoftGlowEntity = viewer.current.entities.add({
        name: '月球软羽化',
        position: new Cesium.CallbackProperty(() => moonPosRef.current, false),
        ellipsoid: {
          radii: new Cesium.Cartesian3(650000, 650000, 650000), // 最外层羽化
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty((time) => {
              // 最柔和的羽化边缘
              const phase = Cesium.JulianDate.secondsDifference(time, viewer.current.clock.currentTime) * 2 * Math.PI / 4; // 与内层同步
              const alpha = 0.06 + Math.sin(phase) * 0.05; // 0.01-0.11 最柔和的羽化
              // 最浅的月黄色
              return new Cesium.Color(1.0, 0.95, 0.8, alpha); // 最浅的羽化层
            }, false)
          ),
          outline: false,
        },
        description: '月球软羽化',
      });

      console.log('月球已添加到场景中（包含光晕效果）');

      // ========= Global Master Ticker =========
      // This loop runs forever, keeping Moon and Stars moving regardless of stage
      const tick = (time) => {
        const dt = (time - lastTickTimeRef.current) / 16.666; // Normalize to 60fps
        lastTickTimeRef.current = time;

        const safeDt = Math.min(dt, 2.0); // Precision guard
        // 20s per rotation calculation: (2 * Math.PI) / (20s * 60fps) ≈ 0.005236
        masterAngleRef.current += 0.005236 * safeDt;
        const earthAngle = masterAngleRef.current;

        // 1. Update Moon (Physical Logic: Space -> ECEF)
        const MOON_ORBIT_INCLINATION = Cesium.Math.toRadians(5.14);
        const MOON_DISTANCE = 15000000;
        const EARTH_MOON_RATIO = 30;
        const moonOrbitAngle = earthAngle / EARTH_MOON_RATIO;

        const moonX = Math.cos(moonOrbitAngle) * MOON_DISTANCE;
        const moonY = Math.sin(moonOrbitAngle) * MOON_DISTANCE;
        const moonZ_s = moonY * Math.sin(MOON_ORBIT_INCLINATION);
        const moonY_s = moonY * Math.cos(MOON_ORBIT_INCLINATION);
        const spacePos = new Cesium.Cartesian3(moonX, moonY_s, moonZ_s);

        const rotateToEcef = Cesium.Matrix3.fromRotationZ(-earthAngle);
        const ecefPos = Cesium.Matrix3.multiplyByVector(rotateToEcef, spacePos, new Cesium.Cartesian3());

        if (moonPosRef.current) moonPosRef.current = ecefPos;

        // 2. Update Stars (Stabilize in Space)
        if (starsRef.current) {
          const starRotation = Cesium.Matrix3.fromRotationZ(-earthAngle);
          starsRef.current.modelMatrix = Cesium.Matrix4.fromRotationTranslation(starRotation);
        }

        requestAnimationFrame(tick);
      };

      // Start ticker with current time to avoid NaN
      tick(performance.now());

      // ========= Label Occlusion Post-Render Manager =========
      // Hides overlapping labels to prevent clutter
      const resolveLabelOcclusion = () => {
        if (!viewer.current) return;
        const labels = viewer.current.entities.values.filter(e => e.label);
        const screenCoords = [];

        // Reset visibility first (only for distance Check)
        labels.forEach(e => {
          const pos = e.position.getValue(viewer.current.clock.currentTime);
          if (!pos) return;
          const pixelPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.current.scene, pos);
          if (pixelPos) {
            screenCoords.push({ entity: e, x: pixelPos.x, y: pixelPos.y, hidden: false });
          }
        });

        // Simple distance-based occlusion Check (N^2 but fine for ~20 cities)
        const MIN_DIST = 100; // Pixels
        for (let i = 0; i < screenCoords.length; i++) {
          if (screenCoords[i].hidden) continue;
          for (let j = i + 1; j < screenCoords.length; j++) {
            if (screenCoords[j].hidden) continue;
            const dx = screenCoords[i].x - screenCoords[j].x;
            const dy = screenCoords[i].y - screenCoords[j].y;
            const distSq = dx * dx + dy * dy;
            if (distSq < MIN_DIST * MIN_DIST) {
              // Hide the one with lower "priority" (index) or just the later one
              screenCoords[j].hidden = true;
              screenCoords[j].entity.label.show = false;
            }
          }
        }

        // Show the non-hidden ones
        screenCoords.forEach(c => {
          if (!c.hidden) c.entity.label.show = true;
        });
      };
      viewer.current.scene.postRender.addEventListener(resolveLabelOcclusion);

      // 添加点击事件监听器（仅在非过渡模式下）
      const clickHandler = (event) => {
        if (transitionMode) return; // 过渡模式下禁用点击

        try {
          const pickedObject = viewer.current.scene.pick(new Cesium.Cartesian2(event.clientX, event.clientY));

          if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
            const entity = pickedObject.id;

            // 检查是否点击了月球或任何光晕层
            if (entity.isMoon || entity.name === '月球光晕' || entity.name === '月球羽化光晕' || entity.name === '月球软羽化') {
              console.log('点击了月球，显示异地照片');
              setShowMoonPhotos(true);
              setCurrentMoonPhoto(0);
              return;
            }

            if (entity.pointData) {
              const pointData = entity.pointData;
              console.log('点击了标点:', pointData.name);

              onCityClick(pointData.name);
            }
          }
        } catch (error) {
          console.error('点击事件处理错误:', error);
        }
      };

      viewer.current.cesiumWidget.canvas.addEventListener('click', clickHandler);

      console.log('Cesium 初始化完成');

    } catch (error) {
      console.error('Cesium 初始化错误:', error);
    }

    // 清理函数
    return () => {
      try {
        if (viewer.current) {
          // Extra cleanup for custom listeners
          if (typeof resolveLabelOcclusion === 'function') {
            viewer.current.scene.postRender.removeEventListener(resolveLabelOcclusion);
          }
          viewer.current.destroy();
          viewer.current = null;
        }
      } catch (error) {
        console.error('Cesium 清理错误:', error);
      }
    };
  }, [goToCity]);

  // === Dynamic Stage Animation System ===
  // City tour list for Stage 2
  const tourCities = ['深圳', '香港', '台北', '成都', '广元', '马来西亚', '珠海', '桂林'];

  // Sync stageAnimating ref
  useEffect(() => {
    stageAnimatingRef.current = stageAnimating;
    if (!stageAnimating && stageAnimationRef.current) {
      // Immediately cancel running animation when stageAnimating becomes false
      stageAnimationRef.current();
      stageAnimationRef.current = null;
      // Also cancel any in-progress flyTo
      if (viewer.current) viewer.current.camera.cancelFlight();
    }
  }, [stageAnimating]);

  useEffect(() => {
    if (!viewer.current || activeStage < 0 || !stageAnimating) return;

    // Cleanup previous stage animation
    if (stageAnimationRef.current) {
      stageAnimationRef.current();
      stageAnimationRef.current = null;
    }

    console.log(`切换到场景阶段: ${activeStage}`);

    if (activeStage === 0) {
      let cancelled = false;

      // Dynamic flyTo: Predict where the rotation will be after 2s
      // Speed per second: 0.005236 * 60 = 0.31416 rad/s (Perfectly 1 rot / 20s)
      const ROT_SPEED_PER_SEC = 0.31416;
      const FLY_DURATION = 2;
      const predictedAngle = masterAngleRef.current + (ROT_SPEED_PER_SEC * FLY_DURATION);

      const startLng = 114;
      const startLat = 32;
      const endLng = startLng - (predictedAngle * 180 / Math.PI);
      const startDest = Cesium.Cartesian3.fromDegrees(endLng, startLat, 35000000);

      viewer.current.camera.flyTo({
        destination: startDest,
        orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
        duration: FLY_DURATION,
        complete: () => {
          if (cancelled || !stageAnimatingRef.current) return;

          // Force-sync immediately on arrival to eliminate prediction lag
          const actualAngle = masterAngleRef.current;
          const syncLng = startLng - (actualAngle * 180 / Math.PI);
          viewer.current.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(syncLng, startLat, 35000000),
            orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 }
          });

          let lastLoopTime = performance.now();
          const orbitLoop = (time) => {
            if (cancelled || !viewer.current || !stageAnimatingRef.current) return;
            const dt = (time - lastLoopTime) / 16.666;
            lastLoopTime = time;

            const earthAngle = masterAngleRef.current;
            const camLngAdjusted = startLng - (earthAngle * 180 / Math.PI);

            viewer.current.camera.setView({
              destination: Cesium.Cartesian3.fromDegrees(camLngAdjusted, startLat, 35000000),
              orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 }
            });

            requestAnimationFrame(orbitLoop);
          };
          orbitLoop(performance.now());
        }
      });

      stageAnimationRef.current = () => { cancelled = true; };
    }
    else if (activeStage === 1) {
      let angle = 0;
      let cancelled = false;

      // Targeting China (approx 110, 35)
      const startLng = 110;
      const startLat = 15;
      // Aligned with orbit start at angle=0 (lat becomes 15 + cos(0)*5 = 20)
      const flightDest = Cesium.Cartesian3.fromDegrees(startLng, 20, 6000000);

      viewer.current.camera.flyTo({
        destination: flightDest,
        orientation: { heading: 0, pitch: -Cesium.Math.toRadians(65), roll: 0 },
        duration: 2,
        complete: () => {
          if (cancelled || !stageAnimatingRef.current) return;

          // Force-sync to match orbitLoop entry (angle=0)
          viewer.current.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(startLng, 20, 6000000),
            orientation: { heading: 0, pitch: -Cesium.Math.toRadians(65), roll: 0 }
          });

          let lastLoopTime = performance.now();
          const rotateLoop = (time) => {
            if (cancelled || !viewer.current || !stageAnimatingRef.current) return;
            const dt = (time - lastLoopTime) / 16.666;
            lastLoopTime = time;

            const camLng = startLng + Math.sin(angle) * 10;
            const camLat = startLat + Math.cos(angle) * 5;
            viewer.current.camera.setView({
              destination: Cesium.Cartesian3.fromDegrees(camLng, camLat, 6000000),
              orientation: { heading: angle * 0.4, pitch: -Cesium.Math.toRadians(65), roll: 0 }
            });
            angle += 0.006 * Math.min(dt, 2.0); // Faster speed for Stage 1 focus (China Overview)
            requestAnimationFrame(rotateLoop);
          };
          rotateLoop(performance.now());
        }
      });

      stageAnimationRef.current = () => { cancelled = true; };
    }
    else if (activeStage === 2) {
      let cancelled = false;
      let currentCityIndex = 0;

      const getFurthestCity = (currentCityName) => {
        const currentCoord = cityPositions[currentCityName];
        if (!currentCoord) {
          // Fallback: If current city not found, pick a random city from cityPositions if any exist
          const availableCityNames = Object.keys(cityPositions);
          if (availableCityNames.length > 0) {
            return availableCityNames[Math.floor(Math.random() * availableCityNames.length)];
          }
          return null;
        }

        // Calculate all distances and filter out current
        const availableCityNames = Object.keys(cityPositions);
        const candidates = availableCityNames
          .filter(name => name !== currentCityName)
          .map(name => ({
            name,
            dist: cityPositions[name] ? Cesium.Cartesian3.distance(currentCoord, cityPositions[name]) : 0
          }))
          .sort((a, b) => b.dist - a.dist);

        // Pick randomly from the top 3 furthest to avoid A-B-A-B oscillation
        const topCount = Math.min(3, candidates.length);
        const choice = Math.floor(Math.random() * topCount);
        return candidates[choice].name;
      };

      const runDroneOrbit = (cityName, cityCoord) => {
        if (cancelled || !viewer.current || !stageAnimatingRef.current || !cityCoord) {
          console.warn('Drone orbit skipped: invalid city or animation cancelled');
          return;
        }

        const carto = Cesium.Cartographic.fromCartesian(cityCoord);
        const lng = Cesium.Math.toDegrees(carto.longitude);
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const orbitHeight = 350000;

        viewer.current.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lng, lat + 1, orbitHeight),
          orientation: { heading: Math.PI, pitch: Cesium.Math.toRadians(-45), roll: 0 },
          duration: 3,
          complete: () => {
            if (cancelled || !stageAnimatingRef.current) return;

            let orbitAngle = 0;
            let lastLoopTime = performance.now();
            const startDroneLoop = (time) => {
              if (cancelled || !viewer.current || !stageAnimatingRef.current) return;
              const dt = (time - lastLoopTime) / 16.666;
              lastLoopTime = time;

              orbitAngle += 0.005 * Math.min(dt, 2.0);
              const currentHeight = 350000 - (Math.min(orbitAngle, Math.PI) / Math.PI) * 200000;

              const dLng = lng + Math.sin(orbitAngle) * 2;
              const dLat = lat + Math.cos(orbitAngle) * 1;

              viewer.current.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(dLng, dLat, currentHeight),
                orientation: {
                  heading: orbitAngle + Math.PI,
                  pitch: Cesium.Math.toRadians(-45),
                  roll: 0
                }
              });

              if (orbitAngle < Math.PI * 2) {
                requestAnimationFrame(startDroneLoop);
              } else {
                // Done with this city, pick furthest next city
                const nextCity = getFurthestCity(cityName);
                setTimeout(() => {
                  if (!cancelled && nextCity) {
                    const nextCoord = cityPositions[nextCity];
                    if (nextCoord) {
                      runDroneOrbit(nextCity, nextCoord);
                    }
                  }
                }, 500);
              }
            };
            startDroneLoop(performance.now());
          }
        });
      };

      // Start with a city that has valid coordinates
      const firstValidCity = Object.keys(cityPositions)[0];
      if (firstValidCity && cityPositions[firstValidCity]) {
        runDroneOrbit(firstValidCity, cityPositions[firstValidCity]);
      } else {
        console.log('No valid cities for drone tour, skipping Stage 2 animation');
      }
      stageAnimationRef.current = () => { cancelled = true; };
    }

    return () => {
      if (stageAnimationRef.current) {
        stageAnimationRef.current();
        stageAnimationRef.current = null;
      }
    };
  }, [activeStage, stageAnimating]);

  // Camera interaction is always enabled - user can interrupt animations at any time


  // 清理当前动画的函数
  const cleanupCurrentAnimation = () => {
    if (animationCleanupRef.current) {
      console.log('取消当前动画');
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
    setIsAnimating(false);
    setCurrentAnimation(null);
    setShowTicket(false);
    setTicketImage(null);
    // 注意：不清理 latestAnimationRef，因为新动画已经设置了新的ID
  };

  // ========= Dynamic City Points from Supabase =========
  useEffect(() => {
    if (!viewer.current || !cityPointsProp || cityPointsProp.length === 0) return;

    // Remove previously added city entities
    cityEntitiesRef.current.forEach(entity => {
      try {
        if (viewer.current && viewer.current.entities.contains(entity)) {
          viewer.current.entities.remove(entity);
        }
      } catch (e) { /* entity may already be removed */ }
    });
    cityEntitiesRef.current = [];

    console.log('动态加载城市点位，总数:', cityPointsProp.length);

    cityPointsProp.forEach((pt, index) => {
      try {
        const position = Cesium.Cartesian3.fromDegrees(pt.lng, pt.lat, 0);

        const entity = viewer.current.entities.add({
          name: pt.name,
          position: position,
          point: {
            pixelSize: new Cesium.CallbackProperty((time) => {
              const phase = Cesium.JulianDate.secondsDifference(time, viewer.current.clock.currentTime) * 2 * Math.PI / 2;
              return 15 + Math.sin(phase) * 2;
            }, false),
            color: Cesium.Color.WHITE.withAlpha(0.8),
            outlineColor: Cesium.Color.WHITE.withAlpha(0.4),
            outlineWidth: new Cesium.CallbackProperty((time) => {
              const phase = Cesium.JulianDate.secondsDifference(time, viewer.current.clock.currentTime) * 2 * Math.PI / 2;
              return 3 + Math.sin(phase) * 3;
            }, false),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 1.5e7, 0.5),
          },
          label: {
            text: pt.name,
            font: 'bold 16px PingFang SC, Microsoft YaHei, Arial, sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -35),
            showBackground: true,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
            backgroundPadding: new Cesium.Cartesian2(10, 6),
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.2, 1.5e7, 0.6),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scale: new Cesium.CallbackProperty((time) => {
              const phase = Cesium.JulianDate.secondsDifference(time, viewer.current.clock.currentTime) * 2 * Math.PI / 2;
              return 1 + Math.sin(phase) * 0.02;
            }, false),
          },
          description: pt.name,
          pointData: pt,
        });

        cityEntitiesRef.current.push(entity);
        console.log(`[${index + 1}/${cityPointsProp.length}] 动态添加标点:`, pt.name);
      } catch (error) {
        console.error(`动态添加标点 ${pt.name} 失败:`, error);
      }
    });

    console.log('动态城市点位加载完成，当前实体数:', viewer.current.entities.values.length);
  }, [cityPointsProp]);

  // 城市坐标配置（从 cityPointsProp 动态生成）
  const cityPositions = useMemo(() => {
    const positions = {};
    if (cityPointsProp && cityPointsProp.length > 0) {
      cityPointsProp.forEach(pt => {
        positions[pt.name] = Cesium.Cartesian3.fromDegrees(pt.lng, pt.lat, 0);
      });
    }
    return positions;
  }, [cityPointsProp]);

  // 城市连线关系（保留供将来动效展示使用）
  const CITY_CONNECTIONS = [
    { from: '深圳', to: '东莞', type: 'car' },
    { from: '深圳', to: '珠海', type: 'car' },
    { from: '深圳', to: '南澳岛', type: 'car' },
    { from: '珠海', to: '中山', type: 'car' },
    { from: '中山', to: '惠州', type: 'car' },
    { from: '深圳', to: '河源', type: 'car' },
    { from: '深圳', to: '桂林', type: 'car' },
    { from: '桂林', to: '重庆', type: 'car' },
    { from: '重庆', to: '广元', type: 'car' },
    { from: '成都', to: '阿坝州', type: 'car' },
    { from: '台北', to: '台南', type: 'train' },
    { from: '台南', to: '高雄', type: 'train' },
    { from: '成都', to: '绵阳', type: 'car' },
    { from: '香港', to: '台北', type: 'plane' },
    { from: '深圳', to: '外伶仃岛', type: 'ship' },
    { from: '深圳', to: '马来西亚', type: 'plane' },
  ];

  const onCityClick = (cityName) => {
    // 保存当前相机状态，以便返回地球页时恢复
    if (viewer.current && viewer.current.camera) {
      savedCameraState.current = {
        destination: viewer.current.camera.position.clone(),
        orientation: {
          heading: viewer.current.camera.heading,
          pitch: viewer.current.camera.pitch,
          roll: viewer.current.camera.roll
        }
      };
      console.log('保存当前相机状态，用于返回时恢复');
    }

    // 直接跳转，不显示路径动画
    if (goToCity) goToCity(cityName);
  };

  // 月球照片触控滑动相关状态
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // 最小滑动距离 - 降低以提高灵敏度
  const minSwipeDistance = 20;

  // 月球照片导航函数
  const nextMoonPhoto = () => {
    setCurrentMoonPhoto((prev) => (prev + 1) % moonPhotos.length);
  };

  const prevMoonPhoto = () => {
    setCurrentMoonPhoto((prev) => (prev - 1 + moonPhotos.length) % moonPhotos.length);
  };

  // 触控事件处理 - 优化为更敏感的滑动
  const onTouchStart = (e) => {
    e.preventDefault();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e) => {
    e.preventDefault();
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const velocity = Math.abs(distance);

    // 降低距离要求，增加速度感知
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // 快速滑动时立即响应
    if (velocity > 10) {
      if (isLeftSwipe) {
        nextMoonPhoto();
      } else if (isRightSwipe) {
        prevMoonPhoto();
      }
    }
  };



  // 键盘导航支持
  const handleKeyDown = (e) => {
    if (!showMoonPhotos) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prevMoonPhoto();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextMoonPhoto();
        break;
      case 'Escape':
        e.preventDefault();
        setShowMoonPhotos(false);
        break;
    }
  };

  // 添加键盘事件监听
  useEffect(() => {
    if (showMoonPhotos) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showMoonPhotos]);

  // 监听地图风格变化（仅在viewer已创建且不是初始化时）
  useEffect(() => {
    if (viewer.current) {
      switchMapStyle(mapStyle);
    }
  }, [mapStyle]);

  // 获取下一个地图风格
  const getNextMapStyle = () => {
    const styleKeys = Object.keys(mapStyles);
    const currentIndex = styleKeys.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styleKeys.length;
    return styleKeys[nextIndex];
  };

  return (
    <div ref={cesiumContainer} style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>

      {/* 月球照片浏览器 - 触控滑动版本 */}
      {showMoonPhotos && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0',
            overflow: 'hidden',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* 返回按钮 - 左上角 */}
          <button
            onClick={() => setShowMoonPhotos(false)}
            style={{
              position: 'absolute',
              top: '30px',
              left: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '25px',
              padding: '12px 20px',
              fontSize: '16px',
              color: '#fff',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              fontFamily: 'PingFang SC, Microsoft YaHei, Arial, sans-serif',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ← 返回
          </button>

          {/* 古典诗句背景 - 百度汉语全部经典思念诗句 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}>
            {/* 第一层 - 远景层 (透明度 0.05-0.08) 边缘分布避免重叠 */}
            <div style={{
              position: 'absolute',
              left: '1%',
              top: '8%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.08)',
              fontSize: '14px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '2.8',
              transform: 'scale(0.85)'
            }}>
              晓镜但愁云鬓改<br />夜吟应觉月光寒
            </div>

            <div style={{
              position: 'absolute',
              right: '1%',
              top: '85%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.06)',
              fontSize: '12px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '1px',
              lineHeight: '3.2',
              transform: 'scale(0.75)'
            }}>
              多情只有春庭月<br />犹为离人照落花
            </div>

            <div style={{
              position: 'absolute',
              left: '94%',
              top: '32%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.07)',
              fontSize: '13px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '2.9'
            }}>
              当时明月在<br />曾照彩云归
            </div>

            <div style={{
              position: 'absolute',
              left: '3%',
              top: '95%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.05)',
              fontSize: '11px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '1px',
              lineHeight: '3.5',
              transform: 'scale(0.7)'
            }}>
              离人无语月无声<br />明月有光人有情
            </div>

            <div style={{
              position: 'absolute',
              right: '96%',
              top: '58%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.06)',
              fontSize: '12px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '1px',
              lineHeight: '3.1',
              transform: 'scale(0.8)'
            }}>
              今夜鄜州月<br />闺中只独看
            </div>

            <div style={{
              position: 'absolute',
              left: '92%',
              top: '3%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.08)',
              fontSize: '13px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '3.0',
              transform: 'scale(0.9)'
            }}>
              床前明月光<br />疑是地上霜
            </div>

            {/* 第二层 - 中远景层 (透明度 0.09-0.12) 网格分布 */}
            <div style={{
              position: 'absolute',
              left: '18%',
              top: '28%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.12)',
              fontSize: '18px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.3'
            }}>
              云中谁寄锦书来<br />雁字回时月满西楼
            </div>

            <div style={{
              position: 'absolute',
              right: '12%',
              top: '15%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.11)',
              fontSize: '16px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.5'
            }}>
              此生此夜不长好<br />明月明年何处看
            </div>

            <div style={{
              position: 'absolute',
              left: '28%',
              top: '88%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.10)',
              fontSize: '15px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '2.8'
            }}>
              可怜楼上月徘徊<br />应照离人妆镜台
            </div>

            <div style={{
              position: 'absolute',
              right: '52%',
              top: '2%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.09)',
              fontSize: '15px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '2.6'
            }}>
              情人怨遥夜<br />竟夕起相思
            </div>

            <div style={{
              position: 'absolute',
              left: '85%',
              top: '72%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.11)',
              fontSize: '14px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '2.9'
            }}>
              春风又绿江南岸<br />明月何时照我还
            </div>

            <div style={{
              position: 'absolute',
              right: '35%',
              top: '92%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.10)',
              fontSize: '14px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '3.0'
            }}>
              共看明月应垂泪<br />一夜乡心五处同
            </div>

            <div style={{
              position: 'absolute',
              left: '58%',
              top: '22%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.12)',
              fontSize: '15px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.7'
            }}>
              走马西来欲到天<br />辞家见月两回圆
            </div>

            <div style={{
              position: 'absolute',
              right: '75%',
              top: '45%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.09)',
              fontSize: '13px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '3.2'
            }}>
              不堪盈手赠<br />还寝梦佳期
            </div>

            {/* 第三层 - 中景层 (透明度 0.13-0.16) 避开前两层位置 */}
            <div style={{
              position: 'absolute',
              left: '38%',
              top: '18%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.16)',
              fontSize: '20px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '4px',
              lineHeight: '2.1'
            }}>
              举头望明月<br />低头思故乡
            </div>

            <div style={{
              position: 'absolute',
              right: '22%',
              top: '58%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.15)',
              fontSize: '19px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '4px',
              lineHeight: '2.2'
            }}>
              露从今夜白<br />月是故乡明
            </div>

            <div style={{
              position: 'absolute',
              left: '72%',
              top: '85%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.14)',
              fontSize: '17px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.4'
            }}>
              举杯邀明月<br />对影成三人
            </div>

            <div style={{
              position: 'absolute',
              right: '68%',
              top: '8%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.13)',
              fontSize: '16px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.6'
            }}>
              今夜月明人尽望<br />不知秋思落谁家
            </div>

            <div style={{
              position: 'absolute',
              left: '8%',
              top: '52%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.15)',
              fontSize: '18px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.3'
            }}>
              明月几时有<br />把酒问青天
            </div>

            <div style={{
              position: 'absolute',
              right: '58%',
              top: '78%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.14)',
              fontSize: '16px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '2.8'
            }}>
              明月松间照<br />清泉石上流
            </div>

            <div style={{
              position: 'absolute',
              left: '82%',
              top: '38%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.13)',
              fontSize: '15px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '2.9'
            }}>
              明月夜短苦日高<br />从此君王不早朝
            </div>

            {/* 第四层 - 近景层 (透明度 0.17-0.20) 完全避开前三层 */}
            <div style={{
              position: 'absolute',
              left: '12%',
              top: '68%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.20)',
              fontSize: '24px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '6px',
              lineHeight: '1.9'
            }}>
              海上生明月<br />天涯共此时
            </div>

            <div style={{
              position: 'absolute',
              right: '38%',
              top: '32%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.19)',
              fontSize: '22px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '5px',
              lineHeight: '2.0'
            }}>
              我寄愁心与明月<br />随君直到夜郎西
            </div>

            <div style={{
              position: 'absolute',
              left: '52%',
              top: '48%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.18)',
              fontSize: '20px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '4px',
              lineHeight: '2.1'
            }}>
              但愿人长久<br />千里共婵娟
            </div>

            <div style={{
              position: 'absolute',
              right: '85%',
              top: '28%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.17)',
              fontSize: '18px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.3'
            }}>
              月出皎兮佼人僚兮<br />舒窈纠兮劳心悄兮
            </div>

            <div style={{
              position: 'absolute',
              left: '68%',
              top: '5%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.18)',
              fontSize: '17px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.4'
            }}>
              暮云收尽溢清寒<br />银汉无声转玉盘
            </div>

            {/* 第五层 - 最前景层 (透明度 0.21-0.25) 完全独立空间布局 */}
            <div style={{
              position: 'absolute',
              left: '25%',
              top: '92%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.22)',
              fontSize: '21px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '5px',
              lineHeight: '2.0'
            }}>
              月下飞天镜<br />云生结海楼
            </div>

            <div style={{
              position: 'absolute',
              right: '48%',
              top: '12%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.23)',
              fontSize: '19px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '4px',
              lineHeight: '2.2'
            }}>
              嫦娥应悔偷灵药<br />碧海青天夜夜心
            </div>

            <div style={{
              position: 'absolute',
              left: '88%',
              top: '18%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.21)',
              fontSize: '16px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.5'
            }}>
              青女素娥俱耐冷<br />月中霜里斗婵娟
            </div>

            <div style={{
              position: 'absolute',
              right: '5%',
              top: '48%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.24)',
              fontSize: '18px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '4px',
              lineHeight: '2.3'
            }}>
              转朱阁低绮户<br />照无眠不应有恨
            </div>

            <div style={{
              position: 'absolute',
              left: '45%',
              top: '82%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.25)',
              fontSize: '20px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '5px',
              lineHeight: '2.0'
            }}>
              人有悲欢离合<br />月有阴晴圆缺
            </div>

            <div style={{
              position: 'absolute',
              right: '92%',
              top: '88%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.22)',
              fontSize: '17px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.4'
            }}>
              小时不识月<br />呼作白玉盘
            </div>

            <div style={{
              position: 'absolute',
              left: '32%',
              top: '62%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.21)',
              fontSize: '15px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '2px',
              lineHeight: '2.7'
            }}>
              月明星稀乌鹊南飞<br />绕树三匝何枝可依
            </div>

            <div style={{
              position: 'absolute',
              right: '72%',
              top: '2%',
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: 'rgba(255, 215, 0, 0.23)',
              fontSize: '16px',
              fontFamily: '"Ma Shan Zheng", "ZCOOL XiaoWei", "Noto Serif SC", "STKaiti", "KaiTi", cursive, serif',
              fontWeight: 'bold',
              letterSpacing: '3px',
              lineHeight: '2.6'
            }}>
              野旷天低树<br />江清月近人
            </div>
          </div>

          {/* 照片层叠容器 */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '50px',
            paddingBottom: '50px',
            zIndex: 5
          }}>





            {moonPhotos.map((photo, index) => {
              const isCurrent = index === currentMoonPhoto;
              const isPrev = index === (currentMoonPhoto - 1 + moonPhotos.length) % moonPhotos.length;
              const isNext = index === (currentMoonPhoto + 1) % moonPhotos.length;

              let zIndex = 1;
              let opacity = 0.3;
              let scale = 0.8;
              let translateX = 0;
              let translateY = 0;

              if (isCurrent) {
                zIndex = 5;
                opacity = 1;
                scale = 1;
                translateX = 0;
                translateY = 0;
              } else if (isPrev) {
                zIndex = 3;
                opacity = 0.6;
                scale = 0.85;
                translateX = -100;
                translateY = 20;
              } else if (isNext) {
                zIndex = 3;
                opacity = 0.6;
                scale = 0.85;
                translateX = 100;
                translateY = 20;
              } else {
                zIndex = 2;
                opacity = 0.3;
                scale = 0.7;
                translateX = (index < currentMoonPhoto) ? -200 : 200;
                translateY = 40;
              }

              return (
                <motion.img
                  key={index}
                  initial={false}
                  animate={{
                    opacity,
                    scale,
                    x: translateX,
                    y: translateY,
                    zIndex,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: 'easeOut',
                  }}
                  src={photo}
                  alt={`异地时光 ${index + 1}`}
                  onClick={() => setCurrentMoonPhoto(index)}
                  style={{
                    position: 'absolute',
                    maxWidth: '80vw',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: '20px',
                    boxShadow: isCurrent
                      ? '0 20px 40px rgba(0,0,0,0.8)'
                      : '0 10px 20px rgba(0,0,0,0.5)',
                    border: isCurrent
                      ? '3px solid rgba(255, 255, 255, 0.5)'
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    cursor: isCurrent ? 'default' : 'pointer',
                    userSelect: 'none',
                    touchAction: 'manipulation',
                  }}
                />
              );
            })}

            {/* 照片指示器 */}
            <div style={{
              position: 'absolute',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px',
              zIndex: 10
            }}>
              {moonPhotos.map((_, index) => (
                <motion.div
                  key={index}
                  onClick={() => setCurrentMoonPhoto(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: index === currentMoonPhoto ? '12px' : '8px',
                    height: index === currentMoonPhoto ? '12px' : '8px',
                    borderRadius: '50%',
                    backgroundColor: index === currentMoonPhoto
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: index === currentMoonPhoto
                      ? '2px solid rgba(255, 215, 0, 0.8)'
                      : '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
              ))}
            </div>


          </div>
        </motion.div>
      )}
    </div>
  );
} 