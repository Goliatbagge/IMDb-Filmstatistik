import React, { useEffect, useMemo, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { IMDbEntry } from '../types';

interface MovieDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: string;
  movies: IMDbEntry[];
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({ isOpen, onClose, year, movies }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sortedMovies = useMemo(() => {
    return movies
      .filter(movie => movie.Year === year)
      .filter(movie =>
        movie.Title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const ratingA = parseInt(a['Your Rating'], 10);
        const ratingB = parseInt(b['Your Rating'], 10);
        return ratingB - ratingA;
      });
  }, [movies, year, searchTerm]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-600">
          <h2 id="modal-title" className="text-2xl font-bold text-sky-400">
            Filmer betygsatta år {year}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Stäng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Sök efter titel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200"
              aria-label="Filtrera filmer efter titel"
            />
          </div>
          {sortedMovies.length > 0 ? (
            <ul className="space-y-4">
              {sortedMovies.map(movie => (
                <li key={movie.Const} className="p-3 bg-slate-700/50 rounded-md flex justify-between items-center">
                  <div>
                    <a
                      href={movie.URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-100 hover:text-sky-400 transition-colors"
                    >
                      {movie.Title}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 text-lg font-bold text-sky-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{movie['Your Rating']}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-center">Inga filmer matchade din sökning.</p>
          )}
        </main>
      </div>
    </div>,
    document.body
  );
};

export default MovieDetailsModal;
