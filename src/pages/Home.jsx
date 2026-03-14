import { useState, useEffect } from 'react';
import { ArrowRight, Heart, ShieldCheck, Sparkles, Image as ImageIcon, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [inputName, setInputName] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('moodify_currentUser');
        if (storedUser) {
            setUsername(storedUser);
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (inputName.trim().length > 0) {
            const name = inputName.trim();
            localStorage.setItem('moodify_currentUser', name);

            // Initialize user data structure if not exists
            const userKey = `moodify_data_${name}`;
            if (!localStorage.getItem(userKey)) {
                localStorage.setItem(userKey, JSON.stringify({
                    hasCheckedIn: false,
                    lastMood: null,
                    lastSliders: null,
                    totalSessions: 0,
                    streak: 0,
                    history: [],
                    chatHistory: [], // Initialize chat history
                    joinedAt: new Date().toISOString() // Track join date
                }));
            }

            setUsername(name);
            setIsLoggedIn(true);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('moodify_currentUser');
        setUsername('');
        setIsLoggedIn(false);
    };

    if (!isLoggedIn) {
        return (
            <div className="home-container animate-fade-in" style={{ justifyContent: 'center', paddingBottom: '0' }}>
                <div className="login-card glass-card">
                    <div className="logo-placeholder" style={{ margin: '0 auto 24px auto', width: '64px', height: '64px', fontSize: '32px' }}>
                        <span className="logo-icon">🤖</span>
                    </div>
                    <h2 className="app-name" style={{ textAlign: 'center', marginBottom: '8px' }}>MOODIFY</h2>
                    <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
                        Pendamping Mental Sehat, Berbasis AI.
                    </p>

                    <form onSubmit={handleLogin} className="login-form">
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#123e42', marginBottom: '8px', display: 'block' }}>
                            SIAPA NAMAMU?
                        </label>
                        <input
                            type="text"
                            placeholder="Ketik nama panggilanmu..."
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            required
                            autoFocus
                        />
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                            Masuk & Mulai
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container animate-fade-in">
            {/* Header */}
            <header className="home-header">
                <div className="logo-container">
                    <div className="logo-placeholder">
                        <span className="logo-icon">🤖</span>
                    </div>
                    <h2 className="app-name">MOODIFY</h2>
                </div>
                <button className="icon-btn-rounded" onClick={handleLogout} title="Ganti Akun">
                    <UserCircle2 size={20} />
                </button>
            </header>

            {/* Main Content */}
            <main className="home-content">
                <div className="badge pulse-animation">
                    <Sparkles size={14} className="badge-icon" />
                    <span>Halo, {username}!</span>
                </div>

                <h1 className="hero-title">
                    Pendamping Mental Sehat, <br />
                    <span className="text-gradient">Berbasis AI.</span>
                </h1>

                <p className="hero-description">
                    MOODIFY adalah chatbot psikoedukatif yang dirancang khusus untuk memberikan dukungan emosional, edukasi kesehatan mental, dan strategi coping yang tepat untuk remaja.
                </p>

                <button className="btn-primary hero-btn" onClick={() => navigate('/chat')}>
                    Mulai Konseling
                    <ArrowRight size={18} />
                </button>

                {/* Features Row */}
                <div className="features-grid">
                    <div className="feature-item">
                        <div className="feature-icon-wrapper bg-blue-soft">
                            <Heart size={20} className="icon-blue" />
                        </div>
                        <div className="feature-text">
                            <h3>Aman & Nyaman</h3>
                            <p>Ruang ceritamu 100% rahasia.</p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <div className="feature-icon-wrapper bg-green-soft">
                            <ShieldCheck size={20} className="icon-green" />
                        </div>
                        <div className="feature-text">
                            <h3>Teruji Klinis</h3>
                            <p>Berbasis psikologi modern.</p>
                        </div>
                    </div>
                </div>

                {/* Image Placeholder Area */}
                <div className="image-showcase-wrapper">
                    <div className="image-placeholder-card">
                        <div className="empty-image-state">
                            <ImageIcon size={48} className="empty-icon" />
                            <p>Tempat Gambar Ilustrasi</p>
                        </div>
                    </div>

                    {/* Floating Mood Badge as seen in the mockup */}
                    <div className="floating-mood-badge glass-card">
                        <span className="leaf-icon">🌿</span>
                        <div className="mood-text">
                            <span className="mood-label">MOOD HARI INI</span>
                            <span className="mood-value">Lebih Tenang</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Home;
