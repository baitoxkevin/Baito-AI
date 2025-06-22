import React, { useState } from 'react';
import { ProjectLocationManager } from '@/components/ProjectLocationManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ProjectLocation } from '@/lib/types';

export default function TestMultipleLocations() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Partial<ProjectLocation>[]>([
    {
      address: 'Mid Valley Megamall, Lingkaran Syed Putra, 59200 Kuala Lumpur',
      date: new Date('2025-06-14').toISOString(),
      is_primary: true,
      notes: 'Main event location, use entrance A'
    },
    {
      address: 'Aeon AU2, Setiawangsa, 54200 Kuala Lumpur',
      date: new Date('2025-06-14').toISOString(),
      is_primary: false,
      notes: 'Secondary location, afternoon shift'
    },
    {
      address: "Lotus's Ampang, Jalan Pandan Indah, 55100 Kuala Lumpur",
      date: new Date('2025-06-15').toISOString(),
      is_primary: false,
      notes: 'Weekend location'
    }
  ]);

  const projectDates = {
    start: new Date('2025-06-14'),
    end: new Date('2025-06-15')
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Test Multiple Locations</h1>
        <p className="text-muted-foreground">
          Testing the multiple locations feature for projects happening at different venues
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project: Ticket Promoter Event</CardTitle>
          <CardDescription>
            Event dates: June 14-15, 2025 • 11pm - 7pm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectLocationManager
            locations={locations}
            onChange={setLocations}
            projectDates={projectDates}
          />
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Current Locations Data:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(locations, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}