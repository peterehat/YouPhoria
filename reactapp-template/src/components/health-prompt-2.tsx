import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Upload, Smartphone, Link } from "lucide-react";
import backgroundImage from "figma:asset/54709ab4082b460723c84aa2d83790526e081e52.png";
import logo from "figma:asset/573024261d04e895163a44801c2dc0330d0d9c83.png";

export function HealthPrompt2() {
  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${backgroundImage}')`
        }}
      />
      
      {/* Logo */}
      <div className="absolute top-8 left-6 z-20">
        <img 
          src={logo} 
          alt="YouPhoria" 
          className="h-8 w-auto"
        />
      </div>

      {/* User Icon */}
      <div className="absolute top-8 right-6 z-20">
        <div 
          className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-sm border-2 border-solid border-[#eaff61] flex items-center justify-center"
          style={{ boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.5), 0 5px 15px -3px rgba(0, 0, 0, 0.4)' }}
        >
          <span className="text-white font-bold text-sm" style={{ fontFamily: 'Lufga, sans-serif' }}>
            PE
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 px-6 py-8">
        {/* Header Space */}
        <div className="flex-1 flex items-center justify-center mt-48">
          <Card className="w-full max-w-md bg-gray-200/30 backdrop-blur-md border-gray-300/20 rounded-[2.5rem]" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="text-gray-800 text-4xl font-bold" style={{ fontFamily: 'Lufga, sans-serif' }}>You-I</h1>
                  <p className="text-gray-700">
                    Ask me wellness questions.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Input
                    placeholder="Type your health question here..."
                    className="h-12 text-center placeholder:text-gray-500 bg-white/50 border-gray-300/30 text-gray-800 backdrop-blur-sm"
                  />
                  <Button className="w-full h-12 bg-[#eaff61] hover:bg-[#d9f052] text-black">
                    Get Health Guidance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Bottom Action Buttons */}
        <div className="pb-8 px-4">
          <div className="text-center mb-6">
            <div className="inline-block bg-gray-200/30 backdrop-blur-md shadow-2xl drop-shadow-lg border border-gray-300/20 rounded-full px-6 py-0.5">
              <h2 className="text-gray-800 text-lg font-medium" style={{ fontFamily: 'Lufga, sans-serif' }}>CONNECT</h2>
            </div>
          </div>
          <div className="flex justify-between items-center max-w-sm mx-auto">
            <Button 
              variant="secondary" 
              className="w-24 h-24 rounded-full bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 text-white border-[5px] border-solid border-[#eaff61] flex flex-col items-center justify-center gap-3 p-2"
              style={{ boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.5), 0 5px 15px -3px rgba(0, 0, 0, 0.4)' }}
            >
              <Upload className="w-7 h-7" />
              <span className="text-[8px] font-medium">DATA</span>
            </Button>
            
            <Button 
              variant="secondary" 
              className="w-24 h-24 rounded-full bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 text-white border-[5px] border-solid border-[#eaff61] flex flex-col items-center justify-center gap-3 p-2"
              style={{ boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.5), 0 5px 15px -3px rgba(0, 0, 0, 0.4)' }}
            >
              <Smartphone className="w-7 h-7" />
              <span className="text-[8px] font-medium">DEVICES</span>
            </Button>
            
            <Button 
              variant="secondary" 
              className="w-24 h-24 rounded-full bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 text-white border-[5px] border-solid border-[#eaff61] flex flex-col items-center justify-center gap-3 p-2"
              style={{ boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.5), 0 5px 15px -3px rgba(0, 0, 0, 0.4)' }}
            >
              <Link className="w-7 h-7" />
              <span className="text-[8px] font-medium">APPS</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}