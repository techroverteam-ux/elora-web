import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle, MapPin, Phone, Mail, MessageCircle, Sun, Moon } from 'lucide-react';

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
  }, []);

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
                alt="Elora Crafting Arts Logo"
                width={40}
                height={40}
                className={darkMode ? 'invert' : ''}
              />
              <span className="text-2xl font-bold text-orange-500">
                Elora Crafting Arts
              </span>
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#services" className="hover:text-orange-500 transition-colors">Services</a>
              <a href="#process" className="hover:text-orange-500 transition-colors">Process</a>
              <a href="#gallery" className="hover:text-orange-500 transition-colors">Gallery</a>
              <a href="#contact" className="hover:text-orange-500 transition-colors">Contact</a>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-semibold transition-colors">
              Get Quote
            </button>
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
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            WE DON'T JUST PRINT.
            <span className="block text-orange-500">WE INSTALL YOUR BRAND</span>
            <span className="block">INTO THE REAL WORLD.</span>
          </h1>
          
          <p className={`text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Elora Crafting Arts helps businesses stand out with custom branding, 
            high-quality banner printing, and professional on-site installation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-full text-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105">
              Get My Shop Branded
              <ArrowRight className="w-6 h-6" />
            </button>
            <button className={`border-2 px-8 py-4 rounded-full text-xl font-bold transition-all ${
              darkMode 
                ? 'border-white hover:bg-white hover:text-black' 
                : 'border-gray-900 hover:bg-gray-900 hover:text-white'
            }`}>
              View Our Work
            </button>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="services" className={`py-20 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-b from-black to-purple-900/20' 
          : 'bg-gradient-to-b from-gray-50 to-orange-50/20'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              From Design to Installation —
              <span className="block text-orange-500">We Handle Everything</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Custom Brand Banner Printing",
                description: "High-resolution printing on durable materials.",
                icon: "🎨"
              },
              {
                title: "Creative Branding Design",
                description: "We turn your logo and message into eye-catching visuals.",
                icon: "✨"
              },
              {
                title: "On-Site Store Visit",
                description: "Our team visits your shop or stall location.",
                icon: "🚗"
              },
              {
                title: "Professional Banner Installation",
                description: "We securely install branding that lasts in all weather.",
                icon: "🔧"
              }
            ].map((service, index) => (
              <div key={index} className={`p-8 rounded-2xl border transition-all transform hover:scale-105 hover:border-orange-500/50 ${
                darkMode 
                  ? 'bg-purple-900/30 border-purple-700/50' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-orange-500">{service.title}</h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              How We Bring Your
              <span className="block text-orange-500">Brand to Life</span>
            </h2>
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
              <div key={index} className="text-center">
                <div className="bg-orange-500 text-black text-2xl font-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  {process.step}
                </div>
                <h3 className="text-xl font-bold mb-4">{process.title}</h3>
                <p className="text-gray-400">{process.description}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-orange-500 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-gradient-to-b from-purple-900/20 to-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Real Work,
              <span className="block text-orange-500">Real Stores</span>
            </h2>
            <p className="text-xl text-gray-300">See How We Transform Shops</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="group relative overflow-hidden rounded-2xl aspect-square">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img 
                  src={`https://images.unsplash.com/photo-${1541888946425 + item}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`}
                  alt={`Project ${item}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute bottom-4 left-4 z-20">
                  <span className="bg-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                    Before & After
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Why Choose
              <span className="block text-orange-500">Elora Crafting Arts</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "High-quality durable materials",
              "Weather-resistant printing",
              "Fast turnaround time",
              "On-site installation experts",
              "Affordable packages for small & large businesses",
              "Professional design consultation"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 p-6 bg-purple-900/30 rounded-xl border border-purple-700/50">
                <CheckCircle className="w-8 h-8 text-orange-500 flex-shrink-0" />
                <span className="text-lg font-semibold">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Service Section */}
      <section className="py-20 bg-gradient-to-b from-purple-900/20 to-black">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-8">
            We Come to Your Store —
            <span className="block text-orange-500">Anywhere You Need Us</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
            Whether your shop is in a busy market, mall, roadside stall, or commercial complex — 
            our team travels to your location for professional installation.
          </p>
          
          <div className="flex justify-center">
            <MapPin className="w-16 h-16 text-orange-500" />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-purple-900/50 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
        
        <div className="relative z-20 text-center max-w-6xl mx-auto px-4">
          <h2 className="text-5xl md:text-7xl font-black mb-12">
            READY TO TURN YOUR SHOP
            <span className="block text-orange-500">INTO A BRAND?</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="bg-orange-500 hover:bg-orange-600 px-12 py-6 rounded-full text-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105">
              Book Branding Service
              <ArrowRight className="w-8 h-8" />
            </button>
            <button className="border-2 border-white hover:bg-white hover:text-black px-12 py-6 rounded-full text-2xl font-bold transition-all">
              Talk to Our Team
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black border-t border-purple-900/30 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-orange-500 mb-4">Elora Crafting Arts</h3>
              <p className="text-gray-400 mb-6">
                Transforming businesses with professional branding and installation services.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-orange-500" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-orange-500" />
                  <span>WhatsApp Us</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-orange-500" />
                  <span>info@eloracraftingarts.com</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Banner Printing</li>
                <li>Brand Design</li>
                <li>Installation Services</li>
                <li>Consultation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Service Areas</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Commercial Markets</li>
                <li>Shopping Malls</li>
                <li>Roadside Stalls</li>
                <li>Business Districts</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-purple-900/30 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Elora Crafting Arts. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;