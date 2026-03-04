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
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'emotions' | 'record' | 'stats'>('emotions');
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
  const [thoughts, setThoughts] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [selectedDayData, setSelectedDayData] = useState<{
    date: string;
    moods: Record<string, number>;
    desires: Record<string, number>;
    thoughts: string;
  } | null>(null);

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
    try {
      const db = await initDB();
      const transaction = db.transaction('emotions', 'readwrite');
      const store = transaction.objectStore('emotions');
      
      // 直接保存或更新数据
      store.put(data);
      
      transaction.oncomplete = () => {
        setSaveStatus('保存成功');
        setTimeout(() => setSaveStatus(''), 2000);
        loadData();
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
    setDesires(prev => ({
      ...prev,
      [desire]: prev[desire] + 1
    }));
  };

  // 处理情绪按钮点击
  const handleMoodClick = (mood: keyof typeof moods) => {
    setMoods(prev => ({
      ...prev,
      [mood]: prev[mood] + 1
    }));
  };

  // 自动保存
  useEffect(() => {
    if (desires.wantApproval > 0 || desires.wantControl > 0 || desires.wantSecurity > 0 || Object.values(moods).some(count => count > 0)) {
      // 使用本地时间获取日期字符串，避免时区问题
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
          thoughts
        });
      }, 2000);

      return () => clearTimeout(saveTimer);
    }
  }, [desires, moods, thoughts, saveData]);

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
        setThoughts('');
      }
    }
  }, [emotionData, activeTab]);

  // 生成月历数据
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
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
        thoughts: dayData.thoughts || ''
      });
    } else {
      setSelectedDayData({
        date: dateStr,
        moods: {},
        desires: {},
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
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
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
    
    return {
      data: {
        labels: ['万念俱灰', '悲苦', '恐惧', '贪求', '愤怒', '自尊自傲', '无畏', '接纳', '平静'],
        datasets: [{
          data: [despair, sorrow, fear, greed, anger, pride, fearless, acceptance, peace],
          backgroundColor: [
            '#94a3b8',
            '#fda4af',
            '#93c5fd',
            '#fcd34d',
            '#f87171',
            '#c4b5fd',
            '#6ee7b7',
            '#a78bfa',
            '#94a3b8'
          ],
          borderColor: [
            '#334155',
            '#dc2626',
            '#1d4ed8',
            '#d97706',
            '#b91c1c',
            '#7e22ce',
            '#059669',
            '#6d28d9',
            '#334155'
          ],
          borderWidth: 1
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
              const labels = ['万念俱灰', '悲苦', '恐惧', '贪求', '愤怒', '自尊自傲', '无畏', '接纳', '平静'];
              return `${labels[context.dataIndex]}\n${value}`;
            }
          }
        }
      }
    };
  };

  // 生成想要饼状图数据
  const generateDesirePieData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
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
    
    return {
      data: {
        labels: ['想被认同', '想要控制', '想要安全'],
        datasets: [{
          data: [wantApproval, wantControl, wantSecurity],
          backgroundColor: [
            '#dbeafe',
            '#d1fae5',
            '#fef3c7'
          ],
          borderColor: [
            '#1e40af',
            '#065f46',
            '#92400e'
          ],
          borderWidth: 1
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
              const labels = ['想被认同', '想要控制', '想要安全'];
              return `${labels[context.dataIndex]}\n${value}`;
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

  const calendarDays = generateCalendar();
  const moodPieData = generateMoodPieData();
  const desirePieData = generateDesirePieData();

  return (
    <div className="app">
      <h1 className="h1">心情记录</h1>

      {activeTab === 'emotions' && (
        <div className="record-section">
          <div className="buttons-container">
            <button 
              className="emotion-button despair"
              onClick={() => handleMoodClick('despair')}
            >
              <div className="emotion-count">{moods.despair}</div>
              <div className="emotion-label">万念俱灰</div>
            </button>
            <button 
              className="emotion-button sorrow"
              onClick={() => handleMoodClick('sorrow')}
            >
              <div className="emotion-count">{moods.sorrow}</div>
              <div className="emotion-label">悲苦</div>
            </button>
            <button 
              className="emotion-button fear"
              onClick={() => handleMoodClick('fear')}
            >
              <div className="emotion-count">{moods.fear}</div>
              <div className="emotion-label">恐惧</div>
            </button>
            <button 
              className="emotion-button greed"
              onClick={() => handleMoodClick('greed')}
            >
              <div className="emotion-count">{moods.greed}</div>
              <div className="emotion-label">贪求</div>
            </button>
            <button 
              className="emotion-button anger"
              onClick={() => handleMoodClick('anger')}
            >
              <div className="emotion-count">{moods.anger}</div>
              <div className="emotion-label">愤怒</div>
            </button>
            <button 
              className="emotion-button pride"
              onClick={() => handleMoodClick('pride')}
            >
              <div className="emotion-count">{moods.pride}</div>
              <div className="emotion-label">自尊自傲</div>
            </button>
            <button 
              className="emotion-button fearless"
              onClick={() => handleMoodClick('fearless')}
            >
              <div className="emotion-count">{moods.fearless}</div>
              <div className="emotion-label">无畏</div>
            </button>
            <button 
              className="emotion-button acceptance"
              onClick={() => handleMoodClick('acceptance')}
            >
              <div className="emotion-count">{moods.acceptance}</div>
              <div className="emotion-label">接纳</div>
            </button>
            <button 
              className="emotion-button peace"
              onClick={() => handleMoodClick('peace')}
            >
              <div className="emotion-count">{moods.peace}</div>
              <div className="emotion-label">平静</div>
            </button>
          </div>
          
          <div className="thoughts-section">
            <h3>今日感想</h3>
            <textarea
              className="thoughts-textarea"
              placeholder="记录你的感想..."
              value={thoughts}
              onChange={(e) => {
                setThoughts(e.target.value);
              }}
            />
            {saveStatus && <div className="save-status">{saveStatus}</div>}
          </div>
        </div>
      )}

      {activeTab === 'record' && (
        <div className="record-section">
          <div className="buttons-container">
            <button 
              className="emotion-button want-approval"
              onClick={() => handleDesireClick('wantApproval')}
            >
              <div className="emotion-count">{desires.wantApproval}</div>
              <div className="emotion-label">想被认同</div>
            </button>
            <button 
              className="emotion-button want-control"
              onClick={() => handleDesireClick('wantControl')}
            >
              <div className="emotion-count">{desires.wantControl}</div>
              <div className="emotion-label">想要控制</div>
            </button>
            <button 
              className="emotion-button want-security"
              onClick={() => handleDesireClick('wantSecurity')}
            >
              <div className="emotion-count">{desires.wantSecurity}</div>
              <div className="emotion-label">想要安全</div>
            </button>
          </div>
          
          <div className="thoughts-section">
            <h3>今日感想</h3>
            <textarea
              className="thoughts-textarea"
              placeholder="记录你的感想..."
              value={thoughts}
              onChange={(e) => {
                setThoughts(e.target.value);
              }}
            />
            {saveStatus && <div className="save-status">{saveStatus}</div>}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="charts-section">
          <div className="pie-charts-container">
            <div className="pie-chart-item">
              <h3>本月情绪统计</h3>
              <Pie data={moodPieData.data} options={moodPieData.options} />
            </div>
            <div className="pie-chart-item">
              <h3>本月想要统计</h3>
              <Pie data={desirePieData.data} options={desirePieData.options} />
            </div>
          </div>
          
          <div className="stats-content">
            <div className="calendar-container">
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
              <div className="day-details">
                <h3>{selectedDayData.date}</h3>
                <div className="day-buttons">
                  {Object.entries(selectedDayData.moods).map(([key, value]) => {
                    if (value > 0) {
                      return (
                        <button key={key} className={`emotion-button ${key}`}>
                          <div className="emotion-count">{value}</div>
                          <div className="emotion-label">{getMoodLabel(key)}</div>
                        </button>
                      );
                    }
                    return null;
                  })}
                  {Object.entries(selectedDayData.desires).map(([key, value]) => {
                    if (value > 0) {
                      return (
                        <button key={key} className={`emotion-button want-${key.replace('want', '').toLowerCase()}`}>
                          <div className="emotion-count">{value}</div>
                          <div className="emotion-label">{getDesireLabel(key)}</div>
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
                {selectedDayData.thoughts && (
                  <div className="thoughts-card">
                    <h4>当日感想</h4>
                    <p>{selectedDayData.thoughts}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="export-section">
            <button className="export-button" onClick={exportData}>
              导出数据
            </button>
          </div>
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'emotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('emotions')}
        >
          今日情绪
        </button>
        <button 
          className={`tab ${activeTab === 'record' ? 'active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          今日想要
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          统计分析
        </button>
      </div>
    </div>
  );
};

export default App;