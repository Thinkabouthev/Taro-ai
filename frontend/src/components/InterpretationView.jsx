import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';

export default function InterpretationView({
  interpretation,
  createdAt,
  isMock,
  isLoading,
  onNewReading,
  onShowToast,
  errorMessage,
  onRetry
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!interpretation) return;
    navigator.clipboard.writeText(interpretation);
    setCopied(true);
    if (onShowToast) {
      onShowToast({ message: 'Interpretation copied to clipboard', type: 'success' });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-[#fbfbfb] border border-gray-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base text-gray-900">
            AI interpretation
          </h2>
          <span className="text-xs text-gray-400 font-normal">
            {isMock ? 'via Oracle' : 'via Claude'}
          </span>
        </div>

        {/* Error State */}
        {errorMessage ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl my-3">
            <div className="flex items-center gap-2 text-red-700 text-sm font-semibold mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to generate interpretation</span>
            </div>
            <p className="text-xs text-red-600 mb-3">{errorMessage}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : isLoading ? (
          /* Loading Skeleton State */
          <div className="space-y-3 py-2">
            <div className="h-2.5 bg-gray-200 rounded-full w-full animate-pulse" />
            <div className="h-2.5 bg-gray-200 rounded-full w-11/12 animate-pulse" />
            <div className="h-2.5 bg-gray-200 rounded-full w-4/5 animate-pulse" />
            <div className="h-2.5 bg-gray-200 rounded-full w-full animate-pulse mt-4" />
            <div className="h-2.5 bg-gray-200 rounded-full w-9/12 animate-pulse" />
            <p className="text-xs text-gray-400 mt-4">
              [3–5 sentences, Markdown · loads in &lt;10 s]
            </p>
          </div>
        ) : interpretation ? (
          /* Interpreted Content */
          <div>
            <div className="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold">
              <ReactMarkdown>{interpretation}</ReactMarkdown>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              [3–5 sentences, Markdown · loads in &lt;10 s]
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="h-2.5 bg-gray-200 rounded-full w-full" />
            <div className="h-2.5 bg-gray-200 rounded-full w-11/12" />
            <div className="h-2.5 bg-gray-200 rounded-full w-4/5" />
            <div className="h-2.5 bg-gray-200 rounded-full w-full mt-4" />
            <div className="h-2.5 bg-gray-200 rounded-full w-9/12" />
            <p className="text-xs text-gray-400 mt-4">
              [3–5 sentences, Markdown · loads in &lt;10 s]
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons & Note */}
      <div className="mt-8 pt-6 border-t border-gray-200/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!interpretation || isLoading}
            className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-800 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          {onNewReading && (
            <button
              type="button"
              onClick={onNewReading}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-medium rounded-xl text-center transition-colors cursor-pointer"
            >
              New reading
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">
          Saved to History automatically
        </p>
      </div>
    </div>
  );
}
