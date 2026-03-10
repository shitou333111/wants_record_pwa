import React, { useState, useEffect, useRef } from 'react';
import { loadReleaseSteps, loadReleaseIntervalSec } from './releaseConfig';

// Global variables to persist state across component remounts
let globalInitialTime: number | null = null;

const ReleasePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showText, setShowText] = useState(false);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowBgRef = useRef<HTMLDivElement>(null); // 直接操作DOM，绕过React渲染
  const initialTimeRef = useRef<number | null>(null);
  
  const [steps] = useState<string[]>(() => loadReleaseSteps());
  const [stepSeconds] = useState<number>(() => loadReleaseIntervalSec());
  const totalCycleDurationMs = steps.length * stepSeconds * 1000;

  // Function to restart the release process
  const restartRelease = () => {
    globalInitialTime = Date.now();
    initialTimeRef.current = globalInitialTime;
    setCurrentStep(0);
    setShowText(false);
    // 直接设置初始背景
    if (shadowBgRef.current && containerRef.current) {
      shadowBgRef.current.style.background = computeGradient(1.0, containerRef.current);
    }
  };

  // 计算渐变（纯函数，不依赖 state）
  const computeGradient = (intensity: number, container: HTMLElement): string => {
    const attr = document.documentElement.getAttribute('data-theme');
    const isDark = attr === 'dark' || (!attr && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const baseGray = isDark ? '#0a0a0a' : '#f9fafb';
    const darkValue = isDark
      ? Math.floor(intensity * 50)
      : Math.floor(255 - (intensity * 200));
    const darkGray = `rgb(${darkValue}, ${darkValue}, ${darkValue})`;
    const maxDimension = Math.max(container.clientWidth, container.clientHeight);
    const gradientSize = maxDimension * (1.0 - (intensity * 0.7));
    const ellipseWidth = gradientSize * 0.7;
    const ellipseHeight = gradientSize * 1.3;
    return `radial-gradient(${ellipseWidth}px ${ellipseHeight}px at center, ${darkGray} 0%, ${baseGray} 100%)`;
  };

  // Initialization runs only once on first mount
  useEffect(() => {
    restartRelease();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Shadow intensity animation loop - 直接操作 DOM，不触发 React 重渲染
  useEffect(() => {
    const animateShadow = () => {
      if (initialTimeRef.current === null) return;
      
      const elapsed = Date.now() - initialTimeRef.current;
      const cycleDurationMs = totalCycleDurationMs;
      const cyclePosition = elapsed % cycleDurationMs;
      
      let intensity = 1.0 - (cyclePosition / cycleDurationMs);
      if (cyclePosition >= cycleDurationMs - 16) {
        intensity = 0.0;
      }
      intensity = Math.max(0, Math.min(1, intensity));

      // 直接操作 DOM，完全绕过 React setState → 重渲染流程
      if (shadowBgRef.current && containerRef.current) {
        shadowBgRef.current.style.background = computeGradient(intensity, containerRef.current);
      }
      
      animationRef.current = requestAnimationFrame(animateShadow);
    };
    
    animationRef.current = requestAnimationFrame(animateShadow);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Text cycle logic
  useEffect(() => {
    const totalCycleDuration = totalCycleDurationMs;
    const stepDuration = stepSeconds * 1000;
    const textDisplayDuration = Math.max(1000, stepDuration - 1000);
    
    const updateTextBasedOnTime = () => {
      if (initialTimeRef.current === null) return;
      
      const elapsed = Date.now() - initialTimeRef.current;
      const cyclePosition = elapsed % totalCycleDuration;
      const currentStepIndex = Math.floor(cyclePosition / stepDuration);
      
      if (currentStep !== currentStepIndex) {
        setCurrentStep(currentStepIndex);
        setShowText(true);
      }
      
      const positionInStep = cyclePosition % stepDuration;
      if (positionInStep > textDisplayDuration) {
        setShowText(false);
      } else {
        setShowText(true);
      }
    };
    
    updateTextBasedOnTime();
    const interval = setInterval(updateTextBasedOnTime, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [currentStep, steps.length]);

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
      {/* 阴影背景 - 覆盖整个屏幕包括通知栏区域，由 ref 直接操作 */}
      <div 
        ref={shadowBgRef}
        className="shadow-background"
        style={{
          position: 'absolute',
          top: '-20px',
          left: 0,
          width: '100%',
          height: 'calc(100% + 40px)',
          background: 'radial-gradient(ellipse at center, rgb(55,55,55) 0%, #f9fafb 100%)',
          zIndex: 1
        }}
      />
      
      {/* 提示词 - 竖排文字，楷体，水平居中，上下留 10vh 边距 */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          textAlign: 'center',
          padding: '20vh 2rem',
          backgroundColor: 'transparent',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          boxSizing: 'border-box',
          pointerEvents: 'none'
        }}
      >
        <div 
          className={`release-text ${showText ? 'show' : ''}`}
          style={{
            fontSize: '1.5rem',
            // fontFamily: "'KaiTi', '楷体', 'STKaiti', serif",
            fontWeight: 600,
            color: 'var(--text-color)',
            lineHeight: 1.8,
            opacity: showText ? 1 : 0,
            transition: 'opacity 0.8s ease',
            writingMode: 'vertical-lr',
            textOrientation: 'upright',
            letterSpacing: '0.5em',
            margin: '0 auto',
            pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
            maxHeight: '80vh',
            overflow: 'hidden',
          }}
        >
          {steps[currentStep]}
        </div>
      </div>
    </div>
  );
};

export default ReleasePage;
