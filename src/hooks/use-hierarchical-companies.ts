import { useState, useEffect } from 'react';
import { fetchHierarchicalCompanies } from '@/lib/utils';
import type { Company } from '@/lib/types';

export interface HierarchicalCompany extends Company {
  child_companies?: HierarchicalCompany[];
  level?: number;
  path?: string[];
  isExpanded?: boolean;
}

interface UseHierarchicalCompaniesResult {
  companies: HierarchicalCompany[];
  flatCompanies: HierarchicalCompany[];
  isLoading: boolean;
  error: Error | null;
  toggleExpand: (companyId: string) => void;
  refreshCompanies: () => Promise<void>;
  getCompanyById: (id: string) => HierarchicalCompany | undefined;
  getCompanyPath: (id: string) => HierarchicalCompany[] | undefined;
  selectableCompanies: { label: string; value: string }[];
}

/**
 * Custom hook to fetch and manage hierarchical company data
 */
export function useHierarchicalCompanies(): UseHierarchicalCompaniesResult {
  const [companies, setCompanies] = useState<HierarchicalCompany[]>([]);
  const [flatCompanies, setFlatCompanies] = useState<HierarchicalCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Add level information and path to companies
  const addLevelInfo = (
    companies: HierarchicalCompany[], 
    level = 0, 
    parentPath: string[] = []
  ): HierarchicalCompany[] => {
    return companies.map(company => {
      const path = [...parentPath, company.id];
      const result: HierarchicalCompany = {
        ...company,
        level,
        path,
        isExpanded: level < 1 // Auto-expand first level
      };
      
      if (company.child_companies && company.child_companies.length > 0) {
        result.child_companies = addLevelInfo(company.child_companies, level + 1, path);
      }
      
      return result;
    });
  };

  // Flatten tree for display
  const flattenTree = (
    tree: HierarchicalCompany[], 
    result: HierarchicalCompany[] = []
  ): HierarchicalCompany[] => {
    tree.forEach(node => {
      result.push(node);
      if (node.child_companies && node.isExpanded) {
        flattenTree(node.child_companies, result);
      }
    });
    return result;
  };

  // Toggle expand/collapse state
  const toggleExpand = (companyId: string) => {
    setCompanies(prevCompanies => {
      // Create a deep copy to avoid direct state mutation
      const newCompanies = JSON.parse(JSON.stringify(prevCompanies));
      
      // Helper function to find and toggle the node
      const toggleNode = (nodes: HierarchicalCompany[]): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === companyId) {
            nodes[i].isExpanded = !nodes[i].isExpanded;
            return true;
          }
          if (nodes[i].child_companies) {
            if (toggleNode(nodes[i].child_companies)) {
              return true;
            }
          }
        }
        return false;
      };
      
      toggleNode(newCompanies);
      
      // Update flat list for display
      setFlatCompanies(flattenTree(newCompanies));
      
      return newCompanies;
    });
  };

  // Get company by ID recursively
  const getCompanyById = (id: string): HierarchicalCompany | undefined => {
    const findCompany = (companies: HierarchicalCompany[]): HierarchicalCompany | undefined => {
      for (const company of companies) {
        if (company.id === id) {
          return company;
        }
        if (company.child_companies) {
          const found = findCompany(company.child_companies);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    return findCompany(companies);
  };

  // Get company path (array of companies from root to the target)
  const getCompanyPath = (id: string): HierarchicalCompany[] | undefined => {
    const company = getCompanyById(id);
    if (!company || !company.path) return undefined;
    
    return company.path.map(pathId => {
      const company = getCompanyById(pathId);
      if (!company) throw new Error(`Company with id ${pathId} not found in path`);
      return company;
    });
  };

  // Create formatted options for select components
  const getSelectableCompanies = (): { label: string; value: string }[] => {
    return flatCompanies.map(company => {
      // Create indentation based on level
      const indent = company.level ? '—'.repeat(company.level) + ' ' : '';
      return {
        label: `${indent}${company.company_name}`,
        value: company.id
      };
    });
  };

  // Load companies data
  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const hierarchicalCompanies = await fetchHierarchicalCompanies();
      const companiesWithLevels = addLevelInfo(hierarchicalCompanies);
      
      setCompanies(companiesWithLevels);
      setFlatCompanies(flattenTree(companiesWithLevels));
    } catch (err) {
      console.error('Error loading hierarchical companies:', err);
      setError(err instanceof Error ? err : new Error('Failed to load companies'));
      // Set empty arrays to prevent undefined errors in UI
      setCompanies([]);
      setFlatCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh companies data
  const refreshCompanies = async () => {
    await loadCompanies();
  };

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  return {
    companies,
    flatCompanies,
    isLoading,
    error,
    toggleExpand,
    refreshCompanies,
    getCompanyById,
    getCompanyPath,
    selectableCompanies: getSelectableCompanies()
  };
}