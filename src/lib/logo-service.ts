import { supabase } from './supabase';

interface LogoResult {
  url: string;
  source: 'clearbit' | 'brandfetch' | 'google' | 'duckduckgo' | 'generated';
}

/**
 * Automated logo fetching service
 * Tries multiple sources to find company/brand logos
 */
export class LogoService {
  // Clearbit Logo API (free, no auth required)
  private static async fetchFromClearbit(domain: string): Promise<string | null> {
    try {
      // Clearbit provides logos based on domain
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      
      // Test if the logo exists
      const response = await fetch(logoUrl, { method: 'HEAD' });
      if (response.ok) {
        return logoUrl;
      }
    } catch (error) {
      console.error('Clearbit logo fetch failed:', error);
    }
    return null;
  }

  // Google Favicon API (free, no auth required)
  private static async fetchFromGoogle(domain: string): Promise<string | null> {
    try {
      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      return logoUrl; // Google always returns something, even if it's a default icon
    } catch (error) {
      console.error('Google favicon fetch failed:', error);
    }
    return null;
  }

  // DuckDuckGo favicon service
  private static async fetchFromDuckDuckGo(domain: string): Promise<string | null> {
    try {
      const logoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      
      // Test if the logo exists
      const response = await fetch(logoUrl, { method: 'HEAD' });
      if (response.ok) {
        return logoUrl;
      }
    } catch (error) {
      console.error('DuckDuckGo favicon fetch failed:', error);
    }
    return null;
  }

  // Try to extract domain from brand name
  private static guessDomain(brandName: string): string[] {
    const cleanName = brandName.toLowerCase().trim();
    
    // Common domain patterns
    const domains = [
      `${cleanName.replace(/\s+/g, '')}.com`,
      `${cleanName.replace(/\s+/g, '-')}.com`,
      `${cleanName.replace(/\s+/g, '')}.co`,
      `${cleanName.split(' ')[0]}.com`, // First word only
    ];

    // Special cases for known brands
    const brandMappings: Record<string, string> = {
      'coca cola': 'coca-cola.com',
      'coca-cola': 'coca-cola.com',
      'mcdonalds': 'mcdonalds.com',
      "mcdonald's": 'mcdonalds.com',
      'burger king': 'burgerking.com',
      'kfc': 'kfc.com',
      'nike': 'nike.com',
      'adidas': 'adidas.com',
      'apple': 'apple.com',
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'amazon': 'amazon.com',
      'facebook': 'facebook.com',
      'instagram': 'instagram.com',
      'twitter': 'twitter.com',
      'x': 'x.com',
      'youtube': 'youtube.com',
      'netflix': 'netflix.com',
      'spotify': 'spotify.com',
      'uber': 'uber.com',
      'grab': 'grab.com',
      'airbnb': 'airbnb.com',
      'samsung': 'samsung.com',
      'sony': 'sony.com',
      'lg': 'lg.com',
      'huawei': 'huawei.com',
      'xiaomi': 'xiaomi.com',
      'oppo': 'oppo.com',
      'vivo': 'vivo.com',
      'realme': 'realme.com',
      'oneplus': 'oneplus.com',
      'asus': 'asus.com',
      'acer': 'acer.com',
      'dell': 'dell.com',
      'hp': 'hp.com',
      'lenovo': 'lenovo.com',
      'intel': 'intel.com',
      'amd': 'amd.com',
      'nvidia': 'nvidia.com',
      // Malaysian brands
      'maybank': 'maybank.com',
      'cimb': 'cimb.com',
      'public bank': 'publicbank.com.my',
      'rhb': 'rhb.com.my',
      'petronas': 'petronas.com',
      'airasia': 'airasia.com',
      'celcom': 'celcom.com.my',
      'digi': 'digi.com.my',
      'maxis': 'maxis.com.my',
      'unifi': 'unifi.com.my',
      'tm': 'tm.com.my',
      'astro': 'astro.com.my',
      'genting': 'genting.com',
      'nestle': 'nestle.com.my',
      'f&n': 'fn.com.my',
      'carlsberg': 'carlsberg.com.my',
      '99 speedmart': '99speedmart.com.my',
      'mydin': 'mydin.com.my',
      'giant': 'giant.com.my',
      'tesco': 'tesco.com.my',
      'lotus': 'lotuss.com.my',
      'aeon': 'aeon.com.my',
      'parkson': 'parkson.com.my',
      'padini': 'padini.com',
      'bonia': 'bonia.com',
      'habib': 'habib.com.my',
      'poh kong': 'pohkong.com.my',
      'secret recipe': 'secretrecipe.com.my',
      'oldtown': 'oldtown.com.my',
      'mamee': 'mamee.com',
      'gardenia': 'gardenia.com.my',
      'massimo': 'massimo.com.my',
    };

    const mappedDomain = brandMappings[cleanName];
    if (mappedDomain) {
      domains.unshift(mappedDomain);
    }

    return [...new Set(domains)]; // Remove duplicates
  }

  // Generate a fallback logo using UI Avatars
  private static generateFallbackLogo(brandName: string): string {
    const initials = brandName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // UI Avatars API - generates nice letter-based logos
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&size=256&background=6366f1&color=ffffff&bold=true&format=png`;
  }

  // Main method to fetch logo
  public static async fetchLogo(brandName: string): Promise<LogoResult> {
    const domains = this.guessDomain(brandName);
    
    // Try each domain with each service
    for (const domain of domains) {
      // Try Clearbit first (best quality)
      const clearbitLogo = await this.fetchFromClearbit(domain);
      if (clearbitLogo) {
        return { url: clearbitLogo, source: 'clearbit' };
      }

      // Try DuckDuckGo
      const duckduckgoLogo = await this.fetchFromDuckDuckGo(domain);
      if (duckduckgoLogo) {
        return { url: duckduckgoLogo, source: 'duckduckgo' };
      }
    }

    // Try Google as last resort (always returns something)
    if (domains.length > 0) {
      const googleLogo = await this.fetchFromGoogle(domains[0]);
      if (googleLogo) {
        return { url: googleLogo, source: 'google' };
      }
    }

    // Generate fallback logo
    return {
      url: this.generateFallbackLogo(brandName),
      source: 'generated'
    };
  }

  // Upload logo to Supabase storage
  public static async uploadLogoToStorage(logoUrl: string, brandName: string): Promise<string | null> {
    try {
      // Fetch the logo
      const response = await fetch(logoUrl);
      if (!response.ok) throw new Error('Failed to fetch logo');
      
      const blob = await response.blob();
      
      // Generate a unique filename
      const timestamp = Date.now();
      const fileName = `${brandName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.png`;
      const filePath = `brand-logos/${fileName}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('project-documents')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo to storage:', error);
      // Return the original URL as fallback
      return logoUrl;
    }
  }

  // Smart logo fetch with caching
  public static async smartFetchLogo(brandName: string, storeInSupabase = false): Promise<string> {
    try {
      // Check if we already have a cached logo for this brand
      const { data: existingProject } = await supabase
        .from('projects')
        .select('brand_logo')
        .eq('brand_name', brandName)
        .not('brand_logo', 'is', null)
        .limit(1)
        .single();
      
      if (existingProject?.brand_logo) {
        return existingProject.brand_logo;
      }
      
      // Fetch new logo
      const logoResult = await this.fetchLogo(brandName);
      
      // Optionally store in Supabase storage for permanence
      if (storeInSupabase && logoResult.source !== 'generated') {
        const storedUrl = await this.uploadLogoToStorage(logoResult.url, brandName);
        if (storedUrl) {
          return storedUrl;
        }
      }
      
      return logoResult.url;
    } catch (error) {
      console.error('Smart logo fetch failed:', error);
      // Always return a fallback
      return this.generateFallbackLogo(brandName);
    }
  }
}

// Export convenience function
export const fetchBrandLogo = LogoService.smartFetchLogo;