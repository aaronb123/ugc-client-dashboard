"use client";

import { useEffect, useState } from "react";

interface Script {
  id: string;
  title: string;
  url: string | null;
  createdTime: string;
}

export default function Dashboard() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScripts() {
      try {
        const res = await fetch("/api/scripts");
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setScripts(data.scripts);
        }
      } catch (err) {
        setError("Failed to load scripts");
      } finally {
        setLoading(false);
      }
    }

    fetchScripts();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">UGC Scripts</h1>
          <p className="text-gray-600 mt-2">
            All scripts for your campaign
          </p>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && scripts.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No scripts found
          </div>
        )}

        {!loading && !error && scripts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {scripts.map((script) => (
              <div
                key={script.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {script.title}
                  </h3>
                </div>
                {script.url ? (
                  <a
                    href={script.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    View Doc
                  </a>
                ) : (
                  <span className="ml-4 text-gray-400 text-sm">No link</span>
                )}
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-400">
          {scripts.length} script{scripts.length !== 1 ? "s" : ""}
        </footer>
      </div>
    </main>
  );
}
