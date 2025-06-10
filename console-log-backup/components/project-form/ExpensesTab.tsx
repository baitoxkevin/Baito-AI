import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Receipt, 
  Calendar,
  User,
  FileText,
  X,
  Upload,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string;
  submitted_date: Date;
  receipt_url?: string;
  notes?: string;
}

interface ExpensesTabProps {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  projectId?: string; // Required for database operations
}

const ExpensesTab = ({ expenses, setExpenses, projectId }: ExpensesTabProps) => {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    description: '',
    amount: 0,
    category: 'Materials',
    status: 'pending',
    submitted_by: 'Current User'
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const categories = [
    'Materials',
    'Equipment',
    'Labor',
    'Transportation',
    'Accommodation',
    'Meals',
    'Office Supplies',
    'Other'
  ];

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return;
    
    setUploading(true);
    try {
      let receiptUrl = '';
      
      // Upload receipt if provided
      if (receiptFile && projectId) {
        const fileExt = receiptFile.name.split('.').pop();
        const filePath = `${projectId}/receipts/${Date.now()}-${newExpense.title}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('expense-receipts')
          .upload(filePath, receiptFile);
          
        if (uploadError) throw uploadError;
        
        receiptUrl = filePath;
      }
      
      const expense: Expense = {
        id: `exp-${Date.now()}`,
        title: newExpense.title,
        description: newExpense.description,
        amount: newExpense.amount,
        category: newExpense.category || 'Other',
        status: 'pending',
        submitted_by: newExpense.submitted_by || 'Current User',
        submitted_date: new Date(),
        receipt_url: receiptUrl,
        notes: newExpense.notes
      };
      
      // Update local state
      const updatedExpenses = [...expenses, expense];
      setExpenses(updatedExpenses);
      
      // Update database if projectId is provided
      if (projectId) {
        const { error: dbError } = await supabase
          .from('project_expenses')
          .insert({
            project_id: projectId,
            title: expense.title,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            status: expense.status,
            submitted_by: expense.submitted_by,
            submitted_date: expense.submitted_date,
            receipt_url: expense.receipt_url,
            notes: expense.notes
          });
          
        if (dbError) throw dbError;
      }
      
      // Reset form
      setNewExpense({
        title: '',
        description: '',
        amount: 0,
        category: 'Materials',
        status: 'pending',
        submitted_by: 'Current User'
      });
      setReceiptFile(null);
      setShowAddForm(false);
      
      toast({
        title: "Expense added",
        description: "Expense has been added successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveExpense = async (expenseId: string) => {
    const expenseToRemove = expenses.find(exp => exp.id === expenseId);
    if (!expenseToRemove) return;
    
    try {
      // Remove receipt from storage if exists
      if (projectId && expenseToRemove.receipt_url) {
        const { error: storageError } = await supabase.storage
          .from('expense-receipts')
          .remove([expenseToRemove.receipt_url]);
          
        if (storageError) console.error('Storage deletion error:', storageError);
      }
      
      // Update local state
      const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
      setExpenses(updatedExpenses);
      
      // Update database if projectId is provided
      if (projectId) {
        const { error: dbError } = await supabase
          .from('project_expenses')
          .delete()
          .eq('project_id', projectId)
          .eq('id', expenseId);
          
        if (dbError) throw dbError;
      }
      
      toast({
        title: "Expense removed",
        description: "Expense has been removed successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error removing expense:', error);
      toast({
        title: "Error",
        description: "Failed to remove expense. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateExpenseStatus = async (expenseId: string, newStatus: 'approved' | 'rejected') => {
    try {
      // Update local state
      const updatedExpenses = expenses.map(exp => 
        exp.id === expenseId ? { ...exp, status: newStatus } : exp
      );
      setExpenses(updatedExpenses);
      
      // Update database if projectId is provided
      if (projectId) {
        const { error: dbError } = await supabase
          .from('project_expenses')
          .update({ status: newStatus })
          .eq('project_id', projectId)
          .eq('id', expenseId);
          
        if (dbError) throw dbError;
      }
      
      toast({
        title: "Status updated",
        description: `Expense has been ${newStatus}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating expense status:', error);
      toast({
        title: "Error",
        description: "Failed to update expense status",
        variant: "destructive"
      });
    }
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const approvedAmount = expenses
    .filter(exp => exp.status === 'approved')
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="w-full space-y-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">Project Expenses</h3>
          <p className="text-sm text-gray-500">
            Total: ${totalAmount.toFixed(2)} | Approved: ${approvedAmount.toFixed(2)}
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? "outline" : "default"}
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </>
          )}
        </Button>
      </div>

      {/* Expense List */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="text-center p-6">
            <DollarSign className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No expenses recorded yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{expense.title}</h4>
                      <Badge 
                        variant={
                          expense.status === 'approved' ? 'default' :
                          expense.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {expense.status}
                      </Badge>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-500 mb-2">{expense.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${expense.amount.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {expense.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {expense.submitted_by}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(expense.submitted_date, 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expense.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateExpenseStatus(expense.id, 'approved')}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateExpenseStatus(expense.id, 'rejected')}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Expense Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="expenseTitle">Title*</Label>
                <Input
                  id="expenseTitle"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  placeholder="Expense title"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="expenseAmount">Amount*</Label>
                <Input
                  id="expenseAmount"
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="expenseCategory">Category</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                >
                  <SelectTrigger id="expenseCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="expenseDescription">Description</Label>
                <Textarea
                  id="expenseDescription"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Brief description"
                  rows={2}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="expenseReceipt">Receipt</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/10 transition-colors">
                  <input
                    type="file"
                    id="expenseReceipt"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleReceiptChange}
                  />
                  <label htmlFor="expenseReceipt" className="cursor-pointer">
                    {receiptFile ? (
                      <div className="flex flex-col items-center">
                        <Receipt className="h-8 w-8 text-green-500 mb-2" />
                        <span className="text-sm font-medium">{receiptFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium">Upload receipt</span>
                        <span className="text-xs text-gray-500 mt-1">
                          Image or PDF
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddExpense}
                  disabled={!newExpense.title || !newExpense.amount || uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpensesTab;