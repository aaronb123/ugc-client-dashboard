"use client";

import { useEffect, useState } from "react";

interface Script {
  id: string;
  title: string;
  url: string | null;
  batch: string;
}

interface BatchGroup {
  batch: string;
  scripts: Script[];
  expanded: boolean;
  showCount: number;
}

export default function Dashboard() {
  const [batches, setBatches] = useState<BatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchScripts() {
      try {
        const res = await fetch("/api/scripts");
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          // Group scripts by batch
          const grouped: { [key: string]: Script[] } = {};
          for (const script of data.scripts) {
            const batch = script.batch || "No Batch";
            if (!grouped[batch]) {
              grouped[batch] = [];
            }
            grouped[batch].push(script);
          }

          // Sort batches (Batch 10, Batch 9, etc. - newest first)
          const sortedBatches = Object.keys(grouped).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, "")) || 0;
            const numB = parseInt(b.replace(/\D/g, "")) || 0;
            return numB - numA;
          });

          const batchGroups: BatchGroup[] = sortedBatches.map((batch) => ({
            batch,
            scripts: grouped[batch],
            expanded: true, // First batch expanded by default
            showCount: 10, // Show 10 initially
          }));

          setBatches(batchGroups);
          setTotalCount(data.scripts.length);
        }
      } catch (err) {
        setError("Failed to load scripts");
      } finally {
        setLoading(false);
      }
    }

    fetchScripts();
  }, []);

  const toggleBatch = (index: number) => {
    setBatches((prev) =>
      prev.map((b, i) =>
        i === index ? { ...b, expanded: !b.expanded } : b
      )
    );
  };

  const showMore = (index: number) => {
    setBatches((prev) =>
      prev.map((b, i) =>
        i === index ? { ...b, showCount: b.showCount + 10 } : b
      )
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">UGC Scripts</h1>
          <p className="text-gray-600 mt-2">
            Primal Queen campaign scripts
          </p>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Loading scripts...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && batches.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No scripts found
          </div>
        )}

        {!loading && !error && batches.length > 0 && (
          <div className="space-y-6">
            {batches.map((batchGroup, index) => (
              <div
                key={batchGroup.batch}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Batch Header */}
                <button
                  onClick={() => toggleBatch(index)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">
                      {batchGroup.batch}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {batchGroup.scripts.length} scripts
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      batchGroup.expanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Scripts List */}
                {batchGroup.expanded && (
                  <div className="divide-y divide-gray-100">
                    {batchGroup.scripts
                      .slice(0, batchGroup.showCount)
                      .map((script) => (
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
                              View
                            </a>
                          ) : (
                            <span className="ml-4 text-gray-400 text-sm">
                              No link
                            </span>
                          )}
                        </div>
                      ))}

                    {/* Show More Button */}
                    {batchGroup.scripts.length > batchGroup.showCount && (
                      <div className="p-4 text-center bg-gray-50">
                        <button
                          onClick={() => showMore(index)}
                          className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Show more ({batchGroup.scripts.length - batchGroup.showCount} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-400">
          {totalCount} total scripts
        </footer>
      </div>
    </main>
  );
}
