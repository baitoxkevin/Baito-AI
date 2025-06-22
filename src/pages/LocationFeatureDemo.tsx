import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Plus, Calendar, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LocationFeatureDemo() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Multiple Locations Feature
        </h1>
        <p className="text-lg text-muted-foreground">
          Perfect for events happening at multiple venues on the same or different days
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              When Creating New Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Step-by-step process:</p>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-purple-600">1.</span>
                  Click "+ New Project" in Projects page
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-purple-600">2.</span>
                  Fill basic info (name, customer, manager)
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-purple-600">3.</span>
                  Add event details (type, description)
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-purple-600">4.</span>
                  <strong>In Location step → Find "Multiple Locations" section</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-purple-600">5.</span>
                  Add all your venues with dates
                </li>
              </ol>
            </div>
            <Button 
              onClick={() => navigate('/projects')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Go to Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-pink-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-pink-600" />
              Your Ticket Promoter Example
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Mid Valley Megamall
                </p>
                <p className="text-xs text-muted-foreground">June 14 • Primary location • 2 promoters</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Aeon AU2
                </p>
                <p className="text-xs text-muted-foreground">June 14 • Afternoon shift • 2 promoters</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Lotus's Ampang
                </p>
                <p className="text-xs text-muted-foreground">June 15 • Weekend team • 2 promoters</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Mytown Shopping Centre
                </p>
                <p className="text-xs text-muted-foreground">June 15 • Morning only • 2 promoters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-dashed border-muted-foreground/25">
        <CardHeader>
          <CardTitle>Visual Guide: Where to Find It</CardTitle>
          <CardDescription>The Multiple Locations feature appears in these places:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold">New Project Dialog → Location Step</p>
                <p className="text-sm text-muted-foreground">
                  After filling venue address, scroll down to see "Multiple Locations" section
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold">Edit Project Dialog → Location Step</p>
                <p className="text-sm text-muted-foreground">
                  Same location as new project dialog, shows existing locations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-600">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold">Review Step</p>
                <p className="text-sm text-muted-foreground">
                  All locations are displayed in the final review before creating/updating
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <p className="text-sm font-medium mb-2">💡 Pro Tip:</p>
            <p className="text-sm text-muted-foreground">
              The component is scrollable! If you have many locations, you can scroll within the locations section 
              without losing your place in the dialog.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-4">
        <Button 
          variant="outline"
          onClick={() => navigate('/test-multiple-locations')}
        >
          <MapPin className="mr-2 h-4 w-4" />
          Try Demo Component
        </Button>
        <Button 
          onClick={() => navigate('/projects')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Create Real Project
        </Button>
      </div>
    </div>
  );
}