import React from 'react';
import { SelectContent, SelectItem } from "@/components/ui/select";

/**
 * Status options component for project forms
 */
export const StatusSelectOptions = () => (
  <SelectContent>
    <SelectItem value="planning">Planning</SelectItem>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="completed">Completed</SelectItem>
    <SelectItem value="cancelled">Cancelled</SelectItem>
  </SelectContent>
);

/**
 * Priority options component for project forms
 */
export const PrioritySelectOptions = () => (
  <SelectContent>
    <SelectItem value="low">Low</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="high">High</SelectItem>
  </SelectContent>
);

/**
 * Event type options for project forms
 */
export const EventTypeOptions = () => (
  <SelectContent>
    <SelectItem value="Standard Event">Standard Event</SelectItem>
    <SelectItem value="Corporate">Corporate</SelectItem>
    <SelectItem value="Wedding">Wedding</SelectItem>
    <SelectItem value="Conference">Conference</SelectItem>
    <SelectItem value="Exhibition">Exhibition</SelectItem>
    <SelectItem value="Concert">Concert</SelectItem>
    <SelectItem value="Festival">Festival</SelectItem>
    <SelectItem value="Gala">Gala</SelectItem>
    <SelectItem value="Team Building">Team Building</SelectItem>
    <SelectItem value="Seminar">Seminar</SelectItem>
    <SelectItem value="Other">Other</SelectItem>
  </SelectContent>
);