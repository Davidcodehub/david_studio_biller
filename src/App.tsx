import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, ADMIN_EMAIL } from './firebase/config.ts';
import {
  subscribeToTracks,
  createTrack,
  updateTrack,
  deleteTrack,
  getStudioSettings,
  updateStudioSettings,
} from './firebase/firestore.ts';
import { ClientProject, StudioSettings } from './types.ts';
import { INITIAL_PROJECTS } from './data/initialProjects.ts';
import { Navbar } from './components/Navbar.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { UnauthorizedScreen } from './components/UnauthorizedScreen.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ClientPortal } from './components/ClientPortal.tsx';
import { NewTrackModal } from './components/NewTrackModal.tsx';
import { EditTrackModal } from './components/EditTrackModal.tsx';
import { UpiSettingsModal } from './components/UpiSettingsModal.tsx';
import { ToastContainer, ToastMessage } from './components/Toast.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Firestore state
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [isTracksLoading, setIsTracksLoading] = useState(true);
  const [studioSettings, setStudioSettings] = useState<StudioSettings>({
    upiId: 'davidmusicstudio@upi',
    payeeName: 'DAVID MUSIC STUDIO',
  });

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ClientProject | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Routing state
  const [clientTrackId, setClientTrackId] = useState<string | null>(null);

  // Parse route on mount
  useEffect(() => {
    function parseRoute() {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      if (path.startsWith('/track/')) {
        const id = path.replace('/track/', '').split('/')[0]?.trim();
        if (id) {
          setClientTrackId(id);
          return;
        }
      }
      const queryId = searchParams.get('id') || searchParams.get('track');
      if (queryId) {
        setClientTrackId(queryId);
        return;
      }
      setClientTrackId(null);
    }
    parseRoute();
    window.addEventListener('popstate', parseRoute);
    return () => window.removeEventListener('popstate', parseRoute);
  }, []);

  // Listen to Auth & Fetch Initial Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    // Fetch Studio Settings (Public Read)
    async function loadSettings() {
      const settings = await getStudioSettings();
      if (settings) {
        setStudioSettings(settings);
      }
    }
    loadSettings();

    return () => unsubscribe();
  }, []);

  // Sync tracks for admin
  useEffect(() => {
    const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (!isAdmin) {
      setProjects([]);
      return;
    }

    setIsTracksLoading(true);
    const unsubscribe = subscribeToTracks(
      (syncedTracks) => {
        setProjects(syncedTracks);
        setIsTracksLoading(false);
        if (syncedTracks.length === 0) {
          // Note: handleSeedInitialProjects is manual now to avoid auto-spam
        }
      },
      (error) => {
        console.error('Subscription error:', error);
        setIsTracksLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addToast = (message: string, type: 'success' | 'info' = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSignOut = async () => {
    await signOut(auth);
    addToast('Signed out of Studio Admin.', 'info');
  };

  const handleUpdateSettings = async (settings: StudioSettings) => {
    await updateStudioSettings(settings);
    setStudioSettings(settings);
    addToast('Studio UPI settings saved successfully!', 'success');
  };

  const handleSeedInitialProjects = async () => {
    try {
      for (const sample of INITIAL_PROJECTS) {
        const { id, ...data } = sample;
        await createTrack({ ...data, isPaid: data.balanceDue === 0 }, id);
      }
      addToast('Seeded 3 realistic sample projects into Firestore.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTrack = async (newTrackData: Omit<ClientProject, 'id'>) => {
    const createdId = await createTrack(newTrackData);
    addToast(`Track created! Public Link: /track/${createdId}`, 'success');
  };

  const handleUpdateTrack = async (trackId: string, updates: Partial<ClientProject>) => {
    await updateTrack(trackId, updates);
    addToast('Track record updated.', 'success');
  };

  const handleTogglePaymentStatus = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;

    if (!proj.isPaid) {
      await updateTrack(projectId, {
        advancePaid: proj.totalAmount,
        balanceDue: 0,
        isPaid: true,
        paymentStatus: 'Paid in Full - UPI',
        paymentNotified: true,
      });
      addToast(`Payment verified for ${proj.clientName}. Master Released!`, 'success');
    } else {
      const recalculatedAdvance = Math.round(proj.totalAmount * 0.4);
      await updateTrack(projectId, {
        advancePaid: recalculatedAdvance,
        balanceDue: proj.totalAmount - recalculatedAdvance,
        isPaid: false,
        paymentStatus: 'Pending UPI',
        paymentNotified: false,
      });
      addToast(`Master access revoked for ${proj.clientName}.`, 'info');
    }
  };

  const handleDeleteTrack = async (projectId: string) => {
    await deleteTrack(projectId);
  };

  // Public Route
  if (clientTrackId) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-zinc-100 flex flex-col selection:bg-[#FF5500]/30 selection:text-white">
        <Navbar isAdmin={false} isClientView={true} />
        <main className="flex-1 pb-16">
          <ClientPortal
            projectId={clientTrackId}
            settings={studioSettings}
            onShowToast={addToast}
            isAdminLoggedIn={currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()}
          />
        </main>
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex flex-col">
        <Navbar isAdmin={false} />
        <main className="flex-1"><AdminLogin onShowToast={addToast} /></main>
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  const isAuthorizedAdmin = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex flex-col">
        <Navbar isAdmin={false} onSignOut={handleSignOut} />
        <main className="flex-1"><UnauthorizedScreen userEmail={currentUser.email} onSignOut={handleSignOut} /></main>
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex flex-col">
      <Navbar
        isAdmin={true}
        adminEmail={currentUser.email}
        onOpenNewTrackModal={() => setIsNewModalOpen(true)}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 pb-16">
        <AdminDashboard
          projects={projects}
          isLoading={isTracksLoading}
          onTogglePaymentStatus={handleTogglePaymentStatus}
          onDeleteProject={handleDeleteTrack}
          onEditProject={(proj) => setEditingProject(proj)}
          onOpenNewTrackModal={() => setIsNewModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onSeedInitialProjects={handleSeedInitialProjects}
          onShowToast={addToast}
        />
      </main>
      <NewTrackModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} onSubmit={handleCreateTrack} />
      <EditTrackModal project={editingProject} isOpen={Boolean(editingProject)} onClose={() => setEditingProject(null)} onSubmit={handleUpdateTrack} />
      <UpiSettingsModal settings={studioSettings} isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onSubmit={handleUpdateSettings} />
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
