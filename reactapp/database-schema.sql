-- YouPhoria Wellness Database Schema
-- Run this SQL in your Supabase dashboard SQL editor

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  onboarding_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create connected_apps table
CREATE TABLE IF NOT EXISTS public.connected_apps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_name TEXT NOT NULL,
  app_type TEXT NOT NULL, -- 'fitness', 'health', 'nutrition', 'sleep', etc.
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  credentials JSONB, -- Store encrypted credentials
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.connected_apps ENABLE ROW LEVEL SECURITY;

-- Create connected_devices table
CREATE TABLE IF NOT EXISTS public.connected_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'smartwatch', 'fitness_tracker', 'scale', 'blood_pressure', etc.
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.connected_devices ENABLE ROW LEVEL SECURITY;

-- Create health_data table
CREATE TABLE IF NOT EXISTS public.health_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_type TEXT NOT NULL, -- 'steps', 'heart_rate', 'weight', 'sleep', 'calories', etc.
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL, -- 'steps', 'bpm', 'kg', 'hours', 'calories', etc.
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source_app TEXT, -- Which app the data came from
  source_device TEXT, -- Which device the data came from
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_connected_apps_user_id ON public.connected_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_apps_app_type ON public.connected_apps(app_type);
CREATE INDEX IF NOT EXISTS idx_connected_devices_user_id ON public.connected_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_devices_device_type ON public.connected_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON public.health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_data_type ON public.health_data(data_type);
CREATE INDEX IF NOT EXISTS idx_health_data_recorded_at ON public.health_data(recorded_at);

-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Connected apps policies
CREATE POLICY "Users can view own connected apps" ON public.connected_apps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected apps" ON public.connected_apps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected apps" ON public.connected_apps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected apps" ON public.connected_apps
  FOR DELETE USING (auth.uid() = user_id);

-- Connected devices policies
CREATE POLICY "Users can view own connected devices" ON public.connected_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected devices" ON public.connected_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected devices" ON public.connected_devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected devices" ON public.connected_devices
  FOR DELETE USING (auth.uid() = user_id);

-- Health data policies
CREATE POLICY "Users can view own health data" ON public.health_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health data" ON public.health_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health data" ON public.health_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health data" ON public.health_data
  FOR DELETE USING (auth.uid() = user_id);

-- Functions to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connected_apps_updated_at
  BEFORE UPDATE ON public.connected_apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connected_devices_updated_at
  BEFORE UPDATE ON public.connected_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
