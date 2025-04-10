import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import '../styles/tabs.css';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export interface TabItem {
  key: string;
  name: string;
  content: React.ReactNode;
}

interface TabContainerProps {
  tabs: TabItem[];
  defaultTab?: number;
  onTabChange?: (index: number) => void;
}

const TabContainer: React.FC<TabContainerProps> = ({ 
  tabs, 
  defaultTab = 0,
  onTabChange
}) => {
  const [selectedTab, setSelectedTab] = useState(defaultTab);

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };

  return (
    <div className="tab-container">
      <Tab.Group selectedIndex={selectedTab} onChange={handleTabChange}>
        <Tab.List className="tab-list">
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              className={({ selected }) =>
                classNames(
                  'tab-item',
                  selected ? 'tab-item-selected' : ''
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {tabs.map((tab) => (
            <Tab.Panel key={tab.key} className="tab-panel">
              {tab.content}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default TabContainer;
