import React from 'react'

export const AboutPage: React.FC = () => {
  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">YouPhoria</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A revolutionary full-stack development platform that transforms how teams build, deploy, and scale modern web applications.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 mb-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              To empower developers and organizations with a comprehensive, modern, and scalable platform that eliminates complexity 
              while maximizing productivity. We believe that great software should be built with great tools, and YouPhoria provides 
              exactly that - a unified ecosystem where innovation thrives.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What Makes YouPhoria Special</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Full-Stack Architecture</h3>
              <p className="text-gray-600">Complete monorepo with React frontend, Node.js backend, admin dashboard, and mobile app - all perfectly integrated.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Enterprise Security</h3>
              <p className="text-gray-600">JWT authentication, role-based access control, data encryption, and comprehensive security measures built-in.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Performance Optimized</h3>
              <p className="text-gray-600">Built with Vite, optimized bundling, code splitting, and modern performance best practices for lightning-fast experiences.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Developer Experience</h3>
              <p className="text-gray-600">TypeScript throughout, hot reloading, comprehensive testing, and modern development tools that make coding a joy.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cloud Native</h3>
              <p className="text-gray-600">Ready for deployment on any cloud platform with Docker support, CI/CD integration, and scalable architecture.</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics Ready</h3>
              <p className="text-gray-600">Built-in analytics, monitoring, and reporting capabilities to help you understand your users and optimize performance.</p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Built on Proven Technologies</h2>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Frontend</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>React 18 with hooks and modern patterns</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>TypeScript for type safety</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Vite for lightning-fast development</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Tailwind CSS for beautiful styling</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Redux Toolkit for state management</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Backend</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Node.js with Express framework</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>TypeScript for robust APIs</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>MySQL for reliable data storage</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>JWT authentication & authorization</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Winston logging & monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience YouPhoria?</h2>
          <p className="text-xl mb-8 opacity-90">Join the future of web development today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              Get Started Free
            </a>
            <a
              href="/contact"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
