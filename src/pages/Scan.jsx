import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Sparkles, AlertTriangle, RotateCcw, Upload, SwitchCamera, ScanLine, Lightbulb, BookOpenCheck } from 'lucide-react';
import { enqueueSheetsBackup } from '../lib/sheetsBackup';
import { analyzeDrinkImage } from '../lib/nutriApi';
import { VERIFIED_FOODS, findVerifiedFood, normalizeFoodData } from '../../data/verifiedFoods';
import './Scan.css';

const Scan = () => {
  const videoRef = useRef(null), canvasRef = useRef(null), inputRef = useRef(null), streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraState, setCameraState] = useState('loading');
  const [cameraError, setCameraError] = useState('');
  const [hasFlash, setHasFlash] = useState(false);
  const [photo, setPhoto] = useState(''), [selectedFoodId, setSelectedFoodId] = useState('');
  const [showAllFoods, setShowAllFoods] = useState(false);
  const [scanSteps, setScanSteps] = useState(''), [progress, setProgress] = useState(0), [scannedFood, setScannedFood] = useState(null);

  const stopCamera = useCallback(() => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; }, []);
  const startCamera = useCallback(async () => {
    stopCamera(); setCameraError(''); setCameraState('loading');
    try {
      if (!window.isSecureContext) throw new Error('Kamera membutuhkan koneksi HTTPS. Buka alamat https:// dari server jaringan, lalu izinkan sertifikat dan akses kamera.');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Browser ini tidak mendukung akses kamera.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraState('ready');
    } catch (error) {
      setCameraError(error.name === 'NotAllowedError' ? 'Izin kamera ditolak. Aktifkan izin kamera pada browser, lalu coba lagi.' : error.message || 'Kamera tidak dapat dibuka.');
      setCameraState('error');
    }
  }, [facingMode, stopCamera]);
  useEffect(() => { startCamera(); return stopCamera; }, [startCamera, stopCamera]);

  const capturePhoto = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video?.videoWidth || !canvas) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.88)); stopCamera(); setCameraState('preview');
  };
  const handleUpload = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    event.target.value = '';
    if (!file.type.startsWith('image/')) {
      setCameraError('File yang dipilih harus berupa foto atau gambar.');
      setCameraState('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setCameraError(''); setPhoto(String(reader.result)); stopCamera(); setCameraState('preview'); };
    reader.onerror = () => { setCameraError('Foto tidak dapat dibaca. Silakan pilih file gambar lain.'); setCameraState('error'); };
    reader.readAsDataURL(file);
  };
  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0]; if (!track?.applyConstraints) return;
    try { const next = !hasFlash; await track.applyConstraints({ advanced: [{ torch: next }] }); setHasFlash(next); } catch { setCameraError('Lampu flash tidak tersedia pada kamera ini.'); }
  };
  const saveScanToHistory = (food) => {
    const username = localStorage.getItem('moodify_currentUser') || localStorage.getItem('ranstal_currentUser');
    if (!username || !food || typeof food !== 'object') return;
    try {
      const key = `moodify_data_${username}`;
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      const scan = { 
        date: new Date().toISOString(), 
        foodId: food?.id || 'unknown', 
        name: food?.name || 'Makanan', 
        grade: food?.grade || 'B', 
        calories: Number(food?.calories) || 0, 
        protein: Number(food?.protein) || 0, 
        fat: Number(food?.fat) || 0, 
        carbs: Number(food?.carbs) || 0, 
        source: 'Database Makanan Ranstal' 
      };
      data.scanHistory = Array.isArray(data.scanHistory) ? data.scanHistory : [];
      data.scanHistory.push(scan);
      data.gamification = data.gamification || { xp: 0, level: 1, badges: [] };
      if (typeof data.gamification?.xp === 'number') data.gamification.xp += 15;
      if (typeof data.gamification?.level === 'number') data.gamification.level = Math.max(1, Math.floor(data.gamification.xp / 60) + 1);
      localStorage.setItem(key, JSON.stringify(data));
      if (localStorage.getItem('moodify_currentUser') !== username) localStorage.setItem('moodify_currentUser', username);
      enqueueSheetsBackup({ eventType: 'food_scan', username, payload: scan });
    } catch (error) { console.warn('Tidak dapat menyimpan riwayat scan', error); }
  };

  const startAnalysis = async () => {
    if (!photo) return;
    setCameraState('scanning');
    setProgress(8);
    const steps = ['Mengirim foto dengan aman...', 'Mengenali makanan dan label...', 'Mencari data gizi dari database...', 'Menghitung ringkasan nutrisi...'];
    let index = 0;
    setScanSteps(steps[index]);

    const timer = window.setInterval(() => {
      index = Math.min(index + 1, steps.length - 1);
      setScanSteps(steps[index]);
      setProgress((value) => Math.min(value + 16, 88));
    }, 900);

    try {
      const selectedFood = VERIFIED_FOODS.find((item) => item?.id === selectedFoodId);
      const matchedFood = selectedFood || findVerifiedFood(selectedFoodId || 'makanan');
      const result = await analyzeDrinkImage({
        imageB64: photo,
        searchHint: matchedFood?.name || '',
        drinkKey: selectedFoodId
      });
      const valueToAnalyze = result?.result || matchedFood;
      if (!valueToAnalyze) throw new Error('Makanan belum teridentifikasi. Pilih jenis makanan yang paling sesuai, lalu coba lagi.');
      const food = normalizeFoodData({ ...valueToAnalyze, source: result?.source || 'Database Makanan Ranstal' });

      setScannedFood(food);
      setProgress(100);
      saveScanToHistory(food);
      setCameraState('result');
      setCameraError('');
    } catch (error) {
      console.error('Error saat analisis:', error);
      const message = error?.message || 'Makanan belum teridentifikasi. Pilih jenis makanan yang paling sesuai, lalu coba lagi.';
      setCameraError(message);
      setCameraState('preview');
    } finally {
      window.clearInterval(timer);
    }
  };

  const resetScanner = () => { setPhoto(''); setProgress(0); setScannedFood(null); setSelectedFoodId(''); startCamera(); };
  const food = scannedFood;
  const safetyInterpretation = food?.status === 'Sangat Aman'
    ? 'Makanan ini sangat aman untuk dikonsumsi anak selama perjalanan wisata. Tinggi nutrisi dan rendah risiko.'
    : food?.status === 'Perlu Hati-hati'
      ? 'Makanan ini cukup aman namun perlu perhatian khusus. Pastikan kondisi makanan baik dan higienis.'
      : food?.status === 'Bukan Makanan'
        ? 'Objek yang dipindai bukan makanan yang jelas layak dikonsumsi. Pastikan Anda memindai makanan yang benar-benar bisa dimakan.'
        : 'Makanan ini berisiko untuk perjalanan. Pertimbangkan alternatif yang lebih aman untuk anak.';

  return (
    <div className="scan-container">
      <header className="scan-header">
        <div className="feature-heading">
          <ScanLine className="feature-heading-icon" />
          <h2 className="title">Scan Makanan</h2>
        </div>
        <p className="subtitle">Cek keamanan dan nutrisi makanan untuk perjalanan wisata anak.</p>
      </header>
      
      <div className="drink-selector-wrapper">
        <label>Bantuan identifikasi (opsional bila foto kurang jelas)</label>
        <div className="selector-grid">
          {(showAllFoods ? VERIFIED_FOODS : VERIFIED_FOODS.slice(0, 5)).map((item) => (
            <button 
              key={item.id} 
              className={`select-chip ${selectedFoodId === item.id ? 'active' : ''}`} 
              onClick={() => setSelectedFoodId(selectedFoodId === item.id ? '' : item.id)}
            >
              <span>{item.emoji}</span> {item.name.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
        <button 
          type="button" 
          className="toggle-drinks-btn" 
          onClick={() => setShowAllFoods((value) => !value)}
        >
          {showAllFoods ? 'Tampilkan lebih sedikit' : `Tampilkan selengkapnya (${VERIFIED_FOODS.length - 5} lainnya)`}
        </button>
      </div>
      
      <button 
        type="button" 
        className="upload-file-btn" 
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={18} /> Upload foto dari galeri / file
      </button>
      
      <div className="camera-viewport-card">
        {(cameraState === 'loading' || cameraState === 'ready') && (
          <div className="camera-live">
            <video ref={videoRef} className="camera-video" playsInline muted />
            <div className="scan-guide-box guide-green">
              <span className="guide-label">ARAHKAN KE MAKANAN</span>
            </div>
            <div className="camera-bar-top">
              <button onClick={toggleFlash} className={`icon-btn ${hasFlash ? 'text-amber' : ''}`} title="Flash">⚡</button>
              <span className="cam-status">KAMERA AKTIF</span>
              <button className="icon-btn" onClick={() => setFacingMode((mode) => mode === 'environment' ? 'user' : 'environment')} title="Ganti kamera">
                <SwitchCamera size={18} />
              </button>
            </div>
            <div className="camera-bar-bottom">
              <button className="camera-action" onClick={() => inputRef.current?.click()} title="Pilih foto">
                <Upload size={22} />
              </button>
              <button className="shutter-btn" disabled={cameraState === 'loading'} onClick={capturePhoto} title="Ambil foto">
                <div className="inner-shutter" />
              </button>
              <span className="camera-action"><Camera size={22} /></span>
            </div>
          </div>
        )}
        
        {cameraState === 'error' && (
          <div className="camera-preview camera-error">
            <AlertTriangle size={44} />
            <h3>Kamera belum tersedia</h3>
            <p>{cameraError}</p>
            <button className="btn-primary" onClick={startCamera}><Camera size={16} /> Coba buka kamera</button>
            <button className="btn-secondary" onClick={() => inputRef.current?.click()}><Upload size={16} /> Pilih foto</button>
          </div>
        )}
        
        {cameraState === 'preview' && (
          <div className="camera-preview">
            <h3 className="preview-heading">Hasil Tangkapan</h3>
            <img className="captured-image-box captured-photo" src={photo} alt="Foto makanan untuk diperiksa" />
            <p className="analysis-error">{cameraError}</p>
            <div className="action-buttons">
              <button className="btn-secondary" onClick={resetScanner}><RotateCcw size={16} /> Foto Ulang</button>
              <button className="btn-primary" onClick={startAnalysis}><Sparkles size={16} /> Analisa Makanan</button>
            </div>
          </div>
        )}
        
        {cameraState === 'scanning' && (
          <div className="camera-scanning">
            <div className="radar-circle">
              <div className="scan-line" />
              <Camera size={56} />
            </div>
            <h3 className="scanning-title">Menganalisa Makanan</h3>
            <p className="scanning-step">{scanSteps}</p>
            <div className="progress-bar-container">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-percentage">{progress}%</span>
          </div>
        )}
        
        {cameraState === 'result' && food && (
          <div className="scan-result-card animate-fade-in">
            <div className="result-header">
              <span className="result-emoji">{food.emoji || '🍽️'}</span>
              <div>
                <h3 className="drink-title">{food.name}</h3>
                <span className="drink-cat">{food.category}</span>
              </div>
            </div>
            <div className="scan-insight-grid">
              <div className="scan-insight-item">
                <Lightbulb size={19} />
                <div>
                  <strong>Mengapa diperiksa?</strong>
                  <p>{food.isFood === false
                    ? 'Objek yang dipindai tidak jelas sebagai makanan. Pastikan Anda memindai makanan yang aman dan sesuai untuk dikonsumsi.'
                    : 'Makanan yang aman sangat penting untuk kesehatan anak selama perjalanan wisata. Ranstal membantu memastikan makanan yang dikonsumsi aman dan bernutrisi.'}</p>
                </div>
              </div>
              <div className="scan-insight-item">
                <BookOpenCheck size={19} />
                <div>
                  <strong>Cara membaca hasil</strong>
                  <p>Grade menunjukkan tingkat keamanan makanan, sedangkan detail nutrisi membantu memantau asupan gizi anak selama perjalanan.</p>
                </div>
              </div>
            </div>
            <div className="result-meta-strip">
              <span className="result-badge status-badge" style={{ background: food.gradeColor }}>
                {food.status}
              </span>
              <span className="result-badge secondary-badge">
                {food.isFood === false ? 'Cek ulang' : 'Terverifikasi'}
              </span>
            </div>
            <div className="grade-badge-row">
              <div className="nutriscore-badge" style={{ backgroundColor: food.gradeColor }}>
                <span className="score-lbl">Safety-Score</span>
                <span className="score-val">{food.grade}</span>
              </div>
              <div className="health-status-msg">
                <span className="status-title">Status Keamanan</span>
                <span className="status-desc" style={{ color: food.gradeColor }}>{food.status}</span>
              </div>
            </div>
            <div className="nutrition-details-table">
              {(food?.nutritionList || []).map((item, index) => (
                <div key={index} className="details-row">
                  <span className="lbl">{item.label}</span>
                  <div className="val-group">
                    <span className="val">{item.value}</span>
                    <span className="desc">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="interpretation-box">
              <p className="interpretation-text">{safetyInterpretation}</p>
            </div>
            <div className="tips-section">
              <div className="tips-section-block">
                <h4>Rekomendasi penyajian</h4>
                <p>{food.servingRecommendation || 'Sajikan dengan porsi sesuai usia, pastikan bersih, dan tetap seimbang dengan hidrasi.'}</p>
              </div>
              <div className="tips-section-block">
                <h4>Tips Keamanan</h4>
                <p>{food.safetyTips}</p>
              </div>
              <ul className="recommendation-list">
                {(food.additionalRecommendations || []).map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
              {food.allergens && food.allergens !== 'Tidak ada' && (
                <p className="allergen-warning">⚠️ Alergen: {food.allergens}</p>
              )}
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden-canvas" />
      <input ref={inputRef} className="hidden-file-input" type="file" accept="image/*,.heic,.heif" onChange={handleUpload} />
    </div>
  );
};
export default Scan;
