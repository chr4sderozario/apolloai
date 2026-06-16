/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.tsx';
import Console from './components/Console.tsx';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  // Hydrate lock states from localStorage on mounting
  useEffect(() => {
    const savedCode = localStorage.getItem('apollo_beta_access_code');
    if (savedCode) {
      setAccessCode(savedCode);
      setIsUnlocked(true);
    }
  }, []);

  /**
   * Called when the user enters a valid beta code on the landing page
   */
  const handleUnlock = (code: string) => {
    localStorage.setItem('apollo_beta_access_code', code);
    setAccessCode(code);
    setIsUnlocked(true);
  };

  /**
   * Clean-up sandbox credentials and lock access
   */
  const handleLock = () => {
    localStorage.removeItem('apollo_beta_access_code');
    setAccessCode('');
    setIsUnlocked(false);
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {isUnlocked ? (
        <Console 
          onLock={handleLock} 
          accessCode={accessCode} 
        />
      ) : (
        <LandingPage 
          onUnlock={handleUnlock} 
          isUnlocked={isUnlocked} 
        />
      )}
    </div>
  );
}
