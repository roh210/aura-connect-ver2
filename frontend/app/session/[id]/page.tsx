export default function SessionPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-white">
          💬 Active Session
        </h1>
        <p className="text-gray-400">Session ID: {params.id}</p>
      </div>
    </main>
  );
}
