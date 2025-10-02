import { Button } from "@/components/ui/button";
import { WavesBackground } from "@/components/ui/waves-background";

export default function HeroPage() {
  return (
    <div className="flex flex-col flex-1 rounded-none md:rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="relative w-full min-h-screen overflow-hidden">
        {/* Waves Background */}
        <WavesBackground
          className="absolute inset-0 z-0" 
          lineColor="rgba(91, 155, 213, 0.2)"
          waveSpeedX={0.01}
          waveSpeedY={0.01}
          waveAmpX={30}
          waveAmpY={30}
          friction={0.9}
          tension={0.9}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-screen max-w-5xl mx-auto text-center px-4 py-16">
          <div className="space-y-6">
            {/* Color Palette Display */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"].map((weight) => (
                <div 
                  key={weight} 
                  className="h-12 w-12 rounded-md flex items-center justify-center font-medium text-xs shadow-sm border"
                  style={{ 
                    backgroundColor: `var(--primary-${weight})`,
                    borderColor: parseInt(weight) < 400 ? '#c6dbf1' : `var(--primary-${weight})`,
                    color: parseInt(weight) > 300 ? 'white' : '#1e3a5c'
                  }}
                >
                  {weight}
                </div>
              ))}
            </div>
            
            <div className="mb-4 text-sm font-medium text-primary-600 uppercase tracking-wider">
              Modern UI System
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-primary-950 dark:text-primary-50">
              Beautifully Designed<br />
              <span className="text-primary-600">Blue Color Palette</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg text-primary-800 dark:text-primary-200">
              A carefully crafted color system for creating elegant, accessible, and consistent user interfaces.
              From subtle backgrounds to prominent call-to-actions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" variant="default">
                Primary Button
              </Button>
              
              <Button size="lg" variant="secondary">
                Secondary Button
              </Button>
              
              <Button size="lg" variant="outline">
                Outline Button
              </Button>
            </div>
          </div>
          
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-16 w-full">
            {[
              { 
                title: "Lighter Shades",
                desc: "Perfect for backgrounds, hover states, and subtle UI elements",
                colors: ["50", "100", "200"]
              },
              { 
                title: "Medium Shades",
                desc: "Great for secondary buttons, indicators, and less prominent UI elements",
                colors: ["300", "400", "500"]
              },
              { 
                title: "Darker Shades",
                desc: "Ideal for text, primary buttons, and high-contrast elements",
                colors: ["600", "700", "900"]
              }
            ].map((card, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-primary-950/50 rounded-lg p-6 shadow-md border border-primary-100 dark:border-primary-800"
              >
                <h3 className="text-xl font-semibold text-primary-900 dark:text-primary-100 mb-2">
                  {card.title}
                </h3>
                <p className="text-primary-700 dark:text-primary-300 mb-4 text-sm">
                  {card.desc}
                </p>
                <div className="flex space-x-2">
                  {card.colors.map(weight => (
                    <div 
                      key={weight} 
                      className="h-8 flex-1 rounded"
                      style={{ backgroundColor: `var(--primary-${weight})` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Component Examples */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-primary-900 dark:text-primary-50 mb-8">
              Component Examples
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cards & Badges */}
              <div className="bg-white dark:bg-primary-950/50 rounded-lg p-6 shadow-md border border-primary-100 dark:border-primary-800">
                <h3 className="text-xl font-semibold text-primary-900 dark:text-primary-100 mb-4">
                  Cards & Badges
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-md shadow border-l-4 border-primary-600 dark:bg-primary-900/50">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-primary-900 dark:text-primary-100">Project Title</h4>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-200">
                          Active
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                          Medium
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-primary-700 dark:text-primary-300 mt-2">
                      A brief description of the project and its goals.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700">Default</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Success</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Warning</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Error</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">Info</span>
                  </div>
                </div>
              </div>
              
              {/* Forms & Inputs */}
              <div className="bg-white dark:bg-primary-950/50 rounded-lg p-6 shadow-md border border-primary-100 dark:border-primary-800">
                <h3 className="text-xl font-semibold text-primary-900 dark:text-primary-100 mb-4">
                  Forms & Inputs
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-primary-800 dark:text-primary-200">
                      Email address
                    </label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-primary-900/50 dark:border-primary-700"
                      placeholder="you@example.com"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-primary-600 border-primary-300 rounded focus:ring-primary-500"
                    />
                    <label className="text-sm text-primary-800 dark:text-primary-200">
                      Remember me
                    </label>
                  </div>
                  
                  <div className="pt-2">
                    <Button size="default" variant="default" className="w-full">
                      Sign in
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}