import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ChevronRight,
  ChevronLeft,
  Leaf,
  RefreshCw,
  Share2,
  AlertCircle,
  Sparkles,
  Heart,
  Eye,
  Check,
  X,
} from "lucide-react";

// ===================== 問卷題目 =====================

const questions = [
  {
    id: 1,
    question: "你平時容易怕冷還是怕熱？",
    icon: "🌡️",
    options: [
      { text: "非常怕冷，手腳冰涼", scores: { yangXu: 3, qiXu: 1 } },
      { text: "比較怕熱，容易出汗", scores: { yinXu: 2, shiRe: 2 } },
      { text: "不太怕冷也不太怕熱", scores: { pingHe: 3 } },
      { text: "時冷時熱，不太穩定", scores: { qiYu: 2, tanShi: 1 } },
    ],
  },
  {
    id: 2,
    question: "你是否經常感到疲倦乏力？",
    icon: "😴",
    options: [
      { text: "經常覺得很累，提不起勁", scores: { qiXu: 3, yangXu: 1 } },
      { text: "偶爾疲倦，休息後就恢復", scores: { pingHe: 2 } },
      { text: "身體沉重，頭腦昏沉", scores: { tanShi: 3, shiRe: 1 } },
      { text: "精力還好，但情緒容易疲勞", scores: { qiYu: 3 } },
    ],
  },
  {
    id: 3,
    question: "你的睡眠品質如何？",
    icon: "🌙",
    options: [
      { text: "入睡困難，容易多夢", scores: { yinXu: 3, qiYu: 1 } },
      { text: "睡眠尚可，偶爾失眠", scores: { pingHe: 2 } },
      { text: "容易早醒，醒後難再入睡", scores: { qiYu: 2, yinXu: 1 } },
      { text: "嗜睡，怎麼睡都覺得不夠", scores: { tanShi: 3, qiXu: 1 } },
    ],
  },
  {
    id: 4,
    question: "飯後你的消化狀況如何？",
    icon: "🍵",
    options: [
      { text: "經常腹脹，消化不良", scores: { qiXu: 2, tanShi: 2 } },
      { text: "消化正常，偶爾不適", scores: { pingHe: 2 } },
      { text: "容易胃灼熱或反酸", scores: { shiRe: 3, yinXu: 1 } },
      { text: "食慾不穩定，時好時壞", scores: { qiYu: 2, qiXu: 1 } },
    ],
  },
  {
    id: 5,
    question: "你的情緒狀態通常是？",
    icon: "💭",
    options: [
      { text: "容易焦慮、悶悶不樂", scores: { qiYu: 3 } },
      { text: "心情平穩，偶爾波動", scores: { pingHe: 2 } },
      { text: "容易煩躁、發脾氣", scores: { yinXu: 2, shiRe: 2 } },
      { text: "容易傷感、多愁善感", scores: { qiXu: 1, qiYu: 2, yangXu: 1 } },
    ],
  },
  {
    id: 6,
    question: "你平時喜歡喝什麼溫度的水？",
    icon: "🥤",
    options: [
      { text: "喜歡喝溫熱水", scores: { yangXu: 2, qiXu: 1 } },
      { text: "喜歡喝冰水、冷飲", scores: { shiRe: 2, yinXu: 2 } },
      { text: "常溫水就好", scores: { pingHe: 2 } },
      { text: "不太愛喝水", scores: { tanShi: 2, qiYu: 1 } },
    ],
  },
  {
    id: 7,
    question: "你的皮膚狀況如何？",
    icon: "✨",
    options: [
      { text: "皮膚乾燥，容易脫皮", scores: { yinXu: 3 } },
      { text: "面部油膩，容易長痘", scores: { shiRe: 3, tanShi: 1 } },
      { text: "膚色偏白或蠟黃", scores: { qiXu: 2, yangXu: 2 } },
      { text: "皮膚還算正常", scores: { pingHe: 2 } },
    ],
  },
  {
    id: 8,
    question: "你的排便情況如何？",
    icon: "🔄",
    options: [
      { text: "大便偏乾，容易便秘", scores: { yinXu: 2, shiRe: 1 } },
      { text: "大便偏軟或黏滯不爽", scores: { tanShi: 3, shiRe: 1 } },
      { text: "排便正常，每日一次", scores: { pingHe: 3 } },
      { text: "時而便秘時而腹瀉", scores: { qiYu: 2, qiXu: 1 } },
    ],
  },
];

// ===================== API 呼叫 =====================

const API_BASE = "";

async function callAnalyzeAPI(answers, tongueImage) {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: answers.map((a, i) => ({
        question_id: i + 1,
        scores: a.scores,
      })),
      tongue_image: tongueImage || null,
    }),
  });
  if (!res.ok) {
    throw new Error(`API 錯誤: ${res.status}`);
  }
  return res.json();
}

// ===================== 主應用 =====================

export default function App() {
  // 頁面狀態
  const [page, setPage] = useState("home");

  // 問卷狀態
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  // 相機狀態
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [tonguePhoto, setTonguePhoto] = useState(null);

  // 分析狀態
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // --------- 相機控制 ---------

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // 進入/離開 camera 頁面時自動開關相機
  useEffect(() => {
    if (page !== "camera" || tonguePhoto) return;

    let cancelled = false;
    setCameraError(null);
    setCameraReady(false);

    const init = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("你的瀏覽器不支持相機功能，請使用最新版 Chrome 或 Safari");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (!cancelled) setCameraReady(true);
          };
        }
      } catch (err) {
        if (!cancelled) {
          if (err.name === "NotAllowedError") {
            setCameraError("請允許相機權限以進行舌象拍攝");
          } else if (err.name === "NotFoundError") {
            setCameraError("未檢測到可用的相機設備");
          } else {
            setCameraError("相機啟動失敗：" + err.message);
          }
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [page, tonguePhoto, stopCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // 前置相機鏡像翻轉
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setTonguePhoto(canvas.toDataURL("image/jpeg", 0.7));
    stopCamera();
  };

  const retakePhoto = () => {
    setTonguePhoto(null);
    // useEffect 會自動重新啟動相機
  };

  // --------- 問卷導航 ---------

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers, questions[currentQ].options[selectedOption]];
    setAnswers(newAnswers);
    setSelectedOption(null);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setPage("camera");
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setAnswers((prev) => prev.slice(0, -1));
      setSelectedOption(null);
    }
  };

  // --------- 開始分析 ---------

  const startAnalyzing = (photo) => {
    setTonguePhoto(photo);
    setApiError(null);
    setAnalyzeProgress(0);
    setPage("analyzing");
  };

  useEffect(() => {
    if (page !== "analyzing") return;

    // 同時執行：最低等待 3.5 秒 + API 呼叫
    const minWait = new Promise((resolve) => setTimeout(resolve, 3500));

    const apiCall = callAnalyzeAPI(answers, tonguePhoto);

    // 進度條動畫（純視覺）
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setAnalyzeProgress(Math.min(Math.round((frame / 55) * 95), 95));
    }, 60);

    Promise.all([minWait, apiCall])
      .then(([, data]) => {
        clearInterval(interval);
        setAnalyzeProgress(100);
        setResult(data);
        setTimeout(() => setPage("result"), 500);
      })
      .catch((err) => {
        clearInterval(interval);
        console.error("分析失敗:", err);
        setApiError("分析失敗，請檢查網路連線後重試");
      });

    return () => clearInterval(interval);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // --------- 重新開始 ---------

  const restart = () => {
    stopCamera();
    setPage("home");
    setCurrentQ(0);
    setAnswers([]);
    setSelectedOption(null);
    setTonguePhoto(null);
    setCameraReady(false);
    setCameraError(null);
    setAnalyzeProgress(0);
    setResult(null);
    setApiError(null);
  };

  // --------- 動畫設定 ---------

  const pv = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // ===================== 渲染 =====================

  return (
    <div
      className="min-h-screen bg-stone-50 flex flex-col mx-auto"
      style={{ maxWidth: 480 }}
    >
      <AnimatePresence mode="wait">
        {/* ========== 首頁 ========== */}
        {page === "home" && (
          <motion.div
            key="home"
            variants={pv}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-gradient-to-br from-amber-700 via-amber-600 to-emerald-700 text-white px-6 pt-12 pb-16 rounded-b-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-10 translate-x-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-8 -translate-x-8" />
              <div className="text-center relative z-10">
                <div className="text-5xl mb-4">🍵</div>
                <h1 className="text-2xl font-bold mb-2">澳門 AI 智能養生茶</h1>
                <p className="text-amber-100 text-sm leading-relaxed">
                  結合中醫智慧與人工智能
                  <br />
                  為你量身調配專屬養生茶方
                </p>
              </div>
            </div>

            <div className="px-6 -mt-8 flex-1 flex flex-col">
              <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-800">AI 體質分析</h3>
                    <p className="text-xs text-stone-500">
                      智能問卷 + 舌象拍攝
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-800">個性化茶方</h3>
                    <p className="text-xs text-stone-500">
                      根據體質推薦專屬配方
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-800">養生建議</h3>
                    <p className="text-xs text-stone-500">
                      日常調理與飲食指導
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl p-4 mb-6 border border-amber-200">
                <p className="text-sm text-stone-600 text-center leading-relaxed">
                  🏛️ 融合澳門傳統涼茶文化
                  <br />
                  <span className="text-xs text-stone-400">
                    廿四味 · 五花茶 · 雞骨草 · 火麻仁
                  </span>
                </p>
              </div>

              <div className="mt-auto pb-8">
                <button
                  onClick={() => setPage("quiz")}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  開始體質測試 <ChevronRight className="w-5 h-5" />
                </button>
                <p className="text-center text-xs text-stone-400 mt-3">
                  約 2 分鐘即可完成測試
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========== 問卷頁 ========== */}
        {page === "quiz" && (
          <motion.div
            key={`quiz-${currentQ}`}
            variants={pv}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col px-6 pt-6 pb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={currentQ === 0 ? () => setPage("home") : handlePrev}
                className="p-2 -ml-2"
              >
                <ChevronLeft className="w-5 h-5 text-stone-600" />
              </button>
              <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentQ + 1) / questions.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-sm text-stone-500 font-medium">
                {currentQ + 1}/{questions.length}
              </span>
            </div>

            <div className="mb-6">
              <div className="text-3xl mb-3">{questions[currentQ].icon}</div>
              <h2 className="text-xl font-bold text-stone-800 leading-relaxed">
                {questions[currentQ].question}
              </h2>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {questions[currentQ].options.map((option, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedOption === idx
                      ? "border-amber-500 bg-amber-50 shadow-md"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedOption === idx
                          ? "border-amber-500 bg-amber-500"
                          : "border-stone-300"
                      }`}
                    >
                      {selectedOption === idx && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        selectedOption === idx
                          ? "text-amber-800 font-medium"
                          : "text-stone-700"
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className={`w-full py-4 rounded-2xl font-semibold text-lg mt-6 transition-all flex items-center justify-center gap-2 ${
                selectedOption !== null
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg active:scale-95"
                  : "bg-stone-200 text-stone-400"
              }`}
            >
              {currentQ < questions.length - 1 ? "下一題" : "完成問卷"}{" "}
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* ========== 相機頁（真實相機） ========== */}
        {page === "camera" && (
          <motion.div
            key="camera"
            variants={pv}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col px-6 pt-6 pb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-800">📷 舌象拍攝</h2>
              <button
                onClick={() => startAnalyzing(null)}
                className="text-sm text-stone-500 underline"
              >
                跳過此步
              </button>
            </div>

            {/* 相機錯誤 */}
            {cameraError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-12 h-12 text-stone-400 mb-4" />
                <p className="text-stone-600 mb-2 font-medium">相機無法使用</p>
                <p className="text-sm text-stone-500 mb-6">{cameraError}</p>
                <button
                  onClick={() => startAnalyzing(null)}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                >
                  跳過拍攝，直接分析
                </button>
              </div>
            ) : !tonguePhoto ? (
              /* 取景畫面 */
              <>
                <p className="text-sm text-stone-600 mb-4 leading-relaxed">
                  請在自然光下，自然伸出舌頭並拍攝。AI 將結合舌象進行更精準的分析。
                </p>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-64 h-80 rounded-3xl overflow-hidden relative bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="mirror w-full h-full object-cover"
                    />
                    {/* 引導框 */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-28 border-2 border-dashed border-amber-400 rounded-full opacity-60" />
                    </div>
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                        <p className="text-white text-sm">啟動相機中...</p>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <p className="text-amber-300 text-xs bg-black bg-opacity-50 inline-block px-3 py-1 rounded-full">
                        將舌頭對準虛線框
                      </p>
                    </div>
                    {/* 四角取景框 */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
                    <div className="absolute bottom-10 left-4 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
                    <div className="absolute bottom-10 right-4 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
                  </div>

                  <div className="mt-4 w-full max-w-xs bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-xs text-amber-700 leading-relaxed">
                      💡 在自然光下拍攝 · 拍照前勿食用有色食物 · 自然伸出舌頭
                    </p>
                  </div>
                </div>

                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 mt-6 transition-all ${
                    cameraReady
                      ? "bg-stone-800 text-white active:scale-95"
                      : "bg-stone-300 text-stone-500"
                  }`}
                >
                  <Camera className="w-5 h-5" /> 拍攝舌象
                </button>
              </>
            ) : (
              /* 拍攝完成，預覽 */
              <>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-64 h-80 rounded-3xl overflow-hidden relative">
                    <img
                      src={tonguePhoto}
                      alt="舌象照片"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> 拍攝成功
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 bg-stone-200 text-stone-700 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <RefreshCw className="w-4 h-4" /> 重拍
                  </button>
                  <button
                    onClick={() => startAnalyzing(tonguePhoto)}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    開始分析 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ========== 分析中 ========== */}
        {page === "analyzing" && (
          <motion.div
            key="analyzing"
            variants={pv}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            {apiError ? (
              <div className="text-center">
                <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-lg font-bold text-stone-800 mb-2">分析失敗</p>
                <p className="text-sm text-stone-500 mb-6">{apiError}</p>
                <button
                  onClick={restart}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                >
                  重新開始
                </button>
              </div>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="text-6xl mb-8"
                >
                  🍵
                </motion.div>
                <h2 className="text-xl font-bold text-stone-800 mb-2">
                  AI 正在分析你的體質...
                </h2>
                <p className="text-sm text-stone-500 mb-8 text-center">
                  結合問卷數據
                  {tonguePhoto ? "與舌象影像" : ""}
                  進行綜合分析
                </p>
                <div className="w-full max-w-xs">
                  <div className="h-3 bg-stone-200 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500 rounded-full transition-all duration-200"
                      style={{ width: `${analyzeProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>
                      {analyzeProgress < 30
                        ? "📋 分析問卷數據..."
                        : analyzeProgress < 60
                        ? tonguePhoto
                          ? "📷 解讀舌象特徵..."
                          : "🔍 比對體質模型..."
                        : analyzeProgress < 90
                        ? "🍃 配對養生茶方..."
                        : "✅ 生成報告中..."}
                    </span>
                    <span>{analyzeProgress}%</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ========== 結果頁 ========== */}
        {page === "result" && result && (
          <motion.div
            key="result"
            variants={pv}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-gradient-to-br from-amber-700 via-amber-600 to-emerald-700 text-white px-6 pt-8 pb-12 rounded-b-3xl">
              <div className="text-center">
                <p className="text-amber-200 text-sm mb-1">你的體質分析報告</p>
                <div className="text-5xl my-3">{result.primary.emoji}</div>
                <h1 className="text-2xl font-bold">{result.primary.name}</h1>
                <p className="text-amber-200 text-sm mt-1">
                  {result.primary.tagline}
                </p>
              </div>
            </div>

            <div className="px-6 -mt-6 pb-8 space-y-4">
              {/* 體質特徵 */}
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-600" /> 體質特徵
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed mb-3">
                  {result.primary.description}
                </p>
                {result.has_tongue_image && (
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-xs text-stone-500">
                      <span className="font-semibold">👅 舌象參考：</span>
                      {result.primary.tongueNote}
                    </p>
                  </div>
                )}
                {result.secondary && (
                  <div className="mt-3 p-3 rounded-lg border bg-amber-50 border-amber-200">
                    <p className="text-xs font-medium text-amber-800">
                      兼有 {result.secondary.emoji} {result.secondary.name}（
                      {result.secondary.tagline}）傾向
                    </p>
                  </div>
                )}
              </div>

              {/* 推薦茶方 */}
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600" /> 推薦養生茶方
                </h3>
                <div className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="font-bold text-amber-800 text-lg mb-3">
                    🍵 {result.primary.tea.name}
                  </h4>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-stone-500 mb-2">
                      材料
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.primary.tea.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="bg-white px-2 py-1 rounded-lg text-xs text-stone-700 border border-stone-200"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-stone-500 mb-1">
                      沖泡方式
                    </p>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      {result.primary.tea.method}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-500 mb-1">
                      功效
                    </p>
                    <p className="text-sm text-emerald-700 font-medium">
                      {result.primary.tea.effect}
                    </p>
                  </div>
                </div>
              </div>

              {/* 養生建議 */}
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" /> 日常養生建議
                </h3>
                <div className="space-y-2">
                  {result.primary.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">✦</span>
                      <p className="text-sm text-stone-600">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 免責聲明 */}
              <div className="flex items-start gap-2 bg-stone-100 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-stone-400 leading-relaxed">
                  本分析結果僅供養生參考，不構成醫療診斷。如有身體不適，請諮詢專業中醫師或醫生。
                </p>
              </div>

              {/* 操作按鈕 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={restart}
                  className="flex-1 bg-stone-200 text-stone-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <RefreshCw className="w-4 h-4" /> 重新測試
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "我的體質分析結果",
                        text: `我是${result.primary.name}（${result.primary.tagline}），推薦茶方：${result.primary.tea.name}`,
                        url: window.location.href,
                      });
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Share2 className="w-4 h-4" /> 分享結果
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}