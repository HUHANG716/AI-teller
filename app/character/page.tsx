import CharacterForm from '@/components/character-form';

export default function CharacterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            创建你的角色
          </h1>
          <p className="text-gray-400 text-lg">
            选择一个故事世界，塑造你独特的主角
          </p>
        </div>

        <CharacterForm />
      </div>
    </main>
  );
}

