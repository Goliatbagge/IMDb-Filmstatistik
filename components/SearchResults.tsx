import React from 'react';
import { IMDbEntry } from '../types';

interface SearchResultsProps {
  results: IMDbEntry[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="text-center text-slate-400 mt-8 max-w-2xl mx-auto">
        <p>Inga filmer matchade din sökning.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-sky-400 mb-4">Sökresultat</h2>
        <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {results.map(movie => (
                <li key={movie.Const} className="p-3 bg-slate-700/50 rounded-md flex justify-between items-center gap-4">
                    <div className="flex-grow">
                        <a
                            href={movie.URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-slate-100 hover:text-sky-400 transition-colors"
                        >
                            {movie.Title}
                        </a>
                        <p className="text-sm text-slate-400">{movie.Year}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2 text-lg font-bold text-sky-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{movie['Your Rating']}</span>
                    </div>
                </li>
            ))}
        </ul>
    </div>
  );
};

export default SearchResults;
