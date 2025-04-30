import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Upload, BookOpen } from 'lucide-react';
import _ from 'lodash';
import './BookSearch.css';

export default function BookSearch() {
  const [query, setQuery] = useState('');
  const [apiPage, setApiPage] = useState(1);
  const [uiPage, setUiPage] = useState(1);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalApiPages, setTotalApiPages] = useState(0);
  const [totalUiPages, setTotalUiPages] = useState(0);
  const [error, setError] = useState('');
  const [userBooks, setUserBooks] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  const searchBooks = async (searchQuery, apiPageNum) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&page=${apiPageNum}`);
      if (!response.ok) throw new Error('Failed to fetch books');

      const data = await response.json();

      if (data.docs && data.docs.length > 0) {
        const formattedBooks = data.docs.map(book => ({
          id: book.key,
          title: book.title,
          author: book.author_name ? book.author_name.join(', ') : 'Unknown Author',
          coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
          publishYear: book.first_publish_year || 'Unknown',
          language: book.language ? book.language[0] : 'Unknown'
        }));

        setBooks(formattedBooks);
        setTotalApiPages(Math.ceil(data.numFound / 100));
        setTotalUiPages(Math.ceil(data.numFound / 10));
      } else {
        setBooks([]);
        setTotalApiPages(0);
        setTotalUiPages(0);
        setError('No books found');
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to fetch books. Please try again.');
      setBooks([]);
      setTotalApiPages(0);
      setTotalUiPages(0);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = _.debounce((searchQuery, apiPageNum) => {
    searchBooks(searchQuery, apiPageNum);
  }, 500);

  useEffect(() => {
    if (query.trim()) {
      const newApiPage = Math.floor((uiPage - 1) / 10) + 1;
      setApiPage(newApiPage);
      debouncedSearch(query, newApiPage);
    } else {
      setBooks([]);
      setTotalApiPages(0);
      setTotalUiPages(0);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [query, uiPage]);

  const handleNextPage = () => {
    if (uiPage < totalUiPages) {
      setUiPage(uiPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (uiPage > 1) {
      setUiPage(uiPage - 1);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;

    setUploading(true);

    setTimeout(() => {
      const newBook = {
        id: `user-${Date.now()}`,
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
        author: 'Your Upload',
        coverUrl: null,
        publishYear: new Date().getFullYear(),
        language: 'Unknown',
        isUserUpload: true
      };

      setUserBooks([newBook, ...userBooks]);
      setSelectedFile(null);
      setUploading(false);
    }, 1000);
  };

  const paginatedBooks = books.slice(((uiPage - 1) % 10) * 10, ((uiPage - 1) % 10 + 1) * 10);

  return (
    <div className="book-search-container">
      <div className="tabs">
        <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          <div className="tab-content">
            <Search className="tab-icon" />
            <span>Search Books</span>
          </div>
        </button>
        <button className={`tab ${activeTab === 'uploads' ? 'active' : ''}`} onClick={() => setActiveTab('uploads')}>
          <div className="tab-content">
            <BookOpen className="tab-icon" />
            <span>My Uploads</span>
          </div>
        </button>
      </div>

      {activeTab === 'search' ? (
        <>
          <div className="search-bar-container">
            <div className="search-icon-container">
              <Search className="search-icon" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setUiPage(1);
              }}
              placeholder="Search for books by title, author, or keyword..."
              className="search-input"
            />
          </div>

          <div className="results-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : paginatedBooks.length > 0 ? (
              <div className="book-list">
                {paginatedBooks.map((book) => (
                  <div key={book.id} className="book-card">
                    <div className="book-cover">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={`Cover of ${book.title}`} className="cover-image" />
                      ) : (
                        <BookOpen className="default-cover-icon" />
                      )}
                    </div>
                    <div className="book-info">
                      <h3 className="book-title">{book.title}</h3>
                      <p className="book-author">By {book.author}</p>
                      <div className="book-tags">
                        <span className="book-year-tag">{book.publishYear}</span>
                        <span className="book-language-tag">{book.language}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pagination">
                  <button
                    onClick={handlePrevPage}
                    disabled={uiPage === 1}
                    className={`pagination-button prev ${uiPage === 1 ? 'disabled' : ''}`}
                  >
                    <ChevronLeft />
                    <span>Previous</span>
                  </button>
                  <span className="page-indicator">
                    Page {uiPage} of {totalUiPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={uiPage >= totalUiPages}
                    className={`pagination-button next ${uiPage >= totalUiPages ? 'disabled' : ''}`}
                  >
                    <span>Next</span>
                    <ChevronRight />
                  </button>
                </div>
              </div>
            ) : query ? (
              <div className="no-results">Try a different search term</div>
            ) : (
              <div className="search-placeholder">
                <BookOpen className="placeholder-icon" />
                <p>Search for books to see results</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="uploads-container">
          <div className="upload-section">
            <h3 className="upload-title">Upload a Book</h3>
            <div className="file-input-container">
              <input type="file" id="book-file" accept=".pdf,.epub,.mobi" onChange={handleFileChange} className="file-input" />
              <label htmlFor="book-file" className="file-input-label">
                <Upload className="upload-icon" />
                <span>{selectedFile ? selectedFile.name : 'Choose file'}</span>
              </label>
            </div>
            <button onClick={handleFileUpload} disabled={!selectedFile || uploading} className="upload-button">
              {uploading ? 'Uploading...' : 'Upload Book'}
            </button>
          </div>

          <div className="user-books-section">
            <h3 className="section-title">My Books</h3>
            {userBooks.length > 0 ? (
              <div className="book-list">
                {userBooks.map((book) => (
                  <div key={book.id} className="book-card">
                    <div className="book-cover">
                      <BookOpen className="default-cover-icon" />
                    </div>
                    <div className="book-info">
                      <h3 className="book-title">{book.title}</h3>
                      <p className="book-author">By {book.author}</p>
                      <div className="book-tags">
                        <span className="book-user-tag">Your Upload</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-uploads-message">
                <p>You haven't uploaded any books yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
