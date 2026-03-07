import React, { useState, useEffect, useRef } from 'react';

// Global variables to persist state across component remounts
let globalInitialTime: number | null = null;

const ReleasePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showText, setShowText] = useState(false);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialTimeRef = useRef<number | null>(null); // Ref to store the time of the first mount
  const [shadowIntensity, setShadowIntensity] = useState(1.0); // 0 to 1: 0 = light, 1 = dark - start at darkest
  
  const steps = [
    '你能仅仅是允许自己感受它吗',
    '你愿意释放它吗',
    '什么时候释放呢',
    '现在你有感觉好一点或轻松一点吗'
  ];

  // Function to restart the release process
  const restartRelease = () => {
    globalInitialTime = Date.now();
    initialTimeRef.current = globalInitialTime;
    setCurrentStep(0);
    setShowText(false);
    setShadowIntensity(1.0); // Start at darkest intensity
  };

  // Initialization runs only once on first mount, using global state to persist across tab switches
  useEffect(() => {
    restartRelease();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); 

  // 页面不可点击，只有点击托盘栏的闪电按钮才会从头开始
  // 移除点击处理函数

  // Shadow intensity animation loop - start at darkest and gradually lighten over exactly 30 seconds
  useEffect(() => {
    const animateShadow = () => {
      if (initialTimeRef.current === null) return;
      
      const elapsed = Date.now() - initialTimeRef.current; // Time elapsed since first mount (ms)
      const cycleDurationMs = 30000; // Exactly 30 seconds per cycle (only lightening)
      
      // Calculate position within current cycle
      const cyclePosition = elapsed % cycleDurationMs;
      
      // Start at intensity 1.0 (darkest) and gradually decrease to 0.0 over exactly 30 seconds
      // Use linear progression for smooth lightening
      let intensity = 1.0 - (cyclePosition / cycleDurationMs);
      
      // Ensure exactly 0.0 at 30 seconds (not slightly before or after)
      if (cyclePosition >= cycleDurationMs - 16) { // 16ms ~ one frame at 60fps
        intensity = 0.0;
      }
      
      // Clamp between 0 and 1
      intensity = Math.max(0, Math.min(1, intensity));
      setShadowIntensity(intensity);
      
      animationRef.current = requestAnimationFrame(animateShadow);
    };
    
    animationRef.current = requestAnimationFrame(animateShadow);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Text cycle logic - 4句话平分30秒，每句7.5秒（显示6.5秒 + 淡出1秒）
  useEffect(() => {
    const totalCycleDuration = 30000; // 30秒总周期
    const stepsCount = steps.length; // 4句话
    const stepDuration = totalCycleDuration / stepsCount; // 每句7.5秒
    
    const textDisplayDuration = 6500; // 每句显示6.5秒
    const hideDuration = 1000; // 淡出过渡1秒
    
    const updateTextBasedOnTime = () => {
      if (initialTimeRef.current === null) return;
      
      const elapsed = Date.now() - initialTimeRef.current;
      const cyclePosition = elapsed % totalCycleDuration;
      const currentStepIndex = Math.floor(cyclePosition / stepDuration);
      
      // 更新当前步骤
      if (currentStep !== currentStepIndex) {
        setCurrentStep(currentStepIndex);
        setShowText(true);
      }
      
      // 计算在当前步骤内的位置
      const positionInStep = cyclePosition % stepDuration;
      
      // 如果已经过了显示时间，开始淡出
      if (positionInStep > textDisplayDuration) {
        setShowText(false);
      } else {
        setShowText(true);
      }
    };
    
    // 立即更新一次
    updateTextBasedOnTime();
    
    // 设置定时器定期更新
    const interval = setInterval(updateTextBasedOnTime, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [currentStep, steps.length]);

  // Calculate radial gradient based on shadow intensity and container dimensions
  const getRadialGradient = () => {
    // Base gray color - matches the page background color
    const baseGray = '#f9fafb'; // Light gray background (matches var(--background-color))
    
    // Calculate dark gray based on intensity - darker as intensity increases
    // At maximum intensity (1.0), make it much darker for stronger contrast
    // Increased from 180 to 200 for even darker center at peak intensity
    const darkValue = Math.floor(255 - (shadowIntensity * 200)); // 255 to 55 range - much darker for stronger contrast
    const darkGray = `rgb(${darkValue}, ${darkValue}, ${darkValue})`;
    
    // Get container dimensions for elliptical gradient
    const container = containerRef.current;
    if (!container) {
      return `radial-gradient(ellipse at center, ${darkGray} 0%, ${baseGray} 100%)`;
    }
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Calculate gradient size based on intensity
    // Higher intensity = smaller gradient (more concentrated darkness)
    // Use fixed proportions: width-based for horizontal, height-based for vertical
    // Don't use aspect ratio - make it more circular but with slight vertical stretch
    const maxDimension = Math.max(width, height);
    
    // Intensity affects size: when intensity is high (dark), gradient is smaller
    // Use smooth transition for gradient size - no sudden jumps
    // Start at 100% of max dimension, shrink to 30% at maximum intensity for more concentrated darkness
    // This ensures the gradient always covers the entire page, just with different darkness levels
    const gradientSize = maxDimension * (1.0 - (shadowIntensity * 0.7)); // 100% to 30% of max dimension
    
    // Create elliptical gradient with fixed proportions (slightly taller than wide)
    // Width: 70% of gradientSize, Height: 130% of gradientSize - more vertical to cover notification bar
    const ellipseWidth = gradientSize * 0.7;
    const ellipseHeight = gradientSize * 1.3;
    
    // Create elliptical gradient that adapts to page dimensions
    // Use smooth color stops to avoid hard edges - ensure edge always matches baseGray
    // The key is to make the transition from darkGray to baseGray very gradual
    return `radial-gradient(${ellipseWidth}px ${ellipseHeight}px at center, ${darkGray} 0%, ${baseGray} 100%)`;
  };

  return (
    <div 
      className="release-page" 
      ref={containerRef}
      style={{ 
        cursor: 'default', 
        height: '100vh', 
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        userSelect: 'none',
        pointerEvents: 'none'
      }}
    >
      {/* 阴影背景 - 覆盖整个屏幕包括通知栏区域 */}
      <div 
        className="shadow-background"
        style={{
          position: 'absolute',
          top: '-20px', // 向上扩展以覆盖通知栏
          left: 0,
          width: '100%',
          height: 'calc(100% + 40px)', // 增加高度以覆盖通知栏
          background: getRadialGradient(),
          transition: 'background 0.1s ease-out',
          zIndex: 1
        }}
      />
      
      {/* 提示词 - 竖排文字，楷体，水平居中 */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'transparent',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          pointerEvents: 'none'
        }}
      >
        <div 
          className={`release-text ${showText ? 'show' : ''}`}
          style={{
            fontSize: '1.8rem',
            fontFamily: "'KaiTi', '楷体', 'STKaiti', serif",
            fontWeight: 600,
            color: 'var(--text-color)',
            lineHeight: 1.8,
            opacity: showText ? 1 : 0,
            transition: 'opacity 0.8s ease',
            writingMode: 'vertical-rl',
            textOrientation: 'upright',
            letterSpacing: '0.5em',
            margin: '0 auto',
            pointerEvents: 'none'
          }}
        >
          {steps[currentStep]}
        </div>
      </div>
    </div>
  );
};

export default ReleasePage;