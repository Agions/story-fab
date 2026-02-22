import React from 'react';
import { Switch } from 'antd';
import { useTheme } from '@/context/ThemeContext';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import './ThemeSwitch.less';

const ThemeSwitch: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Switch
      className="theme-switch"
      checked={isDarkMode}
      onChange={toggleTheme}
      checkedChildren={<MoonOutlined />}
      unCheckedChildren={<SunOutlined />}
    />
  );
};

export default ThemeSwitch; 