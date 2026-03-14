import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import './CheckIn.css';

const MOODS = [
    { id: 1, label: 'Sangat Sedih', emoji: '😭' },
    { id: 2, label: 'Sedih', emoji: '😔' },
    { id: 3, label: 'Biasa Saja', emoji: '😐' },
    { id: 4, label: 'Senang', emoji: '🙂' },
    { id: 5, label: 'Sangat Senang', emoji: '😄' }
];

const CheckIn = () => {
    const navigate = useNavigate();
    const [selectedMood, setSelectedMood] = useState(null);

    const [sliders, setSliders] = useState({
        sadness: 0,
        anxiety: 0,
        stress: 0
    });

    const [journalText, setJournalText] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    const handleSliderChange = (type, value) => {
        setSliders(prev => ({
            ...prev,
            [type]: parseInt(value, 10)
        }));
    };

    const handleSave = () => {
        const username = localStorage.getItem('moodify_currentUser');
        if (!username) {
            alert('Silakan login terlebih dahulu di halaman Home!');
            navigate('/home');
            return;
        }

        const userKey = `moodify_data_${username}`;
        let userData = {
            hasCheckedIn: false,
            lastMood: null,
            lastSliders: null,
            totalSessions: 0,
            streak: 0,
            history: [],
            chatHistory: []
        };

        try {
            const savedData = localStorage.getItem(userKey);
            if (savedData) {
                userData = JSON.parse(savedData);
            }
        } catch (e) {
            console.error(e);
        }

        userData.hasCheckedIn = true;
        userData.lastMood = selectedMood;
        userData.lastSliders = sliders;

        // Update stats
        userData.totalSessions += 1;
        userData.streak += 1;

        // Add to history
        userData.history.push({
            date: new Date().toISOString(),
            mood: selectedMood,
            sliders: sliders,
            journalText: journalText
        });

        localStorage.setItem(userKey, JSON.stringify(userData));

        setIsSaved(true);
        setTimeout(() => {
            navigate('/progress');
        }, 1500);
    };

    if (isSaved) {
        return (
            <div className="checkin-container success-container animate-fade-in">
                <div className="success-content">
                    <CheckCircle2 size={64} color="#10b981" className="pulse-animation" />
                    <h2>Jurnal Tersimpan!</h2>
                    <p>Memindahkanmu ke halaman Progress...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="checkin-container animate-fade-in">
            {/* Header */}
            <div className="checkin-header">
                <div className="badge pulse-animation" style={{ margin: '0 auto 16px auto' }}>
                    <Sparkles size={14} className="badge-icon" />
                    <span>DAILY CHECK-IN</span>
                </div>
                <h1>Bagaimana perasaanmu <br /> hari ini?</h1>
            </div>

            {/* Mood Selector */}
            <div className="mood-selector">
                {MOODS.map((mood) => (
                    <button
                        key={mood.id}
                        className={`mood-btn ${selectedMood === mood.id ? 'selected' : ''}`}
                        onClick={() => setSelectedMood(mood.id)}
                    >
                        <div className="mood-emoji">{mood.emoji}</div>
                        <span className="mood-label">{mood.label}</span>
                    </button>
                ))}
            </div>

            {/* Form Area */}
            <div className="checkin-form glass-card">
                <h3>Gambarkan intensitasnya (Opsional)</h3>

                {/* Sliders */}
                <div className="slider-group">
                    <div className="slider-header">
                        <span>Rasa Sedih / Kosong</span>
                        <span className="slider-value">{sliders.sadness} / 10</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="10"
                        value={sliders.sadness}
                        onChange={(e) => handleSliderChange('sadness', e.target.value)}
                        className="custom-slider"
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-header">
                        <span>Rasa Cemas / Gelisah</span>
                        <span className="slider-value">{sliders.anxiety} / 10</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="10"
                        value={sliders.anxiety}
                        onChange={(e) => handleSliderChange('anxiety', e.target.value)}
                        className="custom-slider"
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-header">
                        <span>Rasa Tegang / Stres</span>
                        <span className="slider-value">{sliders.stress} / 10</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="10"
                        value={sliders.stress}
                        onChange={(e) => handleSliderChange('stress', e.target.value)}
                        className="custom-slider"
                    />
                </div>

                {/* Journal Area */}
                <div className="journal-area">
                    <h3>Ceritakan sedikit lebih banyak?</h3>
                    <textarea
                        placeholder="Aku merasa..."
                        value={journalText}
                        onChange={(e) => setJournalText(e.target.value)}
                        rows={4}
                    />
                </div>

                {/* Save Button */}
                <button
                    className={`btn-primary checkin-save-btn ${selectedMood ? 'ready' : ''}`}
                    onClick={handleSave}
                    disabled={!selectedMood}
                >
                    Simpan Jurnal Hari Ini
                </button>
            </div>
        </div>
    );
};

export default CheckIn;
