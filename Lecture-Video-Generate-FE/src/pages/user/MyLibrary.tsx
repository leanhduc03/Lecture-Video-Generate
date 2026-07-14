import React, { useState } from 'react';
import ImageLibrary from '../../components/library/ImageLibrary';
import VideoLibrary from '../../components/library/VideoLibrary';
import AudioLibrary from '../../components/library/AudioLibrary';
import { MdImage, MdRecordVoiceOver, MdVideoLibrary, MdSearch, MdFilterList } from 'react-icons/md';
import '../../styles/my-library.scss';

type TabType = 'images' | 'audios' | 'videos';


const MyLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const applyFilter = () => {
    setIsFilterOpen(false);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectingStart(true);
    setIsFilterOpen(false);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    if (selectingStart || !startDate) {
      setStartDate(dateString);
      setEndDate('');
      setSelectingStart(false);
    } else {
      if (new Date(dateString) < new Date(startDate)) {
        setEndDate(startDate);
        setStartDate(dateString);
      } else {
        setEndDate(dateString);
      }
      setSelectingStart(true);
    }
  };

  const isDateInRange = (day: number) => {
    if (!startDate) return false;
    
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (end) {
      return checkDate >= start && checkDate <= end;
    }
    return false;
  };

  const isDateSelected = (day: number) => {
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(checkDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    return dateString === startDate || dateString === endDate;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="my-library-page">
      <div className="library-container">
        <header className="page-header">
          <div className="header-left">
            <h1>
              Thư viện của tôi
            </h1>
            <p>Quản lý và tổ chức các tài nguyên sáng tạo của bạn</p>
          </div>
        </header>

        <div className="controls-section">
          <nav className="library-tabs">
            <button
              className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
              onClick={() => setActiveTab('images')}
            >
              <MdImage />
              <span>Ảnh</span>
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              <MdVideoLibrary />
              <span>Video</span>
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'audios' ? 'active' : ''}`}
              onClick={() => setActiveTab('audios')}
            >
              <MdRecordVoiceOver />
              <span>Giọng nói</span>
            </button>
          </nav>

          <div className="library-controls">
            <div className="search-box">
              <MdSearch className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-wrapper">
              <button className="filter-button" onClick={toggleFilter}>
                <MdFilterList />
                <span>Lọc</span>
                {(startDate || endDate) && <span className="filter-badge"></span>}
              </button>
              
              {isFilterOpen && (
                <>
                  <div className="filter-dropdown">
                    <div className="filter-header">
                      <h3>Chọn khoảng thời gian</h3>
                      <button className="close-filter" onClick={() => setIsFilterOpen(false)}>
                        <span className="material-icons-round">close</span>
                      </button>
                    </div>
                    
                    <div className="filter-content">
                      <div className="calendar-wrapper">
                        <div className="calendar-header">
                          <button className="calendar-nav" onClick={prevMonth}>
                            <span className="material-icons-round">chevron_left</span>
                          </button>
                          <span className="calendar-title">
                            Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
                          </span>
                          <button className="calendar-nav" onClick={nextMonth}>
                            <span className="material-icons-round">chevron_right</span>
                          </button>
                        </div>

                        <div className="calendar-grid">
                          <div className="calendar-weekdays">
                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                              <div key={day} className="weekday">{day}</div>
                            ))}
                          </div>

                          <div className="calendar-days">
                            {(() => {
                              const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
                              const days = [];
                              
                              for (let i = 0; i < startingDayOfWeek; i++) {
                                days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                              }
                              
                              for (let day = 1; day <= daysInMonth; day++) {
                                const inRange = isDateInRange(day);
                                const selected = isDateSelected(day);
                                days.push(
                                  <button
                                    key={day}
                                    className={`calendar-day ${selected ? 'selected' : ''} ${inRange ? 'in-range' : ''}`}
                                    onClick={() => handleDateClick(day)}
                                  >
                                    {day}
                                  </button>
                                );
                              }
                              
                              return days;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="filter-actions">
                      <button className="btn-clear" onClick={clearFilter}>
                        Xóa bộ lọc
                      </button>
                      <button className="btn-apply" onClick={applyFilter}>
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'images' && <ImageLibrary searchQuery={searchQuery} startDate={startDate} endDate={endDate} />}
          {activeTab === 'videos' && <VideoLibrary searchQuery={searchQuery} startDate={startDate} endDate={endDate} />}
          {activeTab === 'audios' && <AudioLibrary searchQuery={searchQuery} startDate={startDate} endDate={endDate} />}
        </div>
      </div>
    </div>
  );
};

export default MyLibrary;