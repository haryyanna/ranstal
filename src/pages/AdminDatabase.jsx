import { useState, useEffect } from 'react';
import { Users, Activity, MessageCircle, AlertCircle, Download, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminDatabase.css';

const AdminDatabase = () => {
    const [users, setUsers] = useState([]);
    const [globalChartData, setGlobalChartData] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        checkInsToday: 0,
        interventions: 0,
        highRisk: 0
    });

    const calculateRiskLevel = (sliders) => {
        if (!sliders) return 'Belum Ada';
        const avg = (sliders.sadness + sliders.anxiety + sliders.stress) / 3;
        if (avg >= 7) return 'Tinggi';
        if (avg >= 4) return 'Sedang';
        return 'Rendah';
    };

    const getMoodText = (moodId) => {
        const MOOD_DATA_MAP = {
            1: "Sangat Sedih",
            2: "Sedih",
            3: "Biasa Saja",
            4: "Senang",
            5: "Sangat Senang"
        };
        return MOOD_DATA_MAP[moodId] || 'Tidak Diketahui';
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Belum Aktif';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHours / 24);

        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} jam ago`;
        if (diffDays === 1) return `Kemarin`;
        return `${diffDays} hari ago`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const isToday = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    useEffect(() => {
        const loadedUsers = [];
        let totalCheckInsToday = 0;
        let totalInterventions = 0;
        let totalHighRisk = 0;

        // For global chart: count moods per day
        const moodTrends = {
            'Min': 0, 'Sen': 0, 'Sel': 0, 'Rab': 0, 'Kam': 0, 'Jum': 0, 'Sab': 0
        };

        // Iterate localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('moodify_data_')) {
                try {
                    const savedData = localStorage.getItem(key);
                    const userData = JSON.parse(savedData);
                    const username = key.replace('moodify_data_', '');
                    
                    let lastActiveStr = null;
                    let lastRisk = 'Belum Ada';
                    let lastMoodStr = 'Belum Ada Data';

                    if (userData.history && userData.history.length > 0) {
                        const lastEntry = userData.history[userData.history.length - 1];
                        lastActiveStr = lastEntry.date;
                        lastRisk = calculateRiskLevel(lastEntry.sliders);
                        lastMoodStr = getMoodText(lastEntry.mood);

                        if (isToday(lastEntry.date)) {
                            totalCheckInsToday++;
                        }

                        // Populate Global Chart
                        userData.history.forEach(entry => {
                            const dateObj = new Date(entry.date);
                            const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                            const dayName = dayNames[dateObj.getDay()];
                            moodTrends[dayName]++;
                        });
                    }

                    if (lastRisk === 'Tinggi') {
                        totalHighRisk++;
                    }
                    
                    totalInterventions += userData.totalSessions || 0;

                    loadedUsers.push({
                        id: `USR-${Math.floor(Math.random() * 9000) + 1000}`,
                        name: username,
                        lastActive: formatTimeAgo(lastActiveStr),
                        lastActiveRaw: lastActiveStr || '',
                        joinedAt: userData.joinedAt || '',
                        mood: lastMoodStr,
                        riskLevel: lastRisk,
                        history: userData.history || []
                    });

                } catch (e) {
                    console.error("Error parsing user data:", key);
                }
            }
        }

        loadedUsers.sort((a, b) => {
            if (!a.lastActiveRaw) return 1;
            if (!b.lastActiveRaw) return -1;
            return new Date(b.lastActiveRaw) - new Date(a.lastActiveRaw);
        });

        // Format chart data
        const chartDataArray = Object.keys(moodTrends).map(day => ({
            name: day,
            CheckIn: moodTrends[day]
        }));

        setUsers(loadedUsers);
        setGlobalChartData(chartDataArray);
        setStats({
            total: loadedUsers.length,
            checkInsToday: totalCheckInsToday,
            interventions: totalInterventions,
            highRisk: totalHighRisk
        });
    }, []);

    const exportToCSV = () => {
        if (users.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        // Header
        csvContent += "ID,Nama,Tanggal Bergabung,Status Mood Terakhir,Tingkat Risiko,Aktivitas Terakhir,Total Check-in\n";
        
        // Rows
        users.forEach(user => {
            const joinDate = formatDate(user.joinedAt);
            const totalSesh = user.history.length;
            const row = `${user.id},${user.name},${joinDate},${user.mood},${user.riskLevel},${user.lastActiveRaw},${totalSesh}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `moodify_admin_report_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openModal = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    return (
        <div className="admin-container animate-fade-in">
            <div className="admin-header">
                <div className="admin-logo-area">
                    <div className="admin-logo">🤖</div>
                    <div>
                        <h1>MOODIFY Admin Portal</h1>
                        <p>Database & Analytics Dashboard</p>
                    </div>
                </div>
                <div className="admin-user">
                    <div className="admin-avatar">A</div>
                    <span>Admin SMAN 1</span>
                </div>
            </div>

            <div className="admin-stats-overview">
                <div className="admin-stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Total Pengguna Aktif</span>
                        <Users size={18} color="#64748b" />
                    </div>
                    <h2 className="stat-value">{stats.total}</h2>
                    <span className="stat-trend neutral">Data terkini</span>
                </div>

                <div className="admin-stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Check-in Hari Ini</span>
                        <Activity size={18} color="#64748b" />
                    </div>
                    <h2 className="stat-value">{stats.checkInsToday}</h2>
                    <span className="stat-trend positive">Terakumulasi hari ini</span>
                </div>

                <div className="admin-stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Total Sesi Check-in</span>
                        <MessageCircle size={18} color="#64748b" />
                    </div>
                    <h2 className="stat-value">{stats.interventions}</h2>
                    <span className="stat-trend neutral">Keseluruhan sesi berjalan</span>
                </div>

                <div className="admin-stat-card alert-card">
                    <div className="stat-header">
                        <span className="stat-title">Peringatan Risiko (Tinggi)</span>
                        <AlertCircle size={18} color="#ef4444" />
                    </div>
                    <h2 className="stat-value text-danger">{stats.highRisk}</h2>
                    <span className="stat-trend negative">Siswa dengan rata-rata slider {'>='} 7</span>
                </div>
            </div>

            {/* Global Chart Section */}
            <div className="admin-data-section glass-card" style={{ marginBottom: '24px' }}>
                <div className="data-section-header">
                    <h3>Tren Check-in Keseluruhan (Mingguan)</h3>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={globalChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                            <Bar dataKey="CheckIn" fill="#2a9d8f" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="admin-data-section glass-card">
                <div className="data-section-header">
                    <h3>Log Interaksi Pengguna Terkini</h3>
                    <div className="data-actions">
                        <button className="btn-secondary" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Nama (Anonim)</th>
                                <th>Bergabung Sejak</th>
                                <th>Status Mood Terakhir</th>
                                <th>Tingkat Risiko</th>
                                <th>Aktivitas Terakhir</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user, idx) => (
                                    <tr key={idx}>
                                        <td className="font-medium">{user.name}</td>
                                        <td className="text-muted">{formatDate(user.joinedAt)}</td>
                                        <td>
                                            <span className={`mood-badge mood-${user.mood.toLowerCase().replace(/ /g, '-')}`}>
                                                {user.mood}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`risk-badge risk-${user.riskLevel.toLowerCase()}`}>
                                                {user.riskLevel}
                                            </span>
                                        </td>
                                        <td className="text-muted">{user.lastActive}</td>
                                        <td>
                                            <button className="btn-link" onClick={() => openModal(user)}>Lihat Detail</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                                        Belum ada data check-in pengguna.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for User Detail */}
            {isModalOpen && selectedUser && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detail Pengguna: {selectedUser.name}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-stats-row">
                                <div className="modal-stat">
                                    <span>Total Sesi</span>
                                    <strong>{selectedUser.history.length}</strong>
                                </div>
                                <div className="modal-stat">
                                    <span>Bergabung</span>
                                    <strong>{formatDate(selectedUser.joinedAt)}</strong>
                                </div>
                                <div className="modal-stat">
                                    <span>Status Risiko Terkini</span>
                                    <strong className={`text-${selectedUser.riskLevel === 'Tinggi' ? 'danger' : 'main'}`}>
                                        {selectedUser.riskLevel}
                                    </strong>
                                </div>
                            </div>

                            <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '16px' }}>Riwayat Check-in</h3>
                            {selectedUser.history && selectedUser.history.length > 0 ? (
                                <div className="history-list">
                                    {[...selectedUser.history].reverse().map((entry, idx) => (
                                        <div key={idx} className="history-card">
                                            <div className="history-date">{formatDate(entry.date)}</div>
                                            <div className="history-mood">Mood: <strong>{getMoodText(entry.mood)}</strong></div>
                                            <div className="history-sliders">
                                                <span>Depresi: {entry.sliders?.sadness || 0}/10 | </span>
                                                <span>Cemas: {entry.sliders?.anxiety || 0}/10 | </span>
                                                <span>Stres: {entry.sliders?.stress || 0}/10</span>
                                            </div>
                                            {entry.journalText && (
                                                <div className="history-journal">"{entry.journalText}"</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">Belum ada riwayat check-in tersimpan.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDatabase;
