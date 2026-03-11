import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HomeStepConfig, FIXED_HOME_FINAL, loadHomeSteps } from './releaseConfig';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import ReleasePage from './ReleasePage';
import HelpPage from './HelpPage';
import NoteEditor from './NoteEditor';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels);

interface EmotionData {
  date: string;
  wantApproval: number;
  wantControl: number;
  wantSecurity: number;
  despair: number;
  sorrow: number;
  fear: number;
  greed: number;
  anger: number;
  pride: number;
  fearless: number;
  acceptance: number;
  peace: number;
  thoughts: string;
  // 释放次数
  releaseDespair: number;
  releaseSorrow: number;
  releaseFear: number;
  releaseGreed: number;
  releaseAnger: number;
  releasePride: number;
  releaseFearless: number;
  releaseAcceptance: number;
  releasePeace: number;
  releaseWantApproval: number;
  releaseWantControl: number;
  releaseWantSecurity: number;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'help' | 'release'>('home');

  // 主题模式：auto（跟随系统）| light | dark
  const [themeMode, setThemeMode] = useState<'auto' | 'light' | 'dark'>(
    () => (localStorage.getItem('themeMode') as 'auto' | 'light' | 'dark') || 'auto'
  );

  // 应用 data-theme 到 html 元素
  useEffect(() => {
    const html = document.documentElement;
    if (themeMode === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else if (themeMode === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const [desires, setDesires] = useState({
    wantApproval: 0,
    wantControl: 0,
    wantSecurity: 0
  });
  const [moods, setMoods] = useState({
    despair: 0,
    sorrow: 0,
    fear: 0,
    greed: 0,
    anger: 0,
    pride: 0,
    fearless: 0,
    acceptance: 0,
    peace: 0
  });
  
  // 释放次数
  const [releaseCounts, setReleaseCounts] = useState({
    // 情绪释放次数
    despair: 0,
    sorrow: 0,
    fear: 0,
    greed: 0,
    anger: 0,
    pride: 0,
    fearless: 0,
    acceptance: 0,
    peace: 0,
    // 想要释放次数
    wantApproval: 0,
    wantControl: 0,
    wantSecurity: 0
  });
  const [thoughts, setThoughts] = useState('');
  const [, setSaveStatus] = useState('');
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [selectedDayData, setSelectedDayData] = useState<{
    date: string;
    moods: Record<string, number>;
    desires: Record<string, number>;
    releaseCounts: Record<string, number>;
    thoughts: string;
  } | null>(null);

  const [homeReleaseSteps, setHomeReleaseSteps] = useState<HomeStepConfig[]>(() => loadHomeSteps());
  
  const [longPressModal, setLongPressModal] = useState<{
    visible: boolean;
    type: 'mood' | 'desire';
    key: string;
    label: string;
    step: number;
  }>({
    visible: false,
    type: 'mood',
    key: '',
    label: '',
    step: 1
  });
  
  // 控制body的modal-open类
  useEffect(() => {
    if (longPressModal.visible) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [longPressModal.visible]);

  // 模态框打开时重载自定义步骤
  useEffect(() => {
    if (longPressModal.visible) {
      setHomeReleaseSteps(loadHomeSteps());
    }
  }, [longPressModal.visible]);
  
  // 当前显示的月份和年份
  const [currentDate, setCurrentDate] = useState(new Date());

  // 初始化IndexedDB
  const initDB = useCallback(() => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('EmotionDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('emotions')) {
          db.createObjectStore('emotions', { keyPath: 'date' });
        }
      };
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      const db = await initDB();
      const transaction = db.transaction('emotions', 'readonly');
      const store = transaction.objectStore('emotions');
      const request = store.getAll();
      
      request.onsuccess = () => {
        setEmotionData(request.result);
      };
      
      request.onerror = () => {
        console.error('加载数据失败');
      };
    } catch (error) {
      console.error('初始化数据库失败:', error);
    }
  }, [initDB]);

  // 保存数据
  const saveData = useCallback(async (data: EmotionData, source: string = 'unknown') => {
    console.log(`[${new Date().toLocaleTimeString()}] 开始保存数据 (来源: ${source}):`, data);
    try {
      const db = await initDB();
      console.log(`[${new Date().toLocaleTimeString()}] 数据库初始化成功:`, db);
      const transaction = db.transaction('emotions', 'readwrite');
      console.log(`[${new Date().toLocaleTimeString()}] 事务创建成功:`, transaction);
      const store = transaction.objectStore('emotions');
      console.log(`[${new Date().toLocaleTimeString()}] 对象存储创建成功:`, store);
      
      // 直接保存或更新数据
      const request = store.put(data);
      console.log(`[${new Date().toLocaleTimeString()}] 保存请求发送:`, request);
      
      request.onsuccess = () => {
        console.log(`[${new Date().toLocaleTimeString()}] 保存成功`);
      };
      
      request.onerror = (event) => {
        console.error(`[${new Date().toLocaleTimeString()}] 保存请求失败:`, event);
      };
      
      transaction.oncomplete = () => {
        console.log(`[${new Date().toLocaleTimeString()}] 事务完成`);
        setSaveStatus('已保存');
        setTimeout(() => setSaveStatus(''), 2000);
        // 保存成功后重新加载数据，确保状态同步
        loadData();
      };
      
      transaction.onerror = (event) => {
        console.error(`[${new Date().toLocaleTimeString()}] 事务失败:`, event);
      };
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] 保存数据失败:`, error);
      setSaveStatus('保存失败');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  }, [initDB, loadData]);

  // 初始化数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 处理想要按钮点击
  const handleDesireClick = (desire: keyof typeof desires) => {
    setDesires(prev => {
      const newDesires = {
        ...prev,
        [desire]: prev[desire] + 1
      };
      
      // 立即保存数据
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const date = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${date}`;
      
      saveData({
        date: todayStr,
        wantApproval: newDesires.wantApproval,
        wantControl: newDesires.wantControl,
        wantSecurity: newDesires.wantSecurity,
        despair: moods.despair,
        sorrow: moods.sorrow,
        fear: moods.fear,
        greed: moods.greed,
        anger: moods.anger,
        pride: moods.pride,
        fearless: moods.fearless,
        acceptance: moods.acceptance,
        peace: moods.peace,
        thoughts,
        // 释放次数
        releaseDespair: releaseCounts.despair,
        releaseSorrow: releaseCounts.sorrow,
        releaseFear: releaseCounts.fear,
        releaseGreed: releaseCounts.greed,
        releaseAnger: releaseCounts.anger,
        releasePride: releaseCounts.pride,
        releaseFearless: releaseCounts.fearless,
        releaseAcceptance: releaseCounts.acceptance,
        releasePeace: releaseCounts.peace,
        releaseWantApproval: releaseCounts.wantApproval,
        releaseWantControl: releaseCounts.wantControl,
        releaseWantSecurity: releaseCounts.wantSecurity
      }, 'handleDesireClick');

      
      return newDesires;
    });
  };

  // 处理情绪按钮点击
  const handleMoodClick = (mood: keyof typeof moods) => {
    setMoods(prev => {
      const newMoods = {
        ...prev,
        [mood]: prev[mood] + 1
      };
      
      // 立即保存数据
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const date = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${date}`;
      
      saveData({
        date: todayStr,
        wantApproval: desires.wantApproval,
        wantControl: desires.wantControl,
        wantSecurity: desires.wantSecurity,
        despair: newMoods.despair,
        sorrow: newMoods.sorrow,
        fear: newMoods.fear,
        greed: newMoods.greed,
        anger: newMoods.anger,
        pride: newMoods.pride,
        fearless: newMoods.fearless,
        acceptance: newMoods.acceptance,
        peace: newMoods.peace,
        thoughts,
        // 释放次数
        releaseDespair: releaseCounts.despair,
        releaseSorrow: releaseCounts.sorrow,
        releaseFear: releaseCounts.fear,
        releaseGreed: releaseCounts.greed,
        releaseAnger: releaseCounts.anger,
        releasePride: releaseCounts.pride,
        releaseFearless: releaseCounts.fearless,
        releaseAcceptance: releaseCounts.acceptance,
        releasePeace: releaseCounts.peace,
        releaseWantApproval: releaseCounts.wantApproval,
        releaseWantControl: releaseCounts.wantControl,
        releaseWantSecurity: releaseCounts.wantSecurity
      }, 'handleMoodClick');

      
      return newMoods;
    });
  };

  // 处理长按事件
  const handleLongPress = (type: 'mood' | 'desire', key: string, label: string) => {
    setLongPressModal({
      visible: true,
      type,
      key,
      label,
      step: 1
    });
  };

  // 处理按钮点击
  // 用 ref 追踪最新 releaseCounts，避免闭包过期导致保存数据不准确
  const releaseCountsRef = useRef(releaseCounts);
  useEffect(() => { releaseCountsRef.current = releaseCounts; }, [releaseCounts]);

  const handleModalButtonClick = (response: 'yes' | 'no') => {
    // 直接使用已加载到 state 的 homeReleaseSteps，避免每次点击都读 localStorage
    const N = homeReleaseSteps.length;
    const finalStep = N + 1;
    const currentStep = longPressModal.step;

    if (currentStep < N) {
      // 中间步骤 → 进入下一步
      setLongPressModal(prev => ({ ...prev, step: prev.step + 1 }));
    } else if (currentStep === N) {
      // 最后一个问题步骤 → 记录释放次数，进入完成步
      setReleaseCounts(prevCounts => ({
        ...prevCounts,
        [longPressModal.key]: prevCounts[longPressModal.key as keyof typeof prevCounts] + 1
      }));
      setLongPressModal(prev => ({ ...prev, step: finalStep }));
    } else {
      // 完成步
      if (response === 'yes') {
        // 继续释放 → 回到第一步
        setLongPressModal(prev => ({ ...prev, step: 1 }));
      } else {
        // 结束 → 关闭弹窗，并用 ref 中最新的 releaseCounts 保存数据
        setLongPressModal(prev => ({ ...prev, visible: false }));

        const latestCounts = releaseCountsRef.current;
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${date}`;

        saveData({
          date: todayStr,
          wantApproval: desires.wantApproval,
          wantControl: desires.wantControl,
          wantSecurity: desires.wantSecurity,
          despair: moods.despair,
          sorrow: moods.sorrow,
          fear: moods.fear,
          greed: moods.greed,
          anger: moods.anger,
          pride: moods.pride,
          fearless: moods.fearless,
          acceptance: moods.acceptance,
          peace: moods.peace,
          thoughts,
          releaseDespair: latestCounts.despair,
          releaseSorrow: latestCounts.sorrow,
          releaseFear: latestCounts.fear,
          releaseGreed: latestCounts.greed,
          releaseAnger: latestCounts.anger,
          releasePride: latestCounts.pride,
          releaseFearless: latestCounts.fearless,
          releaseAcceptance: latestCounts.acceptance,
          releasePeace: latestCounts.peace,
          releaseWantApproval: latestCounts.wantApproval,
          releaseWantControl: latestCounts.wantControl,
          releaseWantSecurity: latestCounts.wantSecurity
        }, 'handleModalButtonClick');
      }
    }
  };

  // 创建长按处理函数
  const createLongPressHandler = (type: 'mood' | 'desire', key: string, label: string) => {
    let timer: NodeJS.Timeout | null = null;
    let touchStartX = 0;
    let touchStartY = 0;
    const threshold = 10; // 滑动阈值

    const clearPressTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    return {
      onMouseDown: () => {
        clearPressTimer();
        timer = setTimeout(() => {
          handleLongPress(type, key, label);
        }, 500);
      },
      onMouseUp: clearPressTimer,
      onMouseLeave: clearPressTimer,
      onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
        clearPressTimer();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        timer = setTimeout(() => {
          handleLongPress(type, key, label);
        }, 500);

      },
      onTouchEnd: clearPressTimer,
      onTouchCancel: clearPressTimer,
      onTouchMove: (e: React.TouchEvent<HTMLButtonElement>) => {
        if (!timer || e.touches.length === 0) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const diffX = Math.abs(touchX - touchStartX);
        const diffY = Math.abs(touchY - touchStartY);

        if (diffX > threshold || diffY > threshold) {
          clearPressTimer();
        }
      },
    };
  };

  // 自动保存 - 仅针对今日感想输入
  useEffect(() => {
    // 只有当thoughts有实际内容时才触发自动保存
    if (!thoughts) return;
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${date}`;
    const saveTimer = setTimeout(() => {
      saveData({
        date: todayStr,
        wantApproval: desires.wantApproval,
        wantControl: desires.wantControl,
        wantSecurity: desires.wantSecurity,
        despair: moods.despair,
        sorrow: moods.sorrow,
        fear: moods.fear,
        greed: moods.greed,
        anger: moods.anger,
        pride: moods.pride,
        fearless: moods.fearless,
        acceptance: moods.acceptance,
        peace: moods.peace,
        thoughts,
        releaseDespair: releaseCounts.despair,
        releaseSorrow: releaseCounts.sorrow,
        releaseFear: releaseCounts.fear,
        releaseGreed: releaseCounts.greed,
        releaseAnger: releaseCounts.anger,
        releasePride: releaseCounts.pride,
        releaseFearless: releaseCounts.fearless,
        releaseAcceptance: releaseCounts.acceptance,
        releasePeace: releaseCounts.peace,
        releaseWantApproval: releaseCounts.wantApproval,
        releaseWantControl: releaseCounts.wantControl,
        releaseWantSecurity: releaseCounts.wantSecurity
      }, 'autoSave');

    }, 2000);
    return () => clearTimeout(saveTimer);
  }, [thoughts]);

  // 每天24点归零
    useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      
      if (hours === 0 && minutes === 0 && seconds === 0) {
        setDesires({
          wantApproval: 0,
          wantControl: 0,
          wantSecurity: 0
        });
        setMoods({
          despair: 0,
          sorrow: 0,
          fear: 0,
          greed: 0,
          anger: 0,
          pride: 0,
          fearless: 0,
          acceptance: 0,
          peace: 0
        });
        setReleaseCounts({
          despair: 0,
          sorrow: 0,
          fear: 0,
          greed: 0,
          anger: 0,
          pride: 0,
          fearless: 0,
          acceptance: 0,
          peace: 0,
          wantApproval: 0,
          wantControl: 0,
          wantSecurity: 0
        });
        setThoughts('');
      }
    };

    // 每分钟检查一次
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, []);

  // 初始加载时默认显示当天的情绪和感想
  useEffect(() => {
    const today = new Date();
    handleDayClick(today);
  }, []);

  // 当切换到统计分析页面时，显示当天的数据
  useEffect(() => {
    if (activeTab === 'stats') {
      const today = new Date();
      handleDayClick(today);
    }
  }, [activeTab]);

  // 加载当天数据
  useEffect(() => {
    // 只有在非统计分析页面时才加载当天数据
    if (activeTab !== 'stats') {
      // 使用本地时间获取日期字符串，避免时区问题
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const date = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${date}`;
      
      const dayData = emotionData.find(item => item.date === todayStr);
      if (dayData) {
        setDesires({
          wantApproval: dayData.wantApproval,
          wantControl: dayData.wantControl,
          wantSecurity: dayData.wantSecurity || 0
        });
        setMoods({
          despair: dayData.despair || 0,
          sorrow: dayData.sorrow || 0,
          fear: dayData.fear || 0,
          greed: dayData.greed || 0,
          anger: dayData.anger || 0,
          pride: dayData.pride || 0,
          fearless: dayData.fearless || 0,
          acceptance: dayData.acceptance || 0,
          peace: dayData.peace || 0
        });
        setReleaseCounts({
          despair: dayData.releaseDespair || 0,
          sorrow: dayData.releaseSorrow || 0,
          fear: dayData.releaseFear || 0,
          greed: dayData.releaseGreed || 0,
          anger: dayData.releaseAnger || 0,
          pride: dayData.releasePride || 0,
          fearless: dayData.releaseFearless || 0,
          acceptance: dayData.releaseAcceptance || 0,
          peace: dayData.releasePeace || 0,
          wantApproval: dayData.releaseWantApproval || 0,
          wantControl: dayData.releaseWantControl || 0,
          wantSecurity: dayData.releaseWantSecurity || 0
        });
        setThoughts(dayData.thoughts);
      } else {
        setDesires({
          wantApproval: 0,
          wantControl: 0,
          wantSecurity: 0
        });
        setMoods({
          despair: 0,
          sorrow: 0,
          fear: 0,
          greed: 0,
          anger: 0,
          pride: 0,
          fearless: 0,
          acceptance: 0,
          peace: 0
        });
        setReleaseCounts({
          despair: 0,
          sorrow: 0,
          fear: 0,
          greed: 0,
          anger: 0,
          pride: 0,
          fearless: 0,
          acceptance: 0,
          peace: 0,
          wantApproval: 0,
          wantControl: 0,
          wantSecurity: 0
        });
        setThoughts('');
      }
    }
  }, [emotionData, activeTab]);

  // 计算每天的活动量
  const calculateActivityLevel = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dayData = emotionData.find(item => item.date === dateStr);
    if (!dayData) return 0;
    
    // 计算总活动量：情绪记录 + 想要记录 + 释放练习次数
    let totalActivity = 0;
    
    // 情绪记录
    totalActivity += dayData.despair || 0;
    totalActivity += dayData.sorrow || 0;
    totalActivity += dayData.fear || 0;
    totalActivity += dayData.greed || 0;
    totalActivity += dayData.anger || 0;
    totalActivity += dayData.pride || 0;
    totalActivity += dayData.fearless || 0;
    totalActivity += dayData.acceptance || 0;
    totalActivity += dayData.peace || 0;
    
    // 想要记录
    totalActivity += dayData.wantApproval || 0;
    totalActivity += dayData.wantControl || 0;
    totalActivity += dayData.wantSecurity || 0;
    
    // 释放练习次数
    totalActivity += dayData.releaseDespair || 0;
    totalActivity += dayData.releaseSorrow || 0;
    totalActivity += dayData.releaseFear || 0;
    totalActivity += dayData.releaseGreed || 0;
    totalActivity += dayData.releaseAnger || 0;
    totalActivity += dayData.releasePride || 0;
    totalActivity += dayData.releaseFearless || 0;
    totalActivity += dayData.releaseAcceptance || 0;
    totalActivity += dayData.releasePeace || 0;
    totalActivity += dayData.releaseWantApproval || 0;
    totalActivity += dayData.releaseWantControl || 0;
    totalActivity += dayData.releaseWantSecurity || 0;
    
    return totalActivity;
  };
  
  // 获取当月的活动量范围
  const getMonthlyActivityRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    let minActivity = Infinity;
    let maxActivity = 0;
    
    // 遍历当月所有日期
    // const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const activity = calculateActivityLevel(date);
      
      if (activity < minActivity) minActivity = activity;
      if (activity > maxActivity) maxActivity = activity;
    }
    
    return { min: minActivity, max: maxActivity };
  };
  
  // 根据活动量获取颜色深度
  const getActivityColor = (date: Date) => {
    const activity = calculateActivityLevel(date);
    const { min, max } = getMonthlyActivityRange();
    
    if (max === min) return 'activity-level-0';
    
    const ratio = (activity - min) / (max - min);
    
    if (ratio < 0.25) return 'activity-level-1';
    if (ratio < 0.5) return 'activity-level-2';
    if (ratio < 0.75) return 'activity-level-3';
    return 'activity-level-4';
  };
  
  // 生成月历数据
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // 调整为从周一开始
    const dayOfWeek = firstDay.getDay();
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const days = [];
    
    // 添加月初的空白格子
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    
    // 添加当月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // 处理日期点击
  const handleDayClick = (day: Date) => {
    // 使用本地时间获取日期字符串，避免时区问题
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const date = String(day.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${date}`;
    
    const dayData = emotionData.find(item => item.date === dateStr);
    if (dayData) {
      setSelectedDayData({
        date: dateStr,
        moods: {
          despair: dayData.despair || 0,
          sorrow: dayData.sorrow || 0,
          fear: dayData.fear || 0,
          greed: dayData.greed || 0,
          anger: dayData.anger || 0,
          pride: dayData.pride || 0,
          fearless: dayData.fearless || 0,
          acceptance: dayData.acceptance || 0,
          peace: dayData.peace || 0
        },
        desires: {
          wantApproval: dayData.wantApproval || 0,
          wantControl: dayData.wantControl || 0,
          wantSecurity: dayData.wantSecurity || 0
        },
        releaseCounts: {
          despair: dayData.releaseDespair || 0,
          sorrow: dayData.releaseSorrow || 0,
          fear: dayData.releaseFear || 0,
          greed: dayData.releaseGreed || 0,
          anger: dayData.releaseAnger || 0,
          pride: dayData.releasePride || 0,
          fearless: dayData.releaseFearless || 0,
          acceptance: dayData.releaseAcceptance || 0,
          peace: dayData.releasePeace || 0,
          wantApproval: dayData.releaseWantApproval || 0,
          wantControl: dayData.releaseWantControl || 0,
          wantSecurity: dayData.releaseWantSecurity || 0
        },
        thoughts: dayData.thoughts || ''
      });
    } else {
      setSelectedDayData({
        date: dateStr,
        moods: {},
        desires: {},
        releaseCounts: {},
        thoughts: ''
      });
    }
  };

  // 生成条形图数据
  const generateBarChartData = () => {
    const labels = ['万念俱灰', '悲苦', '恐惧', '贪求', '愤怒', '自尊自傲', '无畏', '接纳', '平静', '想被认同', '想要控制', '想要安全'];
    // 对应首页按钮背景色
    const baseColors = [
      '#94a3b8', '#fda4af', '#93c5fd', '#fcd34d', '#f87171',
      '#c4b5fd', '#6ee7b7', '#a78bfa', '#d6d3d1',
      '#dbeafe', '#d1fae5', '#fef3c7'
    ];
    const recordCounts = new Array(12).fill(0);
    const releaseCountsArr = new Array(12).fill(0);

    emotionData.forEach(item => {
      recordCounts[0] += item.despair || 0;
      recordCounts[1] += item.sorrow || 0;
      recordCounts[2] += item.fear || 0;
      recordCounts[3] += item.greed || 0;
      recordCounts[4] += item.anger || 0;
      recordCounts[5] += item.pride || 0;
      recordCounts[6] += item.fearless || 0;
      recordCounts[7] += item.acceptance || 0;
      recordCounts[8] += item.peace || 0;
      recordCounts[9] += item.wantApproval || 0;
      recordCounts[10] += item.wantControl || 0;
      recordCounts[11] += item.wantSecurity || 0;

      releaseCountsArr[0] += item.releaseDespair || 0;
      releaseCountsArr[1] += item.releaseSorrow || 0;
      releaseCountsArr[2] += item.releaseFear || 0;
      releaseCountsArr[3] += item.releaseGreed || 0;
      releaseCountsArr[4] += item.releaseAnger || 0;
      releaseCountsArr[5] += item.releasePride || 0;
      releaseCountsArr[6] += item.releaseFearless || 0;
      releaseCountsArr[7] += item.releaseAcceptance || 0;
      releaseCountsArr[8] += item.releasePeace || 0;
      releaseCountsArr[9] += item.releaseWantApproval || 0;
      releaseCountsArr[10] += item.releaseWantControl || 0;
      releaseCountsArr[11] += item.releaseWantSecurity || 0;
    });

    const title = '迄今为止情绪/想要统计';
    const totals = recordCounts.map((r, i) => r + releaseCountsArr[i]);
    // 3种"想要"的边框颜色（与首页按钮一致）
    const wantBorderColors = ['#1e40af', '#065f46', '#92400e'];

    return {
      title,
      data: {
        labels,
        datasets: [
          {
            label: '觉察次数',
            data: recordCounts,
            // 透明度写法：两位 hex = Math.round(透明度% / 100 * 255).toString(16)
            // cc = round(80/100*255)=204=0xcc → 80%
            backgroundColor: baseColors.map(c => c + 'cc'), // 80%
            borderWidth: (ctx: any) => ctx.dataIndex >= 9
              ? { top: 0, right: 1, bottom: 1, left: 1 }
              : 0,
            borderColor: (ctx: any) => ctx.dataIndex >= 9
              ? wantBorderColors[ctx.dataIndex - 9]
              : 'transparent',
            borderRadius: 0,
            stack: 'stack'
          } as any,
          {
            label: '释放次数',
            data: releaseCountsArr,
            backgroundColor: baseColors, // ff = 100%
            // 非想要：底部黑色线分隔两段；想要：用专属颜色全边框
            borderWidth: (ctx: any) => ctx.dataIndex >= 9
              ? { top: 1, right: 1, bottom: 1, left: 1 }
              : { top: 0, right: 0, bottom: 2, left: 0 },
            borderColor: (ctx: any) => ctx.dataIndex >= 9
              ? wantBorderColors[ctx.dataIndex - 9]
              : '#000000',
            borderRadius: 4,
            stack: 'stack',
            totals
          } as any
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        layout: { padding: { top: 24 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index' as const,
            intersect: false,
            callbacks: {
              title: (items: any[]) => items[0]?.label ?? '',
              label: (item: any) => `${item.dataset.label}: ${item.raw}`
            }
          },
          datalabels: {
            display: (ctx: any) => ctx.datasetIndex === 1,
            anchor: 'end' as const,
            align: 'end' as const,
            formatter: (_val: any, ctx: any) => {
              const total = (ctx.dataset as any).totals?.[ctx.dataIndex];
              return total > 0 ? total : '';
            },
            font: { size: 12, weight: 'bold' as const },
            color: '#555'
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            border: { display: true },
            ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 45, padding: 2 }
          },
          y: {
            stacked: true,
            display: false,
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    };
  };

  // 生成情绪饼状图数据
  const generateMoodPieData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthData = emotionData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    });
    
    const allItems = [
      { label: '万念俱灰', color: '#94a3b8', borderColor: '#334155', getRecord: (d: EmotionData) => d.despair || 0,    getRelease: (d: EmotionData) => d.releaseDespair || 0 },
      { label: '悲苦',     color: '#fda4af', borderColor: '#dc2626', getRecord: (d: EmotionData) => d.sorrow || 0,     getRelease: (d: EmotionData) => d.releaseSorrow || 0 },
      { label: '恐惧',     color: '#93c5fd', borderColor: '#1d4ed8', getRecord: (d: EmotionData) => d.fear || 0,      getRelease: (d: EmotionData) => d.releaseFear || 0 },
      { label: '贪求',     color: '#fcd34d', borderColor: '#d97706', getRecord: (d: EmotionData) => d.greed || 0,     getRelease: (d: EmotionData) => d.releaseGreed || 0 },
      { label: '愤怒',     color: '#f87171', borderColor: '#b91c1c', getRecord: (d: EmotionData) => d.anger || 0,     getRelease: (d: EmotionData) => d.releaseAnger || 0 },
      { label: '自尊自傲', color: '#c4b5fd', borderColor: '#7e22ce', getRecord: (d: EmotionData) => d.pride || 0,     getRelease: (d: EmotionData) => d.releasePride || 0 },
      { label: '无畏',     color: '#6ee7b7', borderColor: '#059669', getRecord: (d: EmotionData) => d.fearless || 0,  getRelease: (d: EmotionData) => d.releaseFearless || 0 },
      { label: '接纳',     color: '#a78bfa', borderColor: '#6d28d9', getRecord: (d: EmotionData) => d.acceptance || 0,getRelease: (d: EmotionData) => d.releaseAcceptance || 0 },
      { label: '平静',     color: '#d6d3d1', borderColor: '#334155', getRecord: (d: EmotionData) => d.peace || 0,     getRelease: (d: EmotionData) => d.releasePeace || 0 },
      { label: '想被认同', color: '#dbeafe', borderColor: '#1e40af', getRecord: (d: EmotionData) => d.wantApproval || 0, getRelease: (d: EmotionData) => d.releaseWantApproval || 0 },
      { label: '想要控制', color: '#d1fae5', borderColor: '#065f46', getRecord: (d: EmotionData) => d.wantControl || 0,  getRelease: (d: EmotionData) => d.releaseWantControl || 0 },
      { label: '想要安全', color: '#fef3c7', borderColor: '#92400e', getRecord: (d: EmotionData) => d.wantSecurity || 0, getRelease: (d: EmotionData) => d.releaseWantSecurity || 0 },
    ];

    const pieData = allItems
      .map(item => ({
        ...item,
        recordValue: monthData.reduce((s, d) => s + item.getRecord(d), 0),
        releaseValue: monthData.reduce((s, d) => s + item.getRelease(d), 0),
        value: 0
      }))
      .map(item => ({ ...item, value: item.recordValue + item.releaseValue }))
      .filter(item => item.value > 0);

    const title = `${year}年${month + 1}月情绪/想要统计`;
    
    return {
      title,
      data: {
        labels: pieData.map(item => item.label),
        datasets: [{
          data: pieData.map(item => item.value),
          backgroundColor: pieData.map(item => item.color),
          borderColor: pieData.map(item => item.borderColor),
          borderWidth: pieData.map(item =>
            ['想被认同', '想要控制', '想要安全'].includes(item.label) ? 1 : 0
          )
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const item = pieData[ctx.dataIndex];
                return [
                  `觉察次数: ${item.recordValue}`,
                  `释放次数: ${item.releaseValue}`
                ];
              }
            }
          },
          datalabels: {
            color: '#333',
            font: { weight: 'bold' as const, size: 11 },
            formatter: function(value: any, context: any) {
              return `${pieData[context.dataIndex].label}\n${value}`;
            }
          }
        }
      }
    };
  };

  // 生成当日饼状图数据（根据日历选择变化）
  const generateDayPieData = (dayData: NonNullable<typeof selectedDayData>) => {
    const allItems = [
      { label: '万念俱灰', color: '#94a3b8', borderColor: '#334155', record: dayData.moods.despair || 0,    release: dayData.releaseCounts.despair || 0 },
      { label: '悲苦',     color: '#fda4af', borderColor: '#dc2626', record: dayData.moods.sorrow || 0,     release: dayData.releaseCounts.sorrow || 0 },
      { label: '恐惧',     color: '#93c5fd', borderColor: '#1d4ed8', record: dayData.moods.fear || 0,       release: dayData.releaseCounts.fear || 0 },
      { label: '贪求',     color: '#fcd34d', borderColor: '#d97706', record: dayData.moods.greed || 0,      release: dayData.releaseCounts.greed || 0 },
      { label: '愤怒',     color: '#f87171', borderColor: '#b91c1c', record: dayData.moods.anger || 0,      release: dayData.releaseCounts.anger || 0 },
      { label: '自尊自傲', color: '#c4b5fd', borderColor: '#7e22ce', record: dayData.moods.pride || 0,      release: dayData.releaseCounts.pride || 0 },
      { label: '无畏',     color: '#6ee7b7', borderColor: '#059669', record: dayData.moods.fearless || 0,   release: dayData.releaseCounts.fearless || 0 },
      { label: '接纳',     color: '#a78bfa', borderColor: '#6d28d9', record: dayData.moods.acceptance || 0, release: dayData.releaseCounts.acceptance || 0 },
      { label: '平静',     color: '#d6d3d1', borderColor: '#334155', record: dayData.moods.peace || 0,      release: dayData.releaseCounts.peace || 0 },
      { label: '想被认同', color: '#dbeafe', borderColor: '#1e40af', record: dayData.desires.wantApproval || 0,  release: dayData.releaseCounts.wantApproval || 0 },
      { label: '想要控制', color: '#d1fae5', borderColor: '#065f46', record: dayData.desires.wantControl || 0,   release: dayData.releaseCounts.wantControl || 0 },
      { label: '想要安全', color: '#fef3c7', borderColor: '#92400e', record: dayData.desires.wantSecurity || 0,  release: dayData.releaseCounts.wantSecurity || 0 },
    ];

    const pieItems = allItems
      .map(item => ({ ...item, value: item.record + item.release }))
      .filter(item => item.value > 0);

    const title = `${dayData.date.replace(/-/g, '.')} 情绪/想要统计`;

    return {
      title,
      data: {
        labels: pieItems.map(item => item.label),
        datasets: [{
          data: pieItems.map(item => item.value),
          backgroundColor: pieItems.map(item => item.color),
          borderColor: pieItems.map(item => item.borderColor),
          borderWidth: pieItems.map(item =>
            ['想被认同', '想要控制', '想要安全'].includes(item.label) ? 1 : 0
          )
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const item = pieItems[ctx.dataIndex];
                return [
                  `觉察次数: ${item.record}`,
                  `释放次数: ${item.release}`
                ];
              }
            }
          },
          datalabels: {
            color: '#333',
            font: { weight: 'bold' as const, size: 11 },
            formatter: (_value: any, context: any) => {
              const item = pieItems[context.dataIndex];
              return `${item.label}\n${item.value}`;
            }
          }
        }
      }
    };
  };

  // 导出数据
  const exportData = () => {
    const dataStr = JSON.stringify(emotionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emotion-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 清空数据
  const handleClearData = async () => {
    const db = await initDB();
    const transaction = db.transaction('emotions', 'readwrite');
    const store = transaction.objectStore('emotions');
    store.clear();
    transaction.oncomplete = () => {
      localStorage.removeItem('hasSeenFirstTimeHint');
      setEmotionData([]);
      setShowFirstTimeHint(true);
      setActiveTab('home');
    };
  };

  // 导入数据
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (!Array.isArray(jsonData)) {
          alert('导入数据格式错误，请确保选择的是正确的导出文件');
          return;
        }
        
        // 清空现有数据并导入新数据
        const db = await initDB();
        const transaction = db.transaction('emotions', 'readwrite');
        const store = transaction.objectStore('emotions');
        
        // 清空现有数据
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
          // 导入新数据
          jsonData.forEach((item: EmotionData) => {
            store.put(item);
          });
          
          transaction.oncomplete = () => {
            alert('数据导入成功');
            loadData();
          };
        };
        
        transaction.onerror = () => {
          alert('数据导入失败');
        };
      } catch (error) {
        alert('导入数据失败，请确保选择的是正确的JSON文件');
        console.error('导入数据错误:', error);
      }
    };
    reader.readAsText(file);
  };
  
  // 复制到剪贴板的传统方法，支持移动设备
  const copyToClipboard = (text: string, element?: EventTarget) => {
    // 创建一个临时的textarea元素
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 设置样式，使其不可见
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // 聚焦并选择文本
    textArea.focus();
    textArea.select();
    
    try {
      // 执行复制命令
      const successful = document.execCommand('copy');
      if (successful && element instanceof HTMLButtonElement) {
        // 显示对号
        const originalText = element.textContent;
        element.textContent = '✓';
        // 0.5秒后恢复
        setTimeout(() => {
          element.textContent = originalText;
        }, 500);
      }
    } catch (err) {
      console.error('复制错误:', err);
    } finally {
      // 清理临时元素
      document.body.removeChild(textArea);
    }
  };

  const calendarDays = generateCalendar();
  const barChartData = generateBarChartData();
  const moodPieData = generateMoodPieData();

  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [dayCardCopyDone, setDayCardCopyDone] = useState(false);
  const cardTapRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastCardTapTimeRef = useRef(0);
  // iOS PWA: pre-focus a hidden input within the user gesture to unlock keyboard
  const iosKbRef = useRef<HTMLInputElement>(null);

  const dayPieData = selectedDayData ? generateDayPieData(selectedDayData) : null;

  const modalStepInfo = useMemo(() => {
    const finalStep = homeReleaseSteps.length + 1;
    const isCompleted = longPressModal.step >= finalStep;
    const data = isCompleted
      ? FIXED_HOME_FINAL
      : (homeReleaseSteps[longPressModal.step - 1] || FIXED_HOME_FINAL);
    return { isCompleted, data };
  }, [homeReleaseSteps, longPressModal.step]);


  // 检查是否首次使用
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenFirstTimeHint');
    if (!hasSeenHint) {
      setShowFirstTimeHint(true);
    }
  }, []);

  // 处理不再提示
  const handleDontShowAgain = () => {
    localStorage.setItem('hasSeenFirstTimeHint', 'true');
    setShowFirstTimeHint(false);
  };

  // 关闭编辑页面
  const closeEditPage = () => {
    setShowEditPage(false);
  };

  const handleCardTouchStart = (e: React.TouchEvent) => {
    cardTapRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };
  const handleCardTouchMove = (e: React.TouchEvent) => {
    if (!cardTapRef.current) return;
    const dy = Math.abs(e.touches[0].clientY - cardTapRef.current.y);
    if (dy > 8) cardTapRef.current = null;
  };
  const handleCardTouchEnd = (e: React.TouchEvent) => {
    if (!cardTapRef.current) return;
    const dx = Math.abs(e.changedTouches[0].clientX - cardTapRef.current.x);
    const dy = Math.abs(e.changedTouches[0].clientY - cardTapRef.current.y);
    const dt = Date.now() - cardTapRef.current.t;
    cardTapRef.current = null;
    if (dx < 8 && dy < 8 && dt < 500) {
      lastCardTapTimeRef.current = Date.now();
      iosKbRef.current?.focus();
      setShowEditPage(true);
    }
  };
  const handleCardClick = () => {
    if (Date.now() - lastCardTapTimeRef.current < 600) return;
    iosKbRef.current?.focus();
    setShowEditPage(true);
  };

  // 保存编辑内容
  const handleSaveEdit = (updatedThoughts: string) => {
    setThoughts(updatedThoughts);
  };

  // 控制首页滚动锁：只加/删 class，避免直接改写 body/html 内联样式
  useEffect(() => {
    const shouldLock = activeTab === 'home' && !showEditPage;

    if (activeTab === 'home' && !showEditPage) {
      document.body.classList.add('home-scroll-lock');
      document.documentElement.classList.add('home-scroll-lock');
    } else {
      document.body.classList.remove('home-scroll-lock');
      document.documentElement.classList.remove('home-scroll-lock');
    }

    return () => {
      if (!shouldLock) return;
      document.body.classList.remove('home-scroll-lock');
      document.documentElement.classList.remove('home-scroll-lock');
    };
  }, [activeTab, showEditPage]);

  return (
    <div>
      {/* <header className="banner">
        <h1 className="banner-title">情绪释放</h1>
      </header> */}

      <div className="app">
        {/* iOS PWA 键盘解锁隐藏输入框 */}
        <input
          ref={iosKbRef}
          aria-hidden="true"
          style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
        />
        {/* 首次使用提示 */}
        {showFirstTimeHint && (
          <div className="first-time-hint-overlay">
            <div className="first-time-hint-content">
              <div className="first-time-hint-icon">
                <img src="./icon-192x192.png" alt="logo" className="first-time-hint-logo" />
              </div>
              <div className="first-time-hint-title">欢迎使用</div>
              <div className="first-time-hint-text">
                <p>首次打开网站，需要点击浏览器选项<strong>共享</strong> → <strong>添加到主屏幕</strong>，苹果手机建议使用<strong>Safari浏览器</strong>，安卓手机浏览器选项"安装应用"或直接有安装提示。此后就可以在桌面打开应用离线使用，不必再打开浏览器。更多使用帮助请点击<strong>帮助</strong>面板查看</p>
              </div>
              <button
                className="first-time-hint-button"
                onTouchEnd={(e) => { e.preventDefault(); handleDontShowAgain(); }}
                onClick={handleDontShowAgain}
              >
                不再提示
              </button>
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="record-section">
          <div className="section">
            <div className="buttons-container">
              <button 
                className="emotion-button despair"
                onClick={() => handleMoodClick('despair')}
                {...createLongPressHandler('mood', 'despair', '万念俱灰')}
              >
                <div className="release-count">{releaseCounts.despair}</div>
                <div className="emotion-label">万念俱灰</div>
                <div className="emotion-count">{moods.despair}</div>
              </button>
              <button 
                className="emotion-button sorrow"
                onClick={() => handleMoodClick('sorrow')}
                {...createLongPressHandler('mood', 'sorrow', '悲苦')}
              >
                <div className="release-count">{releaseCounts.sorrow}</div>
                <div className="emotion-label">悲苦</div>
                <div className="emotion-count">{moods.sorrow}</div>
              </button>
              <button 
                className="emotion-button fear"
                onClick={() => handleMoodClick('fear')}
                {...createLongPressHandler('mood', 'fear', '恐惧')}
              >
                <div className="release-count">{releaseCounts.fear}</div>
                <div className="emotion-label">恐惧</div>
                <div className="emotion-count">{moods.fear}</div>
              </button>
              <button 
                className="emotion-button greed"
                onClick={() => handleMoodClick('greed')}
                {...createLongPressHandler('mood', 'greed', '贪求')}
              >
                <div className="release-count">{releaseCounts.greed}</div>
                <div className="emotion-label">贪求</div>
                <div className="emotion-count">{moods.greed}</div>
              </button>
              <button 
                className="emotion-button anger"
                onClick={() => handleMoodClick('anger')}
                {...createLongPressHandler('mood', 'anger', '愤怒')}
              >
                <div className="release-count">{releaseCounts.anger}</div>
                <div className="emotion-label">愤怒</div>
                <div className="emotion-count">{moods.anger}</div>
              </button>
              <button 
                className="emotion-button pride"
                onClick={() => handleMoodClick('pride')}
                {...createLongPressHandler('mood', 'pride', '自尊自傲')}
              >
                <div className="release-count">{releaseCounts.pride}</div>
                <div className="emotion-label">自尊自傲</div>
                <div className="emotion-count">{moods.pride}</div>
              </button>
              <button 
                className="emotion-button fearless"
                onClick={() => handleMoodClick('fearless')}
                {...createLongPressHandler('mood', 'fearless', '无畏')}
              >
                <div className="release-count">{releaseCounts.fearless}</div>
                <div className="emotion-label">无畏</div>
                <div className="emotion-count">{moods.fearless}</div>
              </button>
              <button 
                className="emotion-button acceptance"
                onClick={() => handleMoodClick('acceptance')}
                {...createLongPressHandler('mood', 'acceptance', '接纳')}
              >
                <div className="release-count">{releaseCounts.acceptance}</div>
                <div className="emotion-label">接纳</div>
                <div className="emotion-count">{moods.acceptance}</div>
              </button>
              <button 
                className="emotion-button peace"
                onClick={() => handleMoodClick('peace')}
                {...createLongPressHandler('mood', 'peace', '平静')}
              >
                <div className="release-count">{releaseCounts.peace}</div>
                <div className="emotion-label">平静</div>
                <div className="emotion-count">{moods.peace}</div>
              </button>
            </div>
          </div>
          
          {/* <hr className="divider" /> */}
          
          <div className="section desires-section">
            <div className="buttons-container">
              <button 
                className="emotion-button want-approval"
                onClick={() => handleDesireClick('wantApproval')}
                {...createLongPressHandler('desire', 'wantApproval', '想被认同')}
              >
                <div className="release-count">{releaseCounts.wantApproval}</div>
                <div className="emotion-label">想被认同</div>
                <div className="emotion-count">{desires.wantApproval}</div>
              </button>
              <button 
                className="emotion-button want-control"
                onClick={() => handleDesireClick('wantControl')}
                {...createLongPressHandler('desire', 'wantControl', '想要控制')}
              >
                <div className="release-count">{releaseCounts.wantControl}</div>
                <div className="emotion-label">想要控制</div>
                <div className="emotion-count">{desires.wantControl}</div>
              </button>
              <button 
                className="emotion-button want-security"
                onClick={() => handleDesireClick('wantSecurity')}
                {...createLongPressHandler('desire', 'wantSecurity', '想要安全')}
              >
                <div className="release-count">{releaseCounts.wantSecurity}</div>
                <div className="emotion-label">想要安全</div>
                <div className="emotion-count">{desires.wantSecurity}</div>
              </button>
            </div>
          </div>
          
          {/* 感想卡片 */}
          <div
            className="card thoughts-card"
            onTouchStart={handleCardTouchStart}
            onTouchMove={handleCardTouchMove}
            onTouchEnd={handleCardTouchEnd}
            onClick={handleCardClick}
          >
            <div className="thoughts-card-header">
              <span className="thoughts-card-title">今日感想</span>
              {thoughts ? (
                <button
                  className={`thoughts-action-btn${copyDone ? ' copy-done' : ''}`}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    const doCopy = () => {
                      setCopyDone(true);
                      setTimeout(() => setCopyDone(false), 1500);
                    };
                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(thoughts).then(doCopy).catch(() => { copyToClipboard(thoughts); doCopy(); });
                    } else {
                      copyToClipboard(thoughts);
                      doCopy();
                    }
                  }}
                >
                  {copyDone ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </button>
              ) : null}
            </div>
            <div className="thoughts-content">
              {thoughts
                ? thoughts
                : <span className="thoughts-placeholder">轻触，记录今日感想…</span>
              }
            </div>
          </div>
          
        </div>
      )}

      {activeTab === 'stats' && (
        <>
          <div className="charts-section">
            <div className="bar-chart-container">
              <h3 className="bar-chart-title">{barChartData.title}</h3>
              <Bar data={barChartData.data} options={barChartData.options} />
            </div>
            <div className="pie-charts-container">
              <div className="pie-chart-item">
                <h3>{moodPieData.title}</h3>
                <Pie data={moodPieData.data} options={moodPieData.options} />
              </div>
            </div>
          </div>
          
          <div className="day-details">
            <div className="calendar-container">
              <div className="calendar-nav">
                <button 
                  className="nav-button"
                  onClick={() => setCurrentDate(prev => {
                    const newDate = new Date(prev);
                    newDate.setMonth(prev.getMonth() - 1);
                    return newDate;
                  })}
                >
                  上一月
                </button>
                <div className="current-month">
                  {selectedDayData ? selectedDayData.date.replace(/-/g, '.') : `${currentDate.getFullYear()}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${String(currentDate.getDate()).padStart(2, '0')}`}
                </div>
                <button 
                  className="nav-button"
                  onClick={() => setCurrentDate(prev => {
                    const newDate = new Date(prev);
                    newDate.setMonth(prev.getMonth() + 1);
                    return newDate;
                  })}
                >
                  下一月
                </button>
              </div>
              <div className="calendar-header">
                <div className="calendar-header-day">一</div>
                <div className="calendar-header-day">二</div>
                <div className="calendar-header-day">三</div>
                <div className="calendar-header-day">四</div>
                <div className="calendar-header-day">五</div>
                <div className="calendar-header-day">六</div>
                <div className="calendar-header-day">日</div>
              </div>
              <div className="calendar-grid">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} className="calendar-day empty"></div>;
                }
                
                const isToday = new Date().toDateString() === day.toDateString();
                const activityColor = getActivityColor(day);
                return (
                  <div 
                    key={index} 
                    className={`calendar-day ${isToday ? 'today' : ''} ${activityColor}`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
            </div>
            
            {selectedDayData && (
              <>
                {/* 当日统计饼图 */}
                {dayPieData && (dayPieData.data.labels?.length ?? 0) > 0 && (
                  <div className="pie-charts-container" style={{ marginTop: '1rem' }}>
                    <div className="pie-chart-item">
                      <h3>{dayPieData.title}</h3>
                      <Pie data={dayPieData.data} options={dayPieData.options} />
                    </div>
                  </div>
                )}
                {/* 当日感想卡片 */}
                {selectedDayData.thoughts && (
                  <div className="card thoughts-card" style={{ marginTop: '1rem' }}>
                    <div className="thoughts-card-header">
                      <span className="thoughts-card-title">{selectedDayData.date.replace(/-/g, '.')} 感想</span>
                      <button
                        className={`thoughts-action-btn${dayCardCopyDone ? ' copy-done' : ''}`}
                        onClick={() => {
                          const doCopy = () => {
                            setDayCardCopyDone(true);
                            setTimeout(() => setDayCardCopyDone(false), 1500);
                          };
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(selectedDayData.thoughts).then(doCopy).catch(() => { copyToClipboard(selectedDayData.thoughts); doCopy(); });
                          } else {
                            copyToClipboard(selectedDayData.thoughts);
                            doCopy();
                          }
                        }}
                      >
                        {dayCardCopyDone ? (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="thoughts-content">
                      <p>{selectedDayData.thoughts}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="export-section">
            <button className="export-button" onClick={exportData}>
              导出数据
            </button>
            <button className="export-button" onClick={() => document.getElementById('import-input')?.click()}>
              导入数据
            </button>
            <input 
              type="file" 
              id="import-input" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleImportData}
            />
          </div>
        </>
      )}

      {activeTab === 'release' && (
        <ReleasePage />
      )}

      {activeTab === 'help' && (
        <HelpPage
          onExport={exportData}
          onImportFile={handleImportData}
          onClearData={handleClearData}
          themeMode={themeMode}
          onThemeChange={setThemeMode}
        />
      )}

        <div className="tab-bar">
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            统计
          </button>
          <button 
            className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            记录
          </button>
          <button 
            className={`tab-btn ${activeTab === 'release' ? 'active' : ''}`}
            onClick={() => setActiveTab('release')}
            title="立即释放"
          >
            ⚡
          </button>
          <button 
            className={`tab-btn ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            帮助
          </button>
        </div>

        {/* 长按模态框 */}
        {longPressModal.visible && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <button 
                  className={`emotion-button ${longPressModal.key.startsWith('want') ? `want-${longPressModal.key.replace('want', '').toLowerCase()}` : longPressModal.key}`}
                  style={{ margin: '0 auto' }}
                >
                  <div className="emotion-label">{longPressModal.label}</div>
                </button>
              </div>
              <div className="modal-body">
                {/* white-space:pre-wrap 让引导语中的换行符正确显示为换行 */}
                <p className="modal-text" style={{ whiteSpace: 'pre-wrap' }}>
                  {modalStepInfo.data.guide}
                </p>
                {modalStepInfo.isCompleted && (
                  <div className="fireworks-container">
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    {/* <div className="firework"></div> */}
                    {/* <div className="firework"></div> */}
                    {/* <div className="firework"></div> */}
                    {/* <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div>
                    <div className="firework"></div> */}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  className="modal-button no-button"
                  onClick={() => handleModalButtonClick('no')}
                >
                  {modalStepInfo.data.noBtn}
                </button>
                <button 
                  className="modal-button yes-button"
                  onClick={() => handleModalButtonClick('yes')}
                >
                  {modalStepInfo.data.yesBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑页面 */}
        {showEditPage && (
          <NoteEditor 
            onFinish={closeEditPage} 
            thoughts={thoughts}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </div>
  );
};

export default App;
