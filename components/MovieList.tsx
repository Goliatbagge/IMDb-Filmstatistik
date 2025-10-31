import React, { useState, useMemo, useEffect } from 'react';
import { IMDbEntry } from '../types';

interface MovieListProps {
  movies: IMDbEntry[];
  availableColumns: string[];
}

type SortOption = 'rating_desc' | 'rating_asc' | 'title_asc' | 'title_desc' | 'original_title_asc' | 'original_title_desc' | 'year_desc' | 'year_asc' | 'rated_date_desc' | 'rated_date_asc';

const genreTranslations: { [key: string]: string } = {
    'Action': 'Action',
    'Adventure': 'Äventyr',
    'Animation': 'Animerat',
    'Biography': 'Biografi',
    'Comedy': 'Komedi',
    'Crime': 'Kriminal',
    'Documentary': 'Dokumentär',
    'Drama': 'Drama',
    'Family': 'Familj',
    'Fantasy': 'Fantasy',
    'Film-Noir': 'Film-Noir',
    'History': 'Historia',
    'Horror': 'Skräck',
    'Music': 'Musik',
    'Musical': 'Musikal',
    'Mystery': 'Mysterium',
    'Romance': 'Romantik',
    'Sci-Fi': 'Sci-Fi',
    'Short': 'Kortfilm',
    'Sport': 'Sport',
    'Thriller': 'Thriller',
    'War': 'Krig',
    'Western': 'Västern'
};

const MovieList: React.FC<MovieListProps> = ({ movies, availableColumns }) => {
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedRatings, setSelectedRatings] = useState<Set<string>>(new Set());
  const [yearRange, setYearRange] = useState({ min: '', max: '' });
  const [directorSearchTerm, setDirectorSearchTerm] = useState('');
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rating_desc');
  
  const hasGenres = useMemo(() => availableColumns.includes('Genres'), [availableColumns]);
  const hasOriginalTitle = useMemo(() => availableColumns.includes('Original Title'), [availableColumns]);
  const hasDateRated = useMemo(() => availableColumns.includes('Date Rated'), [availableColumns]);
  const hasDirectors = useMemo(() => availableColumns.includes('Directors'), [availableColumns]);
  const hasCast = useMemo(() => availableColumns.includes('Cast'), [availableColumns]);

  const { allGenres, minYear, maxYear } = useMemo(() => {
    if (!hasGenres) return { allGenres: [], minYear: Infinity, maxYear: -Infinity };
    const genreSet = new Set<string>();
    let min = Infinity;
    let max = -Infinity;
    movies.forEach(movie => {
      const year = parseInt(movie.Year, 10);
      if (!isNaN(year)) {
        if (year < min) min = year;
        if (year > max) max = year;
      }
      const genres = movie.Genres?.split(', ').map(g => g.trim()).filter(g => g).map(g => genreTranslations[g] || g) || [];
      genres.forEach(genre => genreSet.add(genre));
    });
    const sortedGenres = Array.from(genreSet).sort();
    return { allGenres: sortedGenres, minYear: min, maxYear: max };
  }, [movies, hasGenres]);

  useEffect(() => {
    if (minYear !== Infinity && maxYear !== -Infinity) {
      setYearRange({ min: String(minYear), max: String(maxYear) });
    }
  }, [minYear, maxYear]);

  const handleGenreChange = (genre: string) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) {
        newSet.delete(genre);
      } else {
        newSet.add(genre);
      }
      return newSet;
    });
  };

  const handleRatingChange = (rating: string) => {
    setSelectedRatings(prev => {
        const newSet = new Set(prev);
        if (newSet.has(rating)) {
            newSet.delete(rating);
        } else {
            newSet.add(rating);
        }
        return newSet;
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setYearRange(prev => ({ ...prev, [name]: value }));
  };

  const filteredMovies = useMemo(() => {
    const min = parseInt(yearRange.min, 10) || minYear;
    const max = parseInt(yearRange.max, 10) || maxYear;
    const directorSearch = directorSearchTerm.trim().toLowerCase();

    const filtered = movies.filter(movie => {
        // Year filter
        const movieYear = parseInt(movie.Year, 10);
        if (isNaN(movieYear) || movieYear < min || movieYear > max) {
            return false;
        }

        // Genre filter
        if (hasGenres && selectedGenres.size > 0) {
            const movieGenres = new Set(movie.Genres?.split(', ').map(g => g.trim()).map(g => genreTranslations[g] || g) || []);
            if (!Array.from(selectedGenres).every(selectedGenre => movieGenres.has(selectedGenre))) {
                return false;
            }
        }

        // Rating filter
        if (selectedRatings.size > 0) {
            if (!selectedRatings.has(movie['Your Rating'])) {
                return false;
            }
        }

        // Director filter
        if (hasDirectors && directorSearch) {
            const directors = movie['Directors']?.toLowerCase() || '';
            if (!directors.includes(directorSearch)) {
                return false;
            }
        }

        return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating_asc':
            return parseInt(a['Your Rating'], 10) - parseInt(b['Your Rating'], 10);
        case 'title_asc':
          return a.Title.localeCompare(b.Title);
        case 'title_desc':
            return b.Title.localeCompare(a.Title);
        case 'original_title_asc': {
            if (!hasOriginalTitle) return 0;
            const titleA = a['Original Title'] || a.Title;
            const titleB = b['Original Title'] || b.Title;
            return titleA.localeCompare(titleB);
        }
        case 'original_title_desc': {
            if (!hasOriginalTitle) return 0;
            const titleA = a['Original Title'] || a.Title;
            const titleB = b['Original Title'] || b.Title;
            return titleB.localeCompare(titleA);
        }
        case 'year_desc':
          return parseInt(b.Year, 10) - parseInt(a.Year, 10);
        case 'year_asc':
          return parseInt(a.Year, 10) - parseInt(b.Year, 10);
        case 'rated_date_desc':
            if (!hasDateRated) return 0;
            return new Date(b['Date Rated']).getTime() - new Date(a['Date Rated']).getTime();
        case 'rated_date_asc':
            if (!hasDateRated) return 0;
            return new Date(a['Date Rated']).getTime() - new Date(b['Date Rated']).getTime();
        case 'rating_desc':
        default:
          const ratingA = parseInt(a['Your Rating'], 10);
          const ratingB = parseInt(b['Your Rating'], 10);
          return ratingB - ratingA;
      }
    });
  }, [movies, selectedGenres, selectedRatings, yearRange, directorSearchTerm, minYear, maxYear, sortBy, hasGenres, hasOriginalTitle, hasDateRated, hasDirectors]);
  
  const displayedGenres = showAllGenres ? allGenres : allGenres.slice(0, 10);

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-sky-400 mb-6">Alla Betygsatta Filmer</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 p-4 bg-slate-900/50 rounded-lg">
        {/* Genre Filter */}
        {hasGenres && (
            <div className="md:col-span-2 lg:col-span-4">
            <h3 className="font-semibold text-slate-300 mb-2">Filtrera på genre</h3>
            <div className="flex flex-wrap gap-2">
                {displayedGenres.map(genre => (
                <label key={genre} className="flex items-center space-x-2 cursor-pointer bg-slate-700 px-3 py-1 rounded-full text-sm hover:bg-slate-600 transition-colors">
                    <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500"
                    checked={selectedGenres.has(genre)}
                    onChange={() => handleGenreChange(genre)}
                    />
                    <span className="text-slate-300">{genre}</span>
                </label>
                ))}
            </div>
            {allGenres.length > 10 && (
                <button
                onClick={() => setShowAllGenres(!showAllGenres)}
                className="text-sky-400 hover:text-sky-300 text-sm mt-2"
                >
                {showAllGenres ? 'Visa färre' : `Visa alla ${allGenres.length} genrer`}
                </button>
            )}
            </div>
        )}
        
        {/* Year Filter */}
        <div>
          <h3 className="font-semibold text-slate-300 mb-2">Filtrera på årtal</h3>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              name="min"
              value={yearRange.min}
              onChange={handleYearChange}
              placeholder={String(minYear)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              name="max"
              value={yearRange.max}
              onChange={handleYearChange}
              placeholder={String(maxYear)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200"
            />
          </div>
        </div>

        {/* Rating Filter */}
        <div>
            <h3 className="font-semibold text-slate-300 mb-2">Filtrera på betyg</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'].map(rating => (
                    <label key={rating} className="flex items-center space-x-1 cursor-pointer">
                        <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500"
                            checked={selectedRatings.has(rating)}
                            onChange={() => handleRatingChange(rating)}
                        />
                        <span className="text-slate-300">{rating}</span>
                    </label>
                ))}
            </div>
        </div>
        
        {/* Director Filter */}
        {hasDirectors && (
            <div>
            <h3 className="font-semibold text-slate-300 mb-2">Filtrera regissör</h3>
            <input
                type="text"
                value={directorSearchTerm}
                onChange={(e) => setDirectorSearchTerm(e.target.value)}
                placeholder="Sök regissör..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200"
                aria-label="Filtrera regissör"
            />
            </div>
        )}

        {/* Sorting */}
        <div>
            <h3 className="font-semibold text-slate-300 mb-2">Sortera efter</h3>
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200"
                aria-label="Sortera filmer"
            >
                <option value="rating_desc">Betyg (fallande)</option>
                <option value="rating_asc">Betyg (stigande)</option>
                <option value="title_asc">Titel (A-Ö)</option>
                <option value="title_desc">Titel (Ö-A)</option>
                {hasOriginalTitle && <option value="original_title_asc">Originaltitel (A-Ö)</option>}
                {hasOriginalTitle && <option value="original_title_desc">Originaltitel (Ö-A)</option>}
                <option value="year_desc">Årtal (nyast först)</option>
                <option value="year_asc">Årtal (äldst först)</option>
                {hasDateRated && <option value="rated_date_desc">Datum betygsatt (nyast först)</option>}
                {hasDateRated && <option value="rated_date_asc">Datum betygsatt (äldst först)</option>}
            </select>
        </div>
      </div>

      {/* Movie List */}
      <p className="text-slate-400 mb-4">{filteredMovies.length} filmer matchar ditt filter.</p>
      <ul className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {filteredMovies.map(movie => (
          <li key={movie.Const} className="p-3 bg-slate-700/50 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex-grow">
              <a
                href={movie.URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-lg text-slate-100 hover:text-sky-400 transition-colors"
              >
                {movie.Title}
              </a>
              <p className="text-sm text-slate-400 mt-1">{movie.Year} {hasGenres && movie.Genres && `• ${movie.Genres.split(', ').map(g => genreTranslations[g.trim()] || g.trim()).join(', ')}`}</p>
              {hasDirectors && movie['Directors'] && <p className="text-xs text-slate-400 mt-1"><span className="font-semibold text-slate-300">Regi:</span> {movie['Directors']}</p>}
              {hasCast && movie['Cast'] && <p className="text-xs text-slate-400 mt-1"><span className="font-semibold text-slate-300">Medverkande:</span> {movie['Cast']}</p>}
              {hasDateRated && movie['Date Rated'] && <p className="text-xs text-slate-500 mt-1">Betygsatt: {movie['Date Rated']}</p>}
            </div>
            <div className="flex-shrink-0 flex items-center space-x-2 text-xl font-bold text-sky-400 self-end sm:self-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{movie['Your Rating']}</span>
            </div>
          </li>
        ))}
         {filteredMovies.length === 0 && (
            <div className="text-center text-slate-400 py-8">
                <p>Inga filmer matchade ditt filter.</p>
            </div>
         )}
      </ul>
    </div>
  );
};

export default MovieList;