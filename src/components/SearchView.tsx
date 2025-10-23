"use client";

export default function SearchView({ searchTerm, setSearchTerm, threads }: any) {
  return (
    <div className="text-gray-600">
      <h2 className="text-xl font-semibold text-purple-700">Search Workspace</h2>
      <input
        type="text"
        placeholder="Search threads..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mt-4 w-full rounded-md border px-3 py-2"
      />
      {searchTerm && (
        <ul className="mt-4 space-y-2">
          {threads.map((t: any) => (
            <li key={t.id} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
              <p className="text-sm font-medium text-purple-700">
                {t.client} – {t.format}
              </p>
              <p className="text-xs text-gray-500">{t.hook}</p>
            </li>
          ))}
          {threads.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">No results found.</p>
          )}
        </ul>
      )}
    </div>
  );
}
