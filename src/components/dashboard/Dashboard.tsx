
import React from "react";
import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "../layout/DashboardLayout";
import { DashboardHome } from "./DashboardHome";
import { ClientsPage } from "./ClientsPage";
import { CaseManager } from "../cases/CaseManager";
import { AgencyDashboard } from "../agency/AgencyDashboard";
import { CRMDashboard } from "../agency/CRMDashboard";
import { ClientPortal } from "../client/ClientPortal";

export const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/cases" element={<CaseManager />} />
        <Route path="/documents" element={<div className="p-6"><h1 className="text-2xl font-bold">Documents</h1><p>Document management coming soon...</p></div>} />
        <Route path="/calendar" element={<div className="p-6"><h1 className="text-2xl font-bold">Calendar</h1><p>Calendar view coming soon...</p></div>} />
        <Route path="/agencies" element={<AgencyDashboard />} />
        <Route path="/timesheet" element={<div className="p-6"><h1 className="text-2xl font-bold">Timesheet</h1><p>Timesheet management coming soon...</p></div>} />
        <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Reports</h1><p>Analytics and reports coming soon...</p></div>} />
        <Route path="/admin" element={<div className="p-6"><h1 className="text-2xl font-bold">Administration</h1><p>Admin settings coming soon...</p></div>} />
        <Route path="/help" element={<div className="p-6"><h1 className="text-2xl font-bold">Help</h1><p>Help documentation coming soon...</p></div>} />
        <Route path="/agency/crm" element={<CRMDashboard />} />
        <Route path="/client-portal" element={<ClientPortal />} />
      </Routes>
    </DashboardLayout>
  );
};
