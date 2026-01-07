import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { LoginForm, StudentRegisterForm, StaffRegisterForm } from './components/auth';
import Feed from '../../components/Feed';
import VisionUnit from './pages/VisionUnit';
import CampusMatrix from '../../pages/CampusMatrix';
import Marketplace from '../../components/Marketplace';
import Leaderboard from '../../components/Leaderboard';
import AdminDashboard from '../../components/AdminDashboard';
import Profile from '../../pages/Profile';
import InstallBanner from '../../components/InstallBanner';
import ActionLogger from '../../components/ActionLogger';
import { getProfile, initializeDemoData, logout } from '../../services/api';
import { User } from '../../types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login');

  useEffect(() => {
    initializeDemoData();
    const activeUser = getProfile();
    if (activeUser) setUser(activeUser);
    setTimeout(() => setLoading(false), 1200);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setCurrentTab('feed');
  };

  const handleRefresh = () => {
    setUser(getProfile());
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-eco-100 border-t-eco-500 rounded-full animate-spin shadow-eco" />
        <div className="absolute inset-0 m-auto w-2 h-2 bg-eco-500 rounded-full animate-pulse" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-mono text-[10px] text-eco-600 tracking-[0.5em] uppercase animate-pulse">Synchronizing Nodes...</p>
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em]">SaveRaks Eco-Guardian v2.0</p>
      </div>
    </div>
  );

  // Authentication views (if user is not logged in)
  if (!user) {
    if (view === 'register-student') {
      return (
        <StudentRegisterForm
          onSuccess={() => setView('login')}
          onBack={() => setView('login')}
        />
      );
    }

    if (view === 'register-staff') {
      return (
        <StaffRegisterForm
          onSuccess={() => setView('login')}
          onBack={() => setView('login')}
        />
      );
    }

    return (
      <LoginForm
        onSuccess={setUser}
        onSwitchToRegister={(type) => setView(`register-${type}`)}
      />
    );
  }

  return (
    <Layout currentTab={currentTab} setTab={setCurrentTab} user={user}>
      <main className="max-w-2xl mx-auto">
        {currentTab === 'feed' && <Feed />}
        {currentTab === 'vision' && <VisionUnit user={user} onBack={() => {
          handleRefresh();
          setCurrentTab('feed');
        }} />}
        {currentTab === 'matrix' && <CampusMatrix />}
        {currentTab === 'market' && <Marketplace user={user} onRedeem={() => {
          handleRefresh();
        }} />}
        {currentTab === 'leaderboard' && <Leaderboard />}
        {currentTab === 'profile' && <Profile user={user} onLogout={handleLogout} />}
        {currentTab === 'admin' && user.role === 'ADMIN' && <AdminDashboard />}
        {currentTab === 'logger' && <ActionLogger onActivityLogged={handleRefresh} />}
      </main>
      <InstallBanner />
    </Layout>
  );
};

export default App;
