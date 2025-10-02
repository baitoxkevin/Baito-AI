import React, { useState } from 'react';
import { Check, ChevronDown, Building2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Demo data for showcase
const demoCustomers = [
  { id: '1', name: 'Acme Corporation', logo: '🏢', industry: 'Technology' },
  { id: '2', name: 'Global Tech Solutions', logo: '💻', industry: 'Software' },
  { id: '3', name: 'Creative Design Studio', logo: '🎨', industry: 'Design' },
  { id: '4', name: 'Digital Marketing Agency', logo: '📱', industry: 'Marketing' },
  { id: '5', name: 'Healthcare Innovations', logo: '🏥', industry: 'Healthcare' },
  { id: '6', name: 'Financial Services Ltd', logo: '💰', industry: 'Finance' },
  { id: '7', name: 'Educational Institute', logo: '🎓', industry: 'Education' },
  { id: '8', name: 'Media Production House', logo: '🎬', industry: 'Media' },
  { id: '9', name: 'Retail Chain Network', logo: '🛍️', industry: 'Retail' },
  { id: '10', name: 'Manufacturing Corp', logo: '🏭', industry: 'Manufacturing' },
  { id: '11', name: 'Real Estate Group', logo: '🏠', industry: 'Real Estate' },
  { id: '12', name: 'Transportation Services', logo: '🚚', industry: 'Logistics' },
  { id: '13', name: 'Food & Beverage Co', logo: '🍔', industry: 'F&B' },
  { id: '14', name: 'Sports Management', logo: '⚽', industry: 'Sports' },
  { id: '15', name: 'Entertainment Studios', logo: '🎭', industry: 'Entertainment' },
];

export function SearchableDropdownDemo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const selectedCustomer = demoCustomers.find(c => c.id === value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
            Searchable Dropdown Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Experience the improved customer selection with real-time search filtering
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-500" />
                Instant Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Type to instantly filter through customers
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-green-500">⌨️</span>
                Keyboard Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use arrow keys and Enter to select
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-purple-500">📜</span>
                Efficient Scrolling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Handles long lists with smooth scrolling
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Demo */}
        <Card className="shadow-xl border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Try the Searchable Customer Dropdown</CardTitle>
            <CardDescription>
              Click the dropdown below and start typing to filter {demoCustomers.length} customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Select Customer
              </label>
              
              <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-11 font-normal"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {selectedCustomer ? (
                        <>
                          <span className="text-xl">{selectedCustomer.logo}</span>
                          <span className="truncate">{selectedCustomer.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {selectedCustomer.industry}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Select a customer...</span>
                      )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={true}>
                    <CommandInput 
                      placeholder="Search customers by name or industry..." 
                      className="h-10"
                    />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup heading="Customers">
                        {demoCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.industry}`}
                            onSelect={() => {
                              setValue(customer.id);
                              setOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{customer.logo}</span>
                                <div className="flex flex-col">
                                  <span className="font-medium">{customer.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {customer.industry}
                                  </span>
                                </div>
                              </div>
                              {value === customer.id && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected Customer Display */}
            {selectedCustomer && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Selected Customer:
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedCustomer.logo}</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Industry: {selectedCustomer.industry}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ID: {selectedCustomer.id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Tips */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-200">
              💡 Usage Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>• Start typing immediately after opening the dropdown to filter results</li>
              <li>• Use <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">↑</kbd> <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">↓</kbd> arrow keys to navigate</li>
              <li>• Press <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">Enter</kbd> to select the highlighted item</li>
              <li>• Press <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">Esc</kbd> to close the dropdown</li>
              <li>• The search filters by both company name and industry</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}