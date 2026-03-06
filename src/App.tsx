import React, { useState, useEffect, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

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
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'help'>('home');
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
  const [saveStatus, setSaveStatus] = useState('');
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [selectedDayData, setSelectedDayData] = useState<{
    date: string;
    moods: Record<string, number>;
    desires: Record<string, number>;
    releaseCounts: Record<string, number>;
    thoughts: string;
  } | null>(null);
  
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
  const saveData = useCallback(async (data: EmotionData) => {
    console.log('开始保存数据:', data);
    try {
      const db = await initDB();
      console.log('数据库初始化成功:', db);
      const transaction = db.transaction('emotions', 'readwrite');
      console.log('事务创建成功:', transaction);
      const store = transaction.objectStore('emotions');
      console.log('对象存储创建成功:', store);
      
      // 直接保存或更新数据
      const request = store.put(data);
      console.log('保存请求发送:', request);
      
      request.onsuccess = () => {
        console.log('保存成功');
      };
      
      request.onerror = (event) => {
        console.error('保存请求失败:', event);
      };
      
      transaction.oncomplete = () => {
        console.log('事务完成');
        setSaveStatus('保存成功');
        setTimeout(() => setSaveStatus(''), 2000);
        loadData();
      };
      
      transaction.onerror = (event) => {
        console.error('事务失败:', event);
      };
    } catch (error) {
      console.error('保存数据失败:', error);
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
      });
      
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
      });
      
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
  const handleModalButtonClick = (response: 'yes' | 'no') => {
    setLongPressModal(prev => {
      if (prev.step === 1) {
        // 第一步点击后进入第二步
        return {
          ...prev,
          step: 2
        };
      } else if (prev.step === 2) {
        // 第二步点击后进入第三步
        return {
          ...prev,
          step: 3
        };
      } else if (prev.step === 3) {
        // 第三步点击后进入第四步
        return {
          ...prev,
          step: 4
        };
      } else if (prev.step === 4) {
        // 第四步点击后进入第五步
        // 更新释放次数
        setReleaseCounts(prevCounts => ({
          ...prevCounts,
          [prev.key]: prevCounts[prev.key as keyof typeof prevCounts] + 1
        }));
        return {
          ...prev,
          step: 5
        };
      } else if (prev.step === 5) {
        if (response === 'yes') {
          // 点击"继续释放"，回到第一步
          return {
            ...prev,
            step: 1
          };
        } else {
          // 点击"结束"，关闭模态框
          return {
            ...prev,
            visible: false
          };
        }
      } else {
        // 其他情况关闭模态框
        return {
          ...prev,
          visible: false
        };
      }
    });
  };

  // 创建长按处理函数
  const createLongPressHandler = (type: 'mood' | 'desire', key: string, label: string) => {
    let timer: NodeJS.Timeout | null = null;
    let touchStartX = 0;
    let touchStartY = 0;
    const threshold = 10; // 滑动阈值

    return {
      onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
        timer = setTimeout(() => {
          handleLongPress(type, key, label);
        }, 500);
        e.currentTarget.addEventListener('mouseup', () => {
          if (timer) clearTimeout(timer);
        });
        e.currentTarget.addEventListener('mouseleave', () => {
          if (timer) clearTimeout(timer);
        });
      },
      onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        timer = setTimeout(() => {
          handleLongPress(type, key, label);
        }, 500);
        e.currentTarget.addEventListener('touchend', () => {
          if (timer) clearTimeout(timer);
        });
        e.currentTarget.addEventListener('touchmove', (touchEvent) => {
          if (!timer) return;
          const touchX = touchEvent.touches[0].clientX;
          const touchY = touchEvent.touches[0].clientY;
          const diffX = Math.abs(touchX - touchStartX);
          const diffY = Math.abs(touchY - touchStartY);
          if (diffX > threshold || diffY > threshold) {
            clearTimeout(timer);
            timer = null;
          }
        });
      }
    };
  };

  // 自动保存
  useEffect(() => {
    console.log('自动保存useEffect被触发');
    console.log('desires:', desires);
    console.log('moods:', moods);
    console.log('thoughts:', thoughts);
    console.log('releaseCounts:', releaseCounts);
    // 使用本地时间获取日期字符串，避免时区问题
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${date}`;
    
    const saveTimer = setTimeout(() => {
      console.log('触发保存数据');
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
      });
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [desires, moods, thoughts, releaseCounts, saveData]);

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

  // 获取情绪标签
  const getMoodLabel = (key: string) => {
    const labels: Record<string, string> = {
      despair: '万念俱灰',
      sorrow: '悲苦',
      fear: '恐惧',
      greed: '贪求',
      anger: '愤怒',
      pride: '自尊自傲',
      fearless: '无畏',
      acceptance: '接纳',
      peace: '平静'
    };
    return labels[key] || key;
  };

  // 获取想要标签
  const getDesireLabel = (key: string) => {
    const labels: Record<string, string> = {
      wantApproval: '想被认同',
      wantControl: '想要控制',
      wantSecurity: '想要安全'
    };
    return labels[key] || key;
  };



  // 生成情绪饼状图数据
  const generateMoodPieData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthData = emotionData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    });
    
    let despair = 0;
    let sorrow = 0;
    let fear = 0;
    let greed = 0;
    let anger = 0;
    let pride = 0;
    let fearless = 0;
    let acceptance = 0;
    let peace = 0;
    
    monthData.forEach(item => {
      despair += item.despair || 0;
      sorrow += item.sorrow || 0;
      fear += item.fear || 0;
      greed += item.greed || 0;
      anger += item.anger || 0;
      pride += item.pride || 0;
      fearless += item.fearless || 0;
      acceptance += item.acceptance || 0;
      peace += item.peace || 0;
    });
    
    // 过滤掉值为0的数据
    const moodData = [
      { label: '万念俱灰', value: despair, color: '#94a3b8', borderColor: '#334155' },
      { label: '悲苦', value: sorrow, color: '#fda4af', borderColor: '#dc2626' },
      { label: '恐惧', value: fear, color: '#93c5fd', borderColor: '#1d4ed8' },
      { label: '贪求', value: greed, color: '#fcd34d', borderColor: '#d97706' },
      { label: '愤怒', value: anger, color: '#f87171', borderColor: '#b91c1c' },
      { label: '自尊自傲', value: pride, color: '#c4b5fd', borderColor: '#7e22ce' },
      { label: '无畏', value: fearless, color: '#6ee7b7', borderColor: '#059669' },
      { label: '接纳', value: acceptance, color: '#a78bfa', borderColor: '#6d28d9' },
      { label: '平静', value: peace, color: '#94a3b8', borderColor: '#334155' }
    ].filter(item => item.value > 0);
    
    return {
      data: {
        labels: moodData.map(item => item.label),
        datasets: [{
          data: moodData.map(item => item.value),
          backgroundColor: moodData.map(item => item.color),
          borderColor: moodData.map(item => item.borderColor),
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold' as const
            },
            formatter: function(value: any, context: any) {
              return `${moodData[context.dataIndex].label}\n${value}`;
            }
          }
        }
      }
    };
  };

  // 生成想要饼状图数据
  const generateDesirePieData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthData = emotionData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    });
    
    let wantApproval = 0;
    let wantControl = 0;
    let wantSecurity = 0;
    
    monthData.forEach(item => {
      wantApproval += item.wantApproval;
      wantControl += item.wantControl;
      wantSecurity += item.wantSecurity || 0;
    });
    
    // 过滤掉值为0的数据
    const desireData = [
      { label: '想被认同', value: wantApproval, color: '#dbeafe', borderColor: '#1e40af' },
      { label: '想要控制', value: wantControl, color: '#d1fae5', borderColor: '#065f46' },
      { label: '想要安全', value: wantSecurity, color: '#fef3c7', borderColor: '#92400e' }
    ].filter(item => item.value > 0);
    
    return {
      data: {
        labels: desireData.map(item => item.label),
        datasets: [{
          data: desireData.map(item => item.value),
          backgroundColor: desireData.map(item => item.color),
          borderColor: desireData.map(item => item.borderColor),
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            color: '#333',
            font: {
              weight: 'bold' as const
            },
            formatter: function(value: any, context: any) {
              return `${desireData[context.dataIndex].label}
${value}`;
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

  const calendarDays = generateCalendar();
  const moodPieData = generateMoodPieData();
  const desirePieData = generateDesirePieData();

  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);

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

  // 控制页面滚动
  useEffect(() => {
    if (activeTab === 'home') {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    }
  }, [activeTab]);

  return (
    <>
      {/* <header className="banner">
        <h1 className="banner-title">释放法</h1>
      </header> */}

      <div className="app">
        {/* 首次使用提示 */}
        {showFirstTimeHint && (
          <div className="first-time-hint-overlay">
            <div className="first-time-hint-content">
              <div className="first-time-hint-text">
                <p>单击按钮记录，长按开启释放。</p>
                <p>下方数字表示记录次数，</p>
                <p>上方数字表示释放次数。</p>
              </div>
              <button 
                className="first-time-hint-button"
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
          
          <div className="card thoughts-card">
            <div className="thoughts-card-header">
              <h3>今日感想</h3>
              {saveStatus && <div className="save-status">{saveStatus}</div>}
            </div>
            <textarea
              className="thoughts-textarea"
              placeholder="记录你的感想..."
              value={thoughts}
              onChange={(e) => {
                setThoughts(e.target.value);
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <>
          <div className="charts-section">
            <div className="pie-charts-container">
              <div className="pie-chart-item">
                <h3>当月情绪统计</h3>
                <Pie data={moodPieData.data} options={moodPieData.options} />
              </div>
              <div className="pie-chart-item">
                <h3>当月想要统计</h3>
                <Pie data={desirePieData.data} options={desirePieData.options} />
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
                  {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
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
                return (
                  <div 
                    key={index} 
                    className={`calendar-day ${isToday ? 'today' : ''}`}
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
                <h3>{selectedDayData.date}</h3>
                <div className="day-buttons">
                  {Object.entries(selectedDayData.moods).map(([key, value]) => {
                    // 检查释放次数
                    const releaseCount = selectedDayData.releaseCounts?.[key] || 0;
                    if (value > 0 || releaseCount > 0) {
                      return (
                        <button key={key} className={`emotion-button ${key}`}>
                          <div className="release-count">{releaseCount}</div>
                          <div className="emotion-label">{getMoodLabel(key)}</div>
                          <div className="emotion-count">{value}</div>
                        </button>
                      );
                    }
                    return null;
                  })}
                  {Object.entries(selectedDayData.desires).map(([key, value]) => {
                    // 检查释放次数
                    const releaseCount = selectedDayData.releaseCounts?.[key] || 0;
                    if (value > 0 || releaseCount > 0) {
                      return (
                        <button key={key} className={`emotion-button want-${key.replace('want', '').toLowerCase()}`}>
                          <div className="release-count">{releaseCount}</div>
                          <div className="emotion-label">{getDesireLabel(key)}</div>
                          <div className="emotion-count">{value}</div>
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
                {selectedDayData.thoughts && (
                  <div className="card thoughts-card">
                    <div className="thoughts-card-header">
                      <h3>当日感想</h3>
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

      {activeTab === 'help' && (
        <div className="help-section">
          <div className="card">
            <h3>风的六步骤</h3>
            <hr className="step-divider" />
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <p>你必须想要自由超过想要世界。你必须想要自由超过想要被认同和想要控制。想要被认同和想要控制=世界</p>
                </div>
              </div>
              <hr className="step-divider" />
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <p>做出自由的决定。</p>
                </div>
              </div>
              <hr className="step-divider" />
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <p>所有感受都来自想要被认同和想要控制，它们都是生存程序。释放它们。</p>
                </div>
              </div>
              <hr className="step-divider" />
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <p>持续释放。</p>
                </div>
              </div>
              <hr className="step-divider" />
              <div className="step-item">
                <div className="step-number">5</div>
                <div className="step-content">
                  <p>当你卡住时，释放对卡住的感受的想要改变。</p>
                </div>
              </div>
              <hr className="step-divider" />
              <div className="step-item">
                <div className="step-number">6</div>
                <div className="step-content">
                  <p>每次你释放，你都更愉悦、轻松、脱离限制。随着释放，你会越来越愉悦、轻松、脱离限制。</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <h3>其他资料</h3>
            <hr className="step-divider" />
            <div className="steps-list">
              <div className="step-item">
                <div className="step-content">
                  <p>B站搜索 "92年原始释放法"</p>
                </div>
              </div>
              <hr className="step-divider" />
              <div className="step-item">
                <div className="step-content">
                  <p>B站&lt;哈师傅不是哈师父&gt;，分享释放法相关的视频和直播</p>
                </div>
              </div>
              <hr className="step-divider" />
              <div className="step-item">
                <div className="step-content">
                  <p>相关书籍《决定自由》《莱斯特自传》等</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <h3>关于此网站的使用</h3>
            <hr className="step-divider" />
            <div className="steps-list">
              <div className="step-item">
                <div className="step-content">
                  <p>首次打开此网站需"添加到主屏幕"，此后就可以离线使用了</p>
                </div>
              </div>
              <hr className="step-divider" />
              <div className="step-item">
                <div className="step-content">
                  <p>此网站所有数据都保存在本地浏览器中，清理缓存时须留意。&lt;导出数据&gt;按钮可以备份数据，更换手机时也可以重新导入</p>
                </div>
              </div>
              <hr className="step-divider" />
              <div className="step-item">
                <div className="step-content">
                  <p>苹果手机推荐一个非常好的应用&lt;释放法练习&gt;，就在APP store</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            释放
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
                <p className="modal-text">
                  {longPressModal.step === 1 ? '你能仅仅是允许自己感受它吗？' : 
                   longPressModal.step === 2 ? '你愿意释放它吗？' : 
                   longPressModal.step === 3 ? '什么时候释放？' : 
                   longPressModal.step === 4 ? '现在你有感觉好一点或轻松一点吗？' : '本次释放完成！'}
                </p>
                {longPressModal.step === 5 && (
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
                  {longPressModal.step === 1 ? '不能' : 
                   longPressModal.step === 2 ? '不愿意' : 
                   longPressModal.step === 3 ? '以后' : 
                   longPressModal.step === 4 ? '没有' : '结束'}
                </button>
                <button 
                  className="modal-button yes-button"
                  onClick={() => handleModalButtonClick('yes')}
                >
                  {longPressModal.step === 1 ? '能' : 
                   longPressModal.step === 2 ? '愿意' : 
                   longPressModal.step === 3 ? '现在' : 
                   longPressModal.step === 4 ? '有' : '继续'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default App;