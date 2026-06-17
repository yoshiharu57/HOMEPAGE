import { CategoryData } from "../data/drills";
import DrillCard from "./DrillCard";

interface CategorySectionProps {
  category: CategoryData;
}

export default function CategorySection({ category }: CategorySectionProps) {
  return (
    <section id={category.id} className="scroll-mt-20">
      <div className={`flex items-center gap-3 mb-4 pb-2 border-b-2 ${category.borderColor}`}>
        <span className="text-3xl">{category.emoji}</span>
        <h2 className={`text-2xl font-black ${category.color}`}>{category.label}</h2>
        <span className="ml-auto text-sm text-gray-400">{category.drills.length}メニュー</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {category.drills.map((drill) => (
          <DrillCard key={drill.id} drill={drill} category={category} />
        ))}
      </div>
    </section>
  );
}
