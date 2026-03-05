import React from 'react';
import '../style.css'; // Ensure we can style it

const Navbar = ({ activeTab, setTab, isDarkMode }) => {
    const tabs = [
        { id: 'keywords', label: '新年关键词' },
        { id: 'towhere', label: '一路向哪' },
        { id: 'breaking', label: '初时' },
    ];

    return (
        <nav className={`fixed-navbar ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="navbar-container">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
