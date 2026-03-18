import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* 標題 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-green-800 mb-4">🍵 澳門茶飲 AI 辨識系統</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          結合人工智能與傳統中醫智慧，為您提供茶飲辨識與舌苔健康分析服務
        </p>
      </div>

      {/* 兩個功能卡片 —— 用 grid + gap 杜絕重疊 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* 卡片 1：茶飲辨識 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col">
          <div className="bg-gradient-to-br from-green-500 to-green-700 p-8 text-center">
            <div className="text-6xl mb-4">🍵</div>
            <h2 className="text-2xl font-bold text-white">茶飲辨識</h2>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <p className="text-gray-600 mb-4 flex-1">
              上傳茶飲圖片，AI 自動辨識茶種，提供產地、口感、沖泡方式及澳門茶文化資訊。
              支援普洱、鐵觀音、龍井、菊花、香片、壽眉、水仙等多種茶品。
            </p>
            <ul className="text-sm text-gray-500 mb-6 space-y-1">
              <li>✅ 7 種澳門常見茶飲</li>
              <li>✅ 詳細沖泡指南</li>
              <li>✅ 澳門茶文化故事</li>
            </ul>
            <Link
              to="/tea"
              className="block text-center bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition"
            >
              開始辨識茶飲 →
            </Link>
          </div>
        </div>

        {/* 卡片 2：舌苔識別 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col">
          <div className="bg-gradient-to-br from-rose-400 to-rose-600 p-8 text-center">
            <div className="text-6xl mb-4">👅</div>
            <h2 className="text-2xl font-bold text-white">舌苔識別</h2>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <p className="text-gray-600 mb-4 flex-1">
              拍攝舌頭照片，AI 結合中醫舌診理論，分析您的體質傾向，
              並推薦適合的茶品和養生建議。
            </p>
            <ul className="text-sm text-gray-500 mb-6 space-y-1">
              <li>✅ 6 種體質辨識</li>
              <li>✅ 中醫養生建議</li>
              <li>✅ 個人化茶飲推薦</li>
            </ul>
            <Link
              to="/tongue"
              className="block text-center bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition"
            >
              開始舌苔分析 →
            </Link>
          </div>
        </div>
      </div>

      {/* 底部說明 */}
      <div className="mt-12 text-center text-sm text-gray-400">
        <p>⚠️ 本系統僅供學習參考，不作為醫療診斷依據</p>
      </div>
    </div>
  );
}

export default Home;