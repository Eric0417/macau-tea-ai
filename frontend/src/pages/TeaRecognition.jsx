import { useState } from "react";

function TeaRecognition() {
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
      const res = await fetch("/api/recognize", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "辨識失敗");
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-green-800 mb-2">🍵 茶飲辨識</h1>
      <p className="text-gray-500 mb-8">上傳茶飲圖片，AI 為您辨識茶種</p>

      {/* 上傳區 */}
      {!result && (
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 transition">
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            {preview ? (
              <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <div>
                <div className="text-5xl mb-3">📷</div>
                <p className="text-gray-500">點擊或拖放圖片到此處</p>
                <p className="text-gray-400 text-sm mt-1">支援 JPG、PNG、WebP（最大 10MB）</p>
              </div>
            )}
          </label>

          {file && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {loading ? "辨識中..." : "開始辨識"}
              </button>
              <button onClick={reset} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
                清除
              </button>
            </div>
          )}
          {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {/* 結果 */}
      {result && (
        <div className="space-y-6">
          {/* 主要結果 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏆</span>
              <h2 className="text-2xl font-bold text-green-800">{result.tea.name}</h2>
              <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                {Math.round(result.top_results[0].confidence * 100)}% 匹配
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">類型</p>
                <p className="font-medium text-gray-800">{result.tea.type}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">產地</p>
                <p className="font-medium text-gray-800">{result.tea.origin}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-3">{result.tea.description}</p>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-700">🍃 口感：</span>{result.tea.taste}</p>
              <p><span className="font-medium text-gray-700">🫖 沖泡：</span>{result.tea.brewing}</p>
              <p><span className="font-medium text-gray-700">💪 功效：</span>{result.tea.benefits}</p>
              <p><span className="font-medium text-gray-700">🏛️ 澳門文化：</span>{result.tea.macau_culture}</p>
            </div>
          </div>

          {/* 候選結果 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-bold text-gray-700 mb-3">其他可能</h3>
            <div className="space-y-2">
              {result.top_results.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-6">{i + 1}.</span>
                  <span className="flex-1 font-medium">{r.name}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${r.confidence * 100}%`, backgroundColor: i === 0 ? "#16a34a" : "#9ca3af" }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">{Math.round(r.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={reset} className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition">
            再辨識一張
          </button>
        </div>
      )}
    </div>
  );
}

export default TeaRecognition;