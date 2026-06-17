import { categories } from "./data/drills";
import NavBar from "./components/NavBar";
import CategorySection from "./components/CategorySection";

export default function Home() {
  const totalDrills = categories.reduce((sum, c) => sum + c.drills.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏀</span>
            <h1 className="text-3xl font-black tracking-tight">ミニバスケ 練習メニュー</h1>
          </div>
          <p className="text-orange-100 text-sm ml-14">
            全{totalDrills}メニュー ・ 動画つきで分かりやすく解説
          </p>
          <div className="mt-4 ml-14 flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full"
              >
                {cat.emoji} {cat.label} {cat.drills.length}種
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <NavBar categories={categories} />

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {categories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}

        <footer className="text-center text-xs text-gray-400 pb-4 pt-8 border-t border-gray-200">
          <p>練習の際は必ず準備運動を行い、安全に取り組みましょう。</p>
          <p className="mt-1">動画は YouTube より埋め込みで提供されています。</p>
        </footer>
      </main>
    </div>
  );
}
