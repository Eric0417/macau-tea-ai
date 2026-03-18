import { useState } from "react";

function TongueDiagnosis() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tongue-diagnosis", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "分析失敗");
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const scoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const riskColor = (level) => {
    if (level === "低") return "bg-green-100 text-green-700";
    if (level === "中") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-rose-700 mb-2">👅 舌苔識別</h1>
      <p className="text-gray-500 mb-8">拍攝舌頭照片，AI 結合中醫舌診為您分析體質</p>

      {/* 上傳區 */}
      {!result && (
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          {/* 拍攝指南 */}
          <div className="bg-rose-50 rounded-xl p-4 mb-4">
            <h3 className="font-medium text-rose-700 mb-2">📸 拍攝指南</h3>
            <div className="text-sm text-rose-600 space-y-1">
              <p>• 自然光下拍攝，避免燈光色偏</p>
              <p>• 張大嘴巴，舌頭自然伸出</p>
              <p>• 拍攝前不要進食、喝有色飲料或刷舌苔</p>
            </div>
          </div>

          <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-rose-400 transition">
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            {preview ? (
              <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <div>
                <div className="text-5xl mb-3">📷</div>
                <p className="text-gray-500">點擊上傳舌頭照片</p>
                <p className="text-gray-400 text-sm mt-1">支援 JPG、PNG、WebP（最大 10MB）</p>
              </div>
            )}
          </label>

          {file && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 disabled:bg-gray-400 transition"
              >
                {loading ? "分析中，請稍候..." : "開始舌苔分析"}
              </button>
              <button onClick={reset} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
                清除
              </button>
            </div>
          )}
          {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {/* 分析結果 */}
      {result && (
        <div className="space-y-6">

          {/* 總覽 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">體質分析結果</h2>
                <p className="text-gray-400 text-sm">AI 置信度 {Math.round(result.confidence * 100)}%</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskColor(result.risk_level)}`}>
                風險等級：{result.risk_level}
              </span>
            </div>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${scoreColor(result.health_score)}`}>{result.health_score}</div>
                <p className="text-sm text-gray-400 mt-1">健康分數</p>
              </div>
              <div className="flex-1">
                <div className="bg-rose-100 text-rose-700 px-4 py-3 rounded-xl text-lg font-bold text-center">
                  {result.constitution}
                </div>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">{result.analysis}</p>
          </div>

          {/* 舌象詳情 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-bold text-gray-700 mb-4">🔍 舌象分析詳情</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-2">舌質（舌體）</h4>
                <div className="text-sm space-y-1 text-gray-600">
                  <p><span className="text-gray-400">顏色：</span>{result.tongue_body.color}</p>
                  <p><span className="text-gray-400">形態：</span>{result.tongue_body.shape}</p>
                  <p><span className="text-gray-400">質地：</span>{result.tongue_body.texture}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-2">舌苔</h4>
                <div className="text-sm space-y-1 text-gray-600">
                  <p><span className="text-gray-400">顏色：</span>{result.coating.color}</p>
                  <p><span className="text-gray-400">厚薄：</span>{result.coating.thickness}</p>
                  <p><span className="text-gray-400">潤燥：</span>{result.coating.moisture}</p>
                  <p><span className="text-gray-400">分布：</span>{result.coating.distribution}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 養生建議 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-bold text-gray-700 mb-4">💡 養生建議</h3>
            <div className="space-y-2">
              {result.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-gray-600">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 推薦茶飲 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-bold text-gray-700 mb-4">🍵 推薦茶飲</h3>
            <div className="flex gap-3 mb-3">
              {result.recommended_teas.map((tea, i) => (
                <span key={i} className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
                  {tea}
                </span>
              ))}
            </div>
            <p className="text-gray-600 text-sm">{result.tea_reason}</p>
          </div>

          {/* 免責聲明 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
            ⚠️ 本分析結果僅供參考，不能替代專業醫療診斷。如有健康疑慮，請諮詢專業中醫師或醫生。
          </div>

          <button onClick={reset} className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition">
            再分析一次
          </button>
        </div>
      )}
    </div>
  );
}

export default TongueDiagnosis;