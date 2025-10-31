import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import MovieChart from './components/MovieChart';
import MovieDetailsModal from './components/MovieDetailsModal';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import MovieList from './components/MovieList';
import { IMDbEntry, ChartDataPoint } from './types';

// A more robust CSV parser
const parseCSV = (text: string): IMDbEntry[] => {
    let content = text.trim();
    // Handle Byte Order Mark (BOM)
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.substring(1);
    }

    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    
    // Auto-detect delimiter (comma or semicolon)
    const delimiter = headerLine.split(',').length >= headerLine.split(';').length ? ',' : ';';
    const regex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);

    const header = headerLine.split(regex).map(h => h.trim().replace(/^"|"$/g, ''));
    const result: IMDbEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const currentline = line.split(regex);

        if (header.length !== currentline.length) {
            console.warn(`Skipping malformed CSV line (column count mismatch on line ${i + 1}): got ${currentline.length} columns, expected ${header.length}. Line: "${line}"`);
            continue;
        }

        const obj: IMDbEntry = {};
        for (let j = 0; j < header.length; j++) {
            const key = header[j];
            // Trim and remove surrounding quotes from the value
            const value = currentline[j] ? currentline[j].trim().replace(/^"|"$/g, '') : '';
            obj[key] = value;
        }
        result.push(obj);
    }
    return result;
}


const App: React.FC = () => {
    const [allMovies, setAllMovies] = useState<IMDbEntry[]>([]);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<IMDbEntry[]>([]);
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);

    const filterAndProcessMovies = (data: IMDbEntry[]): IMDbEntry[] => {
        return data.filter(entry => {
            const titleType = entry['Title Type'] || entry['TitleType'];
            const yearStr = entry.Year;
            return titleType?.toLowerCase() === 'movie' && yearStr;
        });
    };

    const createChartData = (movies: IMDbEntry[]): ChartDataPoint[] => {
        const yearCounts: { [year: string]: number } = {};
        movies.forEach(movie => {
            const year = parseInt(movie.Year, 10);
            if (!isNaN(year) && year > 1800 && year < 2100) { // Basic validation
              yearCounts[year] = (yearCounts[year] || 0) + 1;
            }
        });

        return Object.entries(yearCounts)
          .map(([year, count]) => ({ year, count }))
          .sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10));
    };

    const handleFileSelect = useCallback((file: File) => {
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Felaktig filtyp. Vänligen ladda upp en CSV-fil.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setChartData([]);
        setAllMovies([]);
        setFileName(file.name);
        setSearchTerm(''); // Clear search on new file upload
        setSearchResults([]);
        setAvailableColumns([]);

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parsedData = parseCSV(text);

                if (parsedData.length === 0) {
                  throw new Error("CSV-filen är tom eller har ett ogiltigt format.");
                }

                const firstRow = parsedData[0];
                const header = Object.keys(firstRow);
                setAvailableColumns(header);

                // New, less strict validation for core functionality
                const REQUIRED_COLUMNS = ['Const', 'Title', 'Year', 'Your Rating', 'URL'];
                const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));
                const hasTitleType = 'Title Type' in firstRow || 'TitleType' in firstRow;

                if (missingColumns.length > 0 || !hasTitleType) {
                    const allMissing = [...missingColumns];
                    if (!hasTitleType) allMissing.push('Title Type');
                    throw new Error(`CSV-filen saknar nödvändiga kolumner för grundfunktionalitet: ${allMissing.join(', ')}. Se till att dessa är med i din IMDb-export.`);
                }
                
                const movies = filterAndProcessMovies(parsedData);
                
                if (movies.length === 0) {
                    throw new Error("Kunde inte hitta några filmer i den angivna filen. Kontrollera att kolumnen 'Title Type' innehåller värdet 'movie'.");
                }
                
                setAllMovies(movies);
                const processedChartData = createChartData(movies);
                setChartData(processedChartData);

            } catch (err: any) {
                setError(err.message || 'Ett fel uppstod vid bearbetning av filen.');
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setError('Det gick inte att läsa filen.');
            setIsLoading(false);
        };

        reader.readAsText(file);
    }, []);

    const handleBarClick = useCallback((data: ChartDataPoint) => {
        if (data && data.year) {
            setSelectedYear(data.year);
            setIsModalOpen(true);
        }
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedYear(null);
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        if (value.trim() === '') {
            setSearchResults([]);
        } else {
            const filteredMovies = allMovies
                .filter(movie => movie.Title.toLowerCase().includes(value.toLowerCase()))
                .sort((a, b) => { // Sort by rating descending
                    const ratingA = parseInt(a['Your Rating'], 10);
                    const ratingB = parseInt(b['Your Rating'], 10);
                    return ratingB - ratingA;
                });
            setSearchResults(filteredMovies);
        }
    }, [allMovies]);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-5xl">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-sky-400">IMDb Filmstatistik</h1>
                    <p className="text-slate-400 mt-2 text-lg">Ladda upp din IMDb-betygsfil (CSV) för att se en visualisering av filmer per år.</p>
                </header>
                
                <main>
                    <SearchBar 
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Sök bland alla filmer..."
                        disabled={allMovies.length === 0 || isLoading}
                    />

                    {searchTerm.trim() === '' ? (
                        <>
                            <FileUpload onFileSelect={handleFileSelect} fileName={fileName} disabled={isLoading} />

                            <div className="mt-8 text-center">
                                {isLoading && (
                                    <div className="flex items-center justify-center space-x-2">
                                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
                                       <span className="text-lg">Bearbetar fil...</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative max-w-2xl mx-auto" role="alert">
                                        <strong className="font-bold">Fel: </strong>
                                        <span className="block sm:inline">{error}</span>
                                    </div>
                                )}

                                {!isLoading && !error && chartData.length > 0 && (
                                    <>
                                        <MovieChart data={chartData} onBarClick={handleBarClick} />
                                        <MovieList movies={allMovies} availableColumns={availableColumns} />
                                    </>
                                )}

                                {!isLoading && !error && chartData.length === 0 && (
                                    <div className="text-center text-slate-500 mt-8 max-w-2xl mx-auto">
                                        <p>Diagrammet kommer att visas här när en giltig CSV-fil har laddats upp och bearbetats.</p>
                                        <p className="mt-2 text-sm">Förväntat format är en CSV-fil exporterad från IMDb med kolumnerna "Year" och "Title Type". Klicka på en stapel för att see filmer från det året.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                       <SearchResults results={searchResults} />
                    )}
                </main>
            </div>
            {isModalOpen && selectedYear && (
                <MovieDetailsModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    year={selectedYear}
                    movies={allMovies}
                />
            )}
        </div>
    );
};

export default App;