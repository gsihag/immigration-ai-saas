import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  Building2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Agencies', href: '/agencies', icon: Building2 },
  { name: 'Timesheet', href: '/timesheet', icon: Clock },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Administration', href: '/admin', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();

  return (
    <div className={cn("w-64 bg-background border-r border-border flex flex-col", className)}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Immigration AI</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div className="font-medium">Immigration AI SaaS</div>
          <div>Version 1.0.0</div>
        </div>
      </div>
    </div>
  );
};