import { Sun, Moon, Bell } from 'lucide-react';

const Header = ({ title, subtitle, theme, onToggleTheme }) => {
  return (
    <header className="header">
      <div>
        <div className="header-title">{title}</div>
        {subtitle && <div className="header-subtitle">{subtitle}</div>}
      </div>
      <div className="header-actions">
        <button
          className="btn btn-secondary btn-icon"
          onClick={onToggleTheme}
          title="Toggle theme"
          id="theme-toggle-btn"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
