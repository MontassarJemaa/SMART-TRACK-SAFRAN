'use client';

import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onFinish }) => {
  const [visible, setVisible] = useState(false);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    // Apparition douce
    const t1 = setTimeout(() => setVisible(true), 100);
    // Début sortie
    const t2 = setTimeout(() => setExit(true), 3200);
    // Afficher dashboard
    const t3 = setTimeout(() => onFinish(), 3800);

    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#1a2744',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: exit ? 0 : 1,
        transition: 'opacity 0.6s ease'
      }}
    >
      {/* Cercles décoratifs en arrière plan */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          border: '1px solid rgba(59,130,246,0.15)',
          animation: 'expandRing 3s ease-out infinite'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          border: '1px solid rgba(59,130,246,0.2)',
          animation: 'expandRing 3s ease-out 0.5s infinite'
        }}
      />

      {/* Logo */}
      <img
        src="/images/safran-smart-track-logo-fond-noir-removebg-preview.png"
        alt="SAFRAN SMART TRACK"
        style={{
          width: '320px',
          objectFit: 'contain',
          borderRadius: '16px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.9s ease, transform 0.9s ease'
        }}
      />

      {/* Ligne séparatrice animée */}
      <div
        style={{
          width: visible ? '200px' : '0px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
          marginTop: '28px',
          transition: 'width 1s ease 0.5s'
        }}
      />

      {/* Texte */}
      <div
        style={{
          marginTop: '16px',
          fontSize: '11px',
          color: '#828eb1',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease 0.8s'
        }}
      >
        SAFRAN SEATS TUNISIE
      </div>

      {/* Barre de progression en bas */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          height: '3px',
          background: '#3b82f6',
          animation: 'loadBar 3.2s ease forwards'
        }}
      />

      <style>{`
        @keyframes expandRing {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes loadBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
