import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

interface SystemStatus {
  frontend: boolean;
  backend: boolean;
  database: boolean;
  loading: boolean;
  error: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const [status, setStatus] = useState<SystemStatus>({
    frontend: true,
    backend: false,
    database: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStatus((prev) => ({
          ...prev,
          backend: data.success,
          database: data.dbConnected,
          loading: false,
        }));
      } catch (err: any) {
        setStatus((prev) => ({
          ...prev,
          backend: false,
          database: false,
          loading: false,
          error: err.message || 'Failed to connect to backend',
        }));
      }
    };

    checkBackendHealth();
  }, []);

  return (
    <Layout>
      <section className='flex-grow space-y-8 max-w-4xl'>
        <div>
          <h2 className='text-4xl font-light text-slate-900 leading-tight'>
            National Land Acquisition <br />Monitoring & Decision Support
          </h2>
          <p className='mt-4 text-slate-500 max-w-xl text-lg'>
            Phase 3: Project Management Module. Navigate to the Projects tab to view and manage acquisition projects.
          </p>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <div className='flex justify-between items-start mb-4'>
              <span className='text-xs font-bold uppercase text-slate-400 tracking-wider'>Layer 01</span>
              <div className='w-2 h-2 rounded-full bg-emerald-500'></div>
            </div>
            <h3 className='text-lg font-semibold mb-1'>Frontend</h3>
            <p className='text-sm text-slate-500 mb-4'>React.js Application</p>
            <div className='text-xs font-mono bg-slate-50 p-2 rounded text-slate-600 uppercase'>
              Status: {status.frontend ? 'RUNNING' : 'STOPPED'}
            </div>
          </div>
          
          <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <div className='flex justify-between items-start mb-4'>
              <span className='text-xs font-bold uppercase text-slate-400 tracking-wider'>Layer 02</span>
              <div className={`w-2 h-2 rounded-full ${status.loading ? 'bg-amber-500' : status.backend ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            </div>
            <h3 className='text-lg font-semibold mb-1'>Backend</h3>
            <p className='text-sm text-slate-500 mb-4'>Express & Node.js</p>
            <div className='text-xs font-mono bg-slate-50 p-2 rounded text-slate-600 uppercase'>
              Status: {status.loading ? 'CHECKING...' : status.backend ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
          </div>
          
          <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <div className='flex justify-between items-start mb-4'>
              <span className='text-xs font-bold uppercase text-slate-400 tracking-wider'>Layer 03</span>
              <div className={`w-2 h-2 rounded-full ${status.loading ? 'bg-amber-500' : status.database ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            </div>
            <h3 className='text-lg font-semibold mb-1'>Database</h3>
            <p className='text-sm text-slate-500 mb-4'>MongoDB</p>
            <div className='text-xs font-mono bg-slate-50 p-2 rounded text-slate-600 uppercase'>
              Status: {status.loading ? 'CHECKING...' : status.database ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
          </div>
        </div>
        
        <div className='bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-sm overflow-hidden border border-slate-800'>
          <div className='flex items-center space-x-2 mb-4 border-b border-slate-800 pb-3'>
            <div className='w-3 h-3 rounded-full bg-red-500'></div>
            <div className='w-3 h-3 rounded-full bg-amber-500'></div>
            <div className='w-3 h-3 rounded-full bg-emerald-500'></div>
            <span className='ml-2 text-xs text-slate-500'>system-health-check.log</span>
          </div>
          <div className='space-y-1'>
            <p><span className='text-emerald-400'>[{new Date().toISOString().replace('T', ' ').substring(0, 19)}]</span> INFO: Logged in successfully.</p>
            <p><span className='text-emerald-400'>[{new Date().toISOString().replace('T', ' ').substring(0, 19)}]</span> INFO: User Role - {user?.role}.</p>
            {!status.loading && (
              <>
                <p><span className={status.database ? 'text-emerald-400' : 'text-rose-400'}>[{new Date().toISOString().replace('T', ' ').substring(0, 19)}]</span> {status.database ? 'SUCCESS: MongoDB Connection Established via Mongoose.' : 'ERROR: MongoDB Connection Failed.'}</p>
                <p><span className={status.backend ? 'text-emerald-400' : 'text-rose-400'}>[{new Date().toISOString().replace('T', ' ').substring(0, 19)}]</span> {status.backend ? 'SUCCESS: Express Server listening.' : 'ERROR: Express Server unreachable.'}</p>
              </>
            )}
            <p className='text-slate-500 animate-pulse'>_</p>
          </div>
        </div>
      </section>
      
      <aside className='w-full md:w-80 shrink-0 space-y-6'>
        <div className='bg-white border border-slate-200 rounded-xl p-6'>
          <h4 className='text-xs font-bold uppercase text-slate-400 tracking-widest mb-4'>Account Info</h4>
          <ul className='space-y-3'>
            <li className='flex justify-between text-sm'>
              <span className='text-slate-500'>Name</span>
              <span className='font-medium text-slate-900'>{user?.name}</span>
            </li>
            <li className='flex flex-col text-sm space-y-1'>
              <span className='text-slate-500'>Email</span>
              <span className='font-mono text-slate-900 truncate' title={user?.email}>{user?.email}</span>
            </li>
          </ul>
        </div>
        
        <div className='bg-emerald-50 border border-emerald-200 rounded-xl p-6'>
          <h4 className='text-xs font-bold uppercase text-emerald-800 tracking-widest mb-4'>Security Status</h4>
          <div className='space-y-3'>
            <div className='flex items-center space-x-3'>
              <div className='w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-800'>✓</div>
              <span className='text-sm font-medium text-emerald-800'>JWT Authenticated</span>
            </div>
            <p className='text-xs text-emerald-700 leading-relaxed'>
              You are securely accessing protected endpoints using bearer token authorization.
            </p>
          </div>
        </div>
      </aside>
    </Layout>
  );
}
