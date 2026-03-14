import { useState, useEffect } from 'react';
import { Flame, Calendar, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Progress.css';

const DEFAULT_DATA = [
    { name: 'Min', depresi: 0, kecemasan: 0, stres: 0 },
    { name: 'Sen', depresi: 0, kecemasan: 0, stres: 0 },
    { name: 'Sel', depresi: 0, kecemasan: 0, stres: 0 },
    { name: 'Rab', depresi: 0, kecemasan: 0, stres: 0 },
    { name: 'Kam', depresi: 0, kecemasan: 0, stres: 0 },
    { name: 'Jum', depresi: 0, kecemasan: 0, stres: 0 },
    { name: 'Sab', depresi: 0, kecemasan: 0, stres: 0 }
];

const MOOD_DATA_MAP = {
    1: { text: "Sangat Sedih", emoji: "😭" },
    2: { text: "Sedih", emoji: "😔" },
    3: { text: "Biasa Saja", emoji: "😐" },
    4: { text: "Senang", emoji: "🙂" },
    5: { text: "Sangat Senang", emoji: "😄" }
};

const Progress = () => {
    const [hasData, setHasData] = useState(false);
    const [chartData, setChartData] = useState(DEFAULT_DATA);
    const [stats, setStats] = useState({
        streak: 0,
        sessions: 0,
        moodText: "Belum ada data",
        moodEmoji: "❓"
    });

    useEffect(() => {
        const username = localStorage.getItem('moodify_currentUser');
        if (!username) return;

        const userKey = `moodify_data_${username}`;
        try {
            const savedData = localStorage.getItem(userKey);
            if (savedData) {
                const userData = JSON.parse(savedData);
                
                // Initialize chart data with defaults
                let newChartData = [...DEFAULT_DATA];

                if (userData.hasCheckedIn || (userData.history && userData.history.length > 0)) {
                    setHasData(true);

                    // Get saved mood
                    const moodInfo = MOOD_DATA_MAP[userData.lastMood] || { text: "Kurang Baik", emoji: "😀" };

                    // Parse history into chart data
                    if (userData.history && userData.history.length > 0) {
                        const historyData = userData.history.slice(-7); // Get up to last 7 days Max
                        
                        // Overwrite DEFAULT_DATA from the end backwards
                        const startIndex = Math.max(0, 7 - historyData.length);
                        
                        for (let i = 0; i < historyData.length; i++) {
                            const entry = historyData[i];
                            const dateObj = new Date(entry.date);
                            const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                            const dayName = dayNames[dateObj.getDay()];

                            newChartData[startIndex + i] = {
                                name: dayName,
                                depresi: Math.max(0, entry.sliders?.sadness || 0),
                                kecemasan: Math.max(0, entry.sliders?.anxiety || 0),
                                stres: Math.max(0, entry.sliders?.stress || 0)
                            };
                        }
                    }

                    // Set state
                    setChartData(newChartData);
                    setStats({
                        streak: userData.streak || 0,
                        sessions: userData.totalSessions || 0,
                        moodText: moodInfo.text,
                        moodEmoji: moodInfo.emoji
                    });
                } else {
                    // No history but they might just be empty
                    setChartData(newChartData);
                }
            }
        } catch (e) {
            console.error("Parse error", e);
        }
    }, []);

    const clearData = () => {
        const username = localStorage.getItem('moodify_currentUser');
        if (!username) return;

        const userKey = `moodify_data_${username}`;
        try {
            const savedData = localStorage.getItem(userKey);
            if (savedData) {
                const userData = JSON.parse(savedData);
                userData.hasCheckedIn = false;
                userData.lastMood = null;
                userData.lastSliders = null;
                // keep streak and totalSessions or clear them? The requirement says reset chart.
                // let's just reset everything for demo purposes
                userData.streak = 0;
                userData.totalSessions = 0;
                localStorage.setItem(userKey, JSON.stringify(userData));
            }
        } catch (e) { }

        setHasData(false);
        setChartData(DEFAULT_DATA);
        setStats({ streak: 0, sessions: 0, moodText: "Belum ada data", moodEmoji: "❓" });
    };

    return (
        <div className="progress-container animate-fade-in">
            {/* Header */}
            <div className="progress-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>Perkembanganmu</h1>
                    {hasData && (
                        <button onClick={clearData} className="btn-link" style={{ color: '#64748b', fontSize: '12px' }}>Reset</button>
                    )}
                </div>
                <p>
                    {hasData
                        ? "Kamu sudah berjuang dengan sangat baik!"
                        : "Mulai perjalananmu dengan Check-in hari ini."}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
                <div className="stat-card orange-card">
                    <div className="stat-icon-wrapper orange-icon">
                        <Flame size={20} color="#ea580c" />
                    </div>
                    <h2 className="stat-number">{stats.streak}</h2>
                    <span className="stat-label">HARI BERUNTUN</span>
                </div>

                <div className="stat-card blue-card">
                    <div className="stat-icon-wrapper blue-icon">
                        <Calendar size={20} color="#2563eb" />
                    </div>
                    <h2 className="stat-number">{stats.sessions}</h2>
                    <span className="stat-label">TOTAL SESI</span>
                </div>
            </div>

            {/* Average Mood */}
            <div className="glass-card avg-mood-card">
                <div className="avg-mood-text">
                    <span className="avg-mood-label">MOOD RATA-RATA</span>
                    <h3 className="avg-mood-value">{stats.moodText}</h3>
                </div>
                <div className="avg-mood-emoji">
                    <span>{stats.moodEmoji}</span>
                </div>
            </div>

            {/* Chart Section */}
            <div className="glass-card chart-card">
                <h3>Grafik DASS-21 Mingguan</h3>
                <div className="chart-wrapper" style={{ position: 'relative' }}>

                    {!hasData && (
                        <div className="empty-chart-overlay">
                            <Info size={24} color="#94a3b8" />
                            <p>Belum ada data check-in</p>
                        </div>
                    )}

                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorDepresi" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorKecemasan" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorStres" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                            <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area type="monotone" dataKey="depresi" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDepresi)" />
                            <Area type="monotone" dataKey="kecemasan" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorKecemasan)" />
                            <Area type="monotone" dataKey="stres" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorStres)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Custom Legend */}
                <div className="custom-legend">
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#2563eb' }}></span>
                        <span className="legend-text">Depresi</span>
                        <span className="legend-status">Stabil</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#ea580c' }}></span>
                        <span className="legend-text">Kecemasan</span>
                        <span className="legend-status">Stabil</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#dc2626' }}></span>
                        <span className="legend-text">Stres</span>
                        <span className="legend-status">Stabil</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Progress;
