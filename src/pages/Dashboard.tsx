import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Briefcase, Map, IndianRupee, AlertCircle, Plus, MapPin, Users, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDashboardMetrics, getProjects } from '../services/projectService';

const carouselSlides = [
  {
    id: 1,
    title: "Modern Road Corridors & Expressways",
    subtitle: "Accelerating statutory acquisitions under RFCTLARR Act",
    image: "/image1.webp",
    fallback: "https://images.unsplash.com/photo-1595844730298-b960fa315264?auto=format&fit=crop&q=80&w=2070"
  },
  {
    id: 2,
    title: "Nation-Building Strategic Infrastructure",
    subtitle: "Seamless multi-modal logistics & corridor expansion",
    image: "/img.jpg",
    fallback: "https://images.unsplash.com/photo-1541888085959-1e149cfa3eb6?auto=format&fit=crop&q=80&w=2070"
  },
  {
    id: 3,
    title: "Equitable R&R and Farmer Empowerment",
    subtitle: "Direct Benefit Transfer & fair compensation workflows",
    image: "/image3.jpg",
    fallback: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=2070"
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    totalAcquiredArea: 0,
    pendingCompensation: 0,
    activeDisputes: 0,
  });
  const [latestProjectId, setLatestProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [metricsData, projectsData] = await Promise.all([
          getDashboardMetrics(),
          getProjects().catch(() => ({ success: false, projects: [] }))
        ]);
        
        if (isMounted) {
          if (metricsData.success) {
            setMetrics(metricsData.metrics);
          }
          if (projectsData.success && projectsData.projects.length > 0) {
            setLatestProjectId(projectsData.projects[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateProject = () => {
    navigate('/projects', { state: { action: 'create' } });
  };

  const handleAccessGIS = () => {
    if (latestProjectId) {
      navigate(`/projects/${latestProjectId}?tab=GIS`);
    } else {
      navigate('/projects');
    }
  };

  const handleReviewRnR = () => {
    if (latestProjectId) {
      navigate(`/projects/${latestProjectId}?tab=RnR`);
    } else {
      navigate('/projects');
    }
  };
  
  return (
    <Layout>
      <div className="flex-grow space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Banner Carousel */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm min-h-[320px] flex flex-col justify-center">
          {/* Background Images */}
          {carouselSlides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
            >
              <img 
                src={slide.image} 
                onError={(e) => { e.currentTarget.src = slide.fallback; }}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-transparent"></div>
            </div>
          ))}

          {/* Tricolor Accent Strip */}
          <div className="absolute top-0 left-0 w-full h-1.5 flex z-20">
            <div className="h-full bg-orange-500 flex-1"></div>
            <div className="h-full bg-white flex-1"></div>
            <div className="h-full bg-green-600 flex-1"></div>
          </div>

          {/* Content Overlays */}
          <div className="relative z-10 p-8 md:p-12 w-full flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="max-w-2xl">
               {/* Fixed Welcome Greeting */}
               <h2 className="text-3xl font-semibold text-white leading-tight mb-2">
                 Welcome back, {user?.name || 'Officer'}
               </h2>
               
               {/* Dynamic Carousel Text */}
               <div className="mt-6 min-h-[80px]">
                 <h3 className="text-xl md:text-2xl font-bold text-emerald-400 mb-2 transition-all duration-500">
                   {carouselSlides[currentSlide].title}
                 </h3>
                 <p className="text-slate-300 text-lg transition-all duration-500">
                   {carouselSlides[currentSlide].subtitle}
                 </p>
               </div>
            </div>

            {/* Shield Check Badge */}
            <div className="flex items-center space-x-2 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-100">
                {user?.role ? `${user.role.replace('_', ' ')} Authenticated` : 'Authenticated Session'}
              </span>
            </div>
          </div>

          {/* Manual Navigation Dots */}
          <div className="absolute bottom-6 left-8 flex space-x-2 z-10">
            {carouselSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                  currentSlide === index ? 'bg-emerald-400' : 'bg-slate-500/50 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Active Projects</p>
              <h3 className="text-3xl font-bold text-slate-900">
                {loading ? <Loader2 className="w-8 h-8 animate-spin text-blue-300" /> : metrics.totalProjects}
              </h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Map className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Area Acquired</p>
              <h3 className="text-3xl font-bold text-slate-900 flex items-baseline gap-2">
                {loading ? <Loader2 className="w-8 h-8 animate-spin text-emerald-300" /> : metrics.totalAcquiredArea.toFixed(2)} <span className="text-lg text-slate-400 font-normal">Hectares</span>
              </h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Compensation</p>
              <h3 className="text-3xl font-bold text-slate-900 flex items-baseline gap-2">
                ₹{loading ? <Loader2 className="w-8 h-8 animate-spin text-amber-300" /> : (metrics.pendingCompensation / 10000000).toFixed(2)} <span className="text-lg text-slate-400 font-normal">Cr</span>
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Legal Disputes</p>
              <h3 className="text-3xl font-bold text-slate-900">
                {loading ? <Loader2 className="w-8 h-8 animate-spin text-rose-300" /> : metrics.activeDisputes}
              </h3>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={handleCreateProject} className="flex items-center p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-blue-300 hover:shadow-md transition-all group text-left">
              <div className="p-3 bg-white border border-slate-200 rounded-lg group-hover:bg-blue-50 group-hover:border-blue-100 text-slate-600 group-hover:text-blue-600 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors">Create New Project</p>
                <p className="text-sm text-slate-500 mt-0.5">Initialize a new acquisition</p>
              </div>
            </button>
            
            <button onClick={handleAccessGIS} className="flex items-center p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all group text-left">
              <div className="p-3 bg-white border border-slate-200 rounded-lg group-hover:bg-emerald-50 group-hover:border-emerald-100 text-slate-600 group-hover:text-emerald-600 transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">Access GIS Map</p>
                <p className="text-sm text-slate-500 mt-0.5">View spatial land data</p>
              </div>
            </button>

            <button onClick={handleReviewRnR} className="flex items-center p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-amber-300 hover:shadow-md transition-all group text-left">
              <div className="p-3 bg-white border border-slate-200 rounded-lg group-hover:bg-amber-50 group-hover:border-amber-100 text-slate-600 group-hover:text-amber-600 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-slate-900 group-hover:text-amber-700 transition-colors">Review R&R Cases</p>
                <p className="text-sm text-slate-500 mt-0.5">Manage rehabilitation</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
