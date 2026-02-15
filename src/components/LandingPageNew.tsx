'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle, MapPin, Phone, Mail, MessageCircle, Sun, Moon, Loader2, ChevronLeft, ChevronRight, Award, Shield, Zap, Users, IndianRupee, Palette } from 'lucide-react';
import api from '@/src/lib/api';
import { Store, StoreStatus } from '@/src/types/store';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [completedStores, setCompletedStores] = useState<Store[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const itemsPerSlide = 6;
  
  // Static portfolio data
  const staticPortfolio = [
    {
      id: '1',
      storeName: 'Fashion Hub',
      location: 'Connaught Place, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      afterImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800',
      description: 'Complete storefront transformation with LED signage'
    },
    {
      id: '2',
      storeName: 'Spice Market',
      location: 'Chandni Chowk, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      afterImage: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      description: 'Traditional market stall branding with weather-resistant materials'
    },
    {
      id: '3',
      storeName: 'Tech Zone',
      location: 'Nehru Place, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      afterImage: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800',
      description: 'Modern electronics store with illuminated branding'
    },
    {
      id: '4',
      storeName: 'Sweet Corner',
      location: 'Karol Bagh, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      afterImage: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
      description: 'Vibrant sweet shop branding with custom graphics'
    },
    {
      id: '5',
      storeName: 'Fitness First',
      location: 'Saket, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      afterImage: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
      description: 'Gym exterior branding with motivational messaging'
    },
    {
      id: '6',
      storeName: 'Cafe Delight',
      location: 'Hauz Khas, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
      afterImage: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800',
      description: 'Cozy cafe storefront with artistic signage'
    },
    {
      id: '7',
      storeName: 'Book Haven',
      location: 'Khan Market, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
      afterImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800',
      description: 'Bookstore exterior with elegant signage'
    },
    {
      id: '8',
      storeName: 'Jewelry Palace',
      location: 'Lajpat Nagar, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
      afterImage: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800',
      description: 'Luxury jewelry store branding'
    },
    {
      id: '9',
      storeName: 'Organic Mart',
      location: 'Green Park, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      afterImage: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
      description: 'Organic grocery store branding'
    },
    {
      id: '10',
      storeName: 'Pet Paradise',
      location: 'Vasant Vihar, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
      afterImage: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800',
      description: 'Pet store with colorful branding'
    },
    {
      id: '11',
      storeName: 'Auto Parts Hub',
      location: 'Mayur Vihar, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
      afterImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
      description: 'Automotive parts store branding'
    },
    {
      id: '12',
      storeName: 'Beauty Salon',
      location: 'Rajouri Garden, Delhi',
      beforeImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
      afterImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
      description: 'Modern beauty salon exterior'
    }
  ];
  
  const portfolioData = completedStores.length > 0 ? completedStores : staticPortfolio;
  const totalSlides = Math.ceil(portfolioData.length / itemsPerSlide);
  
  // Enquiry Form State
  const [enquiry, setEnquiry] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Select Service',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    fetchPortfolio();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  const fetchPortfolio = async () => {
    try {
      const { data } = await api.get('/stores?status=COMPLETED&limit=20');
      const portfolio = data.stores.filter((s: Store) => 
        s.currentStatus === StoreStatus.COMPLETED &&
        s.recce?.photos?.front && 
        s.installation?.photos?.after1
      ).slice(0, 20);
      if (portfolio.length > 0) {
        setCompletedStores(portfolio);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio", error);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!enquiry.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (enquiry.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    
    if (enquiry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (!enquiry.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    
    if (!/^[0-9]{10}$/.test(enquiry.phone.replace(/[\s-]/g, ''))) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    
    if (enquiry.service === 'Select Service') {
      toast.error("Please select a service");
      return;
    }
    
    if (!enquiry.message.trim()) {
      toast.error("Please enter your message");
      return;
    }
    
    if (enquiry.message.trim().length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/enquiries', enquiry);
      toast.success("Message sent successfully!");
      setEnquiry({
        name: '',
        email: '',
        phone: '',
        service: 'Select Service',
        message: ''
      });
    } catch (error) {
      toast.error("Failed to send message. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full backdrop-blur-sm z-50 border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-black/90 border-purple-900/30' 
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={180}
                height={90}
                className=""
              />
            </div>
            <div className="hidden md:flex space-x-6 items-center">
              <a href="#services" className="hover:text-yellow-500 transition-colors">Services</a>
              <a href="#process" className="hover:text-yellow-500 transition-colors">Process</a>
              <a href="#gallery" className="hover:text-yellow-500 transition-colors">Gallery</a>
              <a href="#contact" className="hover:text-yellow-500 transition-colors">Contact</a>
              <a href="/login" className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full font-semibold transition-all">Login</a>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <a href="/login" className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-full font-semibold transition-all text-sm">
                Login
              </a>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <span className={`block w-5 h-0.5 bg-current transition-all ${
                    mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'
                  }`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-all ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-all ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'
                  }`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className={`px-4 py-4 border-t ${
            darkMode ? 'border-purple-900/30 bg-black/95' : 'border-gray-200 bg-white/95'
          }`}>
            <div className="flex flex-col space-y-4">
              <a 
                href="#services" 
                className="hover:text-yellow-500 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </a>
              <a 
                href="#process" 
                className="hover:text-yellow-500 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Process
              </a>
              <a 
                href="#gallery" 
                className="hover:text-yellow-500 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gallery
              </a>
              <a 
                href="#contact" 
                className="hover:text-yellow-500 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <a 
                href="#contact" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-full font-semibold transition-all text-center mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Quote
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className={`absolute inset-0 z-10 ${
          darkMode 
            ? 'bg-gradient-to-br from-purple-900/50 to-black/80' 
            : 'bg-gradient-to-br from-orange-100/80 to-white/90'
        }`}></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
        
        <div className="relative z-20 text-center max-w-6xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight">
            WE DON'T JUST PRINT.
            <span className="block text-yellow-500">WE INSTALL YOUR BRAND</span>
            <span className="block">INTO THE REAL WORLD.</span>
          </h1>
          
          <p className={`text-lg sm:text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            We help businesses stand out with custom branding, 
            high-quality banner printing, and professional on-site installation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <a href="#contact" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg lg:text-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              Get My Shop Branded
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#gallery" className={`border-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg lg:text-xl font-bold transition-all hover:shadow-lg text-center ${
              darkMode 
                ? 'border-white hover:bg-white hover:text-black' 
                : 'border-gray-900 hover:bg-gray-900 hover:text-white'
            }`}>
              View Our Work
            </a>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="services" className={`py-12 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-b from-black to-purple-900/20' 
          : 'bg-gradient-to-b from-gray-50 to-orange-50/20'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
              From Design to Installation —
              <span className="block text-yellow-500">We Handle Everything</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Custom Brand Banner Printing",
                description: "High-resolution printing on durable materials."
              },
              {
                title: "Creative Branding Design",
                description: "We turn your logo and message into eye-catching visuals."
              },
              {
                title: "On-Site Store Visit",
                description: "Our team visits your shop or stall location."
              },
              {
                title: "Professional Banner Installation",
                description: "We securely install branding that lasts in all weather."
              }
            ].map((service, index) => (
              <div key={index} className={`p-8 rounded-2xl border transition-all transform hover:scale-105 hover:border-yellow-500/50 ${
                darkMode 
                  ? 'bg-purple-900/30 border-purple-700/50' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-yellow-500">{service.title}</h3>
                <p className={`text-sm sm:text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className={`py-12 transition-colors duration-300 ${
        darkMode ? 'bg-black' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              How We Bring Your Brand to Life
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Our proven 4-step process transforms your vision into reality</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Share Your Brand Idea",
                description: "Tell us your business name, colors, and message."
              },
              {
                step: "02",
                title: "We Design & Print",
                description: "Our team prepares bold, high-impact banners."
              },
              {
                step: "03",
                title: "We Visit Your Location",
                description: "We travel to your store, stall, or event space."
              },
              {
                step: "04",
                title: "We Install Your Branding",
                description: "Your shop transforms into a powerful branded presence."
              }
            ].map((process, index) => (
              <div key={index} className="text-center relative">
                <div className="bg-yellow-500 text-black text-2xl font-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  {process.step}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3">{process.title}</h3>
                <p className={`text-sm sm:text-base leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className={`py-16 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-b from-purple-900/20 to-black' 
          : 'bg-gradient-to-b from-orange-50/20 to-gray-50'
      }`}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight">
              Real Work, Real Stores
            </h2>
            <p className={`text-lg font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>See How We Transform Shops</p>
          </div>
          
          {isLoadingPortfolio ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
            </div>
          ) : (
            <div className="relative px-0 sm:px-8 md:px-12">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: totalSlides }).map((_, slideIdx) => (
                    <div key={slideIdx} className="w-full flex-shrink-0 px-4 sm:px-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {portfolioData.slice(slideIdx * itemsPerSlide, (slideIdx + 1) * itemsPerSlide).map((item) => {
                          const isRealStore = 'dealerCode' in item;
                          return (
                            <div key={isRealStore ? item._id : item.id} className="group relative overflow-hidden rounded-xl aspect-square border border-gray-200 shadow-md">
                              <div className="absolute inset-0 transition-opacity duration-700 ease-in-out group-hover:opacity-0">
                                <img 
                                  src={isRealStore ? `http://localhost:5000${item.installation?.photos?.after1?.replace(/\\/g, '/')}` : item.afterImage}
                                  alt={`After - ${item.storeName}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 right-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                                  AFTER
                                </div>
                              </div>
                              
                              <div className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100">
                                <img 
                                  src={isRealStore ? `http://localhost:5000${item.recce?.photos?.front?.replace(/\\/g, '/')}` : item.beforeImage}
                                  alt={`Before - ${item.storeName}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 right-3 bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                                  BEFORE
                                </div>
                              </div>

                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                                <h3 className="text-white font-bold text-base">{item.storeName}</h3>
                                <p className="text-gray-300 text-sm">
                                  {isRealStore ? `${item.location.city}, ${item.location.state}` : item.location}
                                </p>
                                {!isRealStore && <p className="text-gray-400 text-xs mt-1">{item.description}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Navigation */}
              {totalSlides > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides)}
                    className={`hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 p-2.5 rounded-full shadow-xl transition-all items-center justify-center ${
                      darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                    } z-10`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide(prev => (prev + 1) % totalSlides)}
                    className={`hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 p-2.5 rounded-full shadow-xl transition-all items-center justify-center ${
                      darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                    } z-10`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalSlides }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all ${
                          currentSlide === idx 
                            ? 'bg-yellow-500 w-8' 
                            : darkMode ? 'bg-gray-600 hover:bg-gray-500 w-2' : 'bg-gray-300 hover:bg-gray-400 w-2'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className={`py-12 transition-colors duration-300 ${
        darkMode ? 'bg-black' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
              Why Choose <span className="text-yellow-500">Us</span>
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Excellence in every aspect of our service</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "High-quality durable materials", icon: Award },
              { title: "Weather-resistant printing", icon: Shield },
              { title: "Fast turnaround time", icon: Zap },
              { title: "On-site installation experts", icon: Users },
              { title: "Affordable packages for small & large businesses", icon: IndianRupee },
              { title: "Professional design consultation", icon: Palette }
            ].map((benefit, index) => (
              <div key={index} className={`flex items-start gap-4 p-6 rounded-xl border transition-all hover:scale-105 hover:shadow-lg ${
                darkMode 
                  ? 'bg-gradient-to-br from-purple-900/40 to-purple-900/20 border-purple-700/50 hover:border-yellow-500/50' 
                  : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-gray-200 hover:border-yellow-500'
              }`}>
                <div className="flex-shrink-0">
                  <benefit.icon className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-semibold">{benefit.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Service Section */}
      <section className={`py-12 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-b from-purple-900/20 to-black' 
          : 'bg-gradient-to-b from-orange-50/20 to-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
              We Come to Your Store — <span className="text-yellow-500">Anywhere You Need Us</span>
            </h2>
            
            <p className={`text-lg sm:text-xl max-w-3xl mx-auto mb-8 leading-relaxed font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Whether your shop is in a busy market, mall, roadside stall, or commercial complex — 
              our team travels to your location for professional installation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className={`p-6 rounded-2xl border shadow-lg ${
              darkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6" /> Service Coverage
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Commercial Markets & Shopping Districts</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Shopping Malls & Retail Complexes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Roadside Stalls & Street Shops</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Business Parks & Corporate Offices</span>
                </li>
              </ul>
            </div>
            
            <div className={`p-6 rounded-2xl border shadow-lg ${
              darkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-xl font-bold text-yellow-500 mb-4">Why On-Site Installation?</h3>
              <ul className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>• Professional measurement and fitting</li>
                <li>• Weather-proof installation techniques</li>
                <li>• No hassle for business owners</li>
                <li>• Same-day installation available</li>
                <li>• Quality assurance on-site</li>
              </ul>
            </div>
          </div>
          
          <div className={`rounded-2xl overflow-hidden border shadow-lg ${
            darkMode ? 'border-purple-700/50' : 'border-gray-200'
          }`}>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.123456789!2d77.1234567!3d28.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDA3JzI0LjQiTiA3N8KwMDcnMjQuNCJF!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
              width="100%" 
              height="400" 
              style={{border:0}} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Service Areas Map"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className={`absolute inset-0 z-10 ${
          darkMode 
            ? 'bg-gradient-to-br from-orange-500/20 to-purple-900/50' 
            : 'bg-gradient-to-br from-orange-200/60 to-purple-200/40'
        }`}></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
        
        <div className="relative z-20 text-center max-w-6xl mx-auto px-4">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-12 leading-tight">
            READY TO TURN YOUR SHOP
            <span className="block text-yellow-500">INTO A BRAND?</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <a href="#contact" className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full text-lg sm:text-xl lg:text-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              Book Branding Service
              <ArrowRight className="w-6 h-6" />
            </a>
            <a href="#contact" className={`border-2 px-8 sm:px-10 py-4 sm:py-5 rounded-full text-lg sm:text-xl lg:text-2xl font-bold transition-all hover:shadow-lg text-center ${
              darkMode 
                ? 'border-white hover:bg-white hover:text-black' 
                : 'border-gray-900 hover:bg-gray-900 hover:text-white'
            }`}>
              Talk to Our Team
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className={`border-t py-16 transition-colors duration-300 ${
        darkMode 
          ? 'bg-black border-purple-900/30' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
              Get Your <span className="text-yellow-500">Free Quote</span>
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Ready to transform your business? Contact us today!
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            {/* Contact Form */}
            <div className={`p-8 rounded-2xl border ${
              darkMode 
                ? 'bg-purple-900/30 border-purple-700/50' 
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <h3 className="text-2xl font-bold text-yellow-500 mb-6">Send Message</h3>
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    required
                    placeholder="Your Name *" 
                    value={enquiry.name}
                    onChange={(e) => setEnquiry({...enquiry, name: e.target.value})}
                    minLength={2}
                    maxLength={50}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    value={enquiry.email}
                    onChange={(e) => setEnquiry({...enquiry, email: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <input 
                    type="tel" 
                    required
                    placeholder="Your Phone (10 digits) *" 
                    value={enquiry.phone}
                    onChange={(e) => setEnquiry({...enquiry, phone: e.target.value.replace(/[^0-9]/g, '')})}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <select 
                    required
                    value={enquiry.service}
                    onChange={(e) => setEnquiry({...enquiry, service: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}>
                    <option value="Select Service" disabled>Select Service *</option>
                    <option>Banner Printing</option>
                    <option>Brand Design</option>
                    <option>Installation Service</option>
                    <option>Complete Package</option>
                  </select>
                </div>
                <div>
                  <textarea 
                    required
                    rows={4} 
                    placeholder="Tell us about your project... (min 10 characters) *" 
                    value={enquiry.message}
                    onChange={(e) => setEnquiry({...enquiry, message: e.target.value})}
                    minLength={10}
                    maxLength={500}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex justify-center items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
            
            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-6">Contact Info</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Call Us</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>+91 98765 43210</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mon-Sat 9AM-7PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MessageCircle className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">WhatsApp</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>+91 98765 43210</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quick Response</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Email</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>info@eloracraftingarts.com</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>24/7 Support</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Service Areas</h4>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Pan India Coverage</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>We come to your location</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="mt-8 flex flex-row gap-4">
                <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call Now
                </a>
                <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
          
          {/* Bottom Footer */}
          <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>Banner Printing</li>
                <li>Brand Design</li>
                <li>Installation Services</li>
                <li>Consultation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Service Areas</h4>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>Commercial Markets</li>
                <li>Shopping Malls</li>
                <li>Roadside Stalls</li>
                <li>Business Districts</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#services" className="hover:text-yellow-500 transition-colors">Our Services</a></li>
                <li><a href="#gallery" className="hover:text-yellow-500 transition-colors">Portfolio</a></li>
                <li><a href="#process" className="hover:text-yellow-500 transition-colors">Our Process</a></li>
                <li><a href="#contact" className="hover:text-yellow-500 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t mt-12 pt-8 text-center transition-colors duration-300 ${
            darkMode 
              ? 'border-purple-900/30 text-gray-400' 
              : 'border-gray-200 text-gray-600'
          }`}>
            <p>&copy; 2024 All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;