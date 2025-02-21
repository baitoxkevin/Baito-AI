import * as React from 'react';
import { useState, useEffect } from 'react';
import { User } from '../lib/types';
import { supabase } from '../lib/supabase';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '../components/ui/command';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (userId: string) => void;
}

export function MentionInput({ value, onChange, onMention }: MentionInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role')
        .ilike('full_name', `%${search}%`);

      if (!error && data) {
        setUsers(data);
      }
    };

    if (search.startsWith('@')) {
      loadUsers();
    }
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setOpen(true);
    }
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        placeholder="Add a comment... (use @ to mention)"
      />
      {open && (
        <div className="absolute bottom-full w-full mb-1">
          <Command>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search users..."
            />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => {
                      const beforeCursor = value.slice(0, value.lastIndexOf('@'));
                      const afterCursor = value.slice(value.lastIndexOf('@'));
                      onChange(beforeCursor + `@${user.full_name} ` + afterCursor.slice(1));
                      setOpen(false);
                      onMention?.(user.id);
                    }}
                  >
                    <span>{user.full_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {user.role}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
